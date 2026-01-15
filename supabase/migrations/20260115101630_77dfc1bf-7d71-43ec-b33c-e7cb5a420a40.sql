-- Fix customer/store isolation and prevent cross-store account takeover
-- 1) Harden get_or_create_store_customer to:
--    - Require caller is authenticated
--    - Require p_user_id matches auth.uid()
--    - Require p_email matches the caller's JWT email
--    - Never overwrite an existing customer.user_id that belongs to someone else
--    - Ensure customer.user_id is set when a store_customers link already exists
-- 2) Backfill customers.user_id from store_customers where missing

CREATE OR REPLACE FUNCTION public.get_or_create_store_customer(
  p_store_id uuid,
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL::text,
  p_phone text DEFAULT NULL::text,
  p_address text DEFAULT NULL::text,
  p_city text DEFAULT NULL::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_existing_user_id uuid;
  v_jwt_email text;
BEGIN
  -- Auth hardening
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
    RAISE EXCEPTION 'Invalid user';
  END IF;

  v_jwt_email := lower(coalesce(auth.jwt() ->> 'email', ''));
  IF v_jwt_email = '' THEN
    RAISE EXCEPTION 'Authenticated email not available';
  END IF;

  IF p_email IS NULL OR lower(p_email) <> v_jwt_email THEN
    RAISE EXCEPTION 'Email mismatch';
  END IF;

  -- Check if store_customer link exists
  SELECT customer_id INTO v_customer_id
  FROM public.store_customers
  WHERE store_id = p_store_id AND user_id = p_user_id;

  IF v_customer_id IS NOT NULL THEN
    -- Ensure the customer row is actually owned by this user (or unclaimed)
    SELECT user_id INTO v_existing_user_id
    FROM public.customers
    WHERE id = v_customer_id;

    IF v_existing_user_id IS NOT NULL AND v_existing_user_id <> p_user_id THEN
      RAISE EXCEPTION 'Customer already linked to another user';
    END IF;

    UPDATE public.customers
    SET
      user_id = COALESCE(user_id, p_user_id),
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      address = COALESCE(p_address, address),
      city = COALESCE(p_city, city),
      updated_at = now()
    WHERE id = v_customer_id;

    RETURN v_customer_id;
  END IF;

  -- Check if customer exists by email for this store
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE store_id = p_store_id AND email = p_email;

  IF v_customer_id IS NULL THEN
    -- Create new customer (claimed by this user)
    INSERT INTO public.customers (store_id, email, full_name, phone, address, city, user_id)
    VALUES (p_store_id, p_email, p_full_name, p_phone, p_address, p_city, p_user_id)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Ensure we don't steal an existing claimed customer
    SELECT user_id INTO v_existing_user_id
    FROM public.customers
    WHERE id = v_customer_id;

    IF v_existing_user_id IS NOT NULL AND v_existing_user_id <> p_user_id THEN
      RAISE EXCEPTION 'Customer already linked to another user';
    END IF;

    UPDATE public.customers
    SET
      user_id = COALESCE(user_id, p_user_id),
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      address = COALESCE(p_address, address),
      city = COALESCE(p_city, city),
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- Create store_customer link
  INSERT INTO public.store_customers (store_id, user_id, customer_id)
  VALUES (p_store_id, p_user_id, v_customer_id)
  ON CONFLICT (store_id, user_id)
  DO UPDATE SET customer_id = EXCLUDED.customer_id;

  RETURN v_customer_id;
END;
$$;

-- Backfill any historical rows where store_customers exists but customers.user_id is NULL
UPDATE public.customers c
SET user_id = sc.user_id,
    updated_at = now()
FROM public.store_customers sc
WHERE sc.customer_id = c.id
  AND c.user_id IS NULL;
