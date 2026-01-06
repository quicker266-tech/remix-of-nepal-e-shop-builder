-- 1. Drop the conflicting ALL policy that blocks anonymous customer creation
DROP POLICY IF EXISTS "Store members can manage customers" ON public.customers;

-- 2. Create SECURITY DEFINER function to handle checkout customer creation/update
CREATE OR REPLACE FUNCTION public.create_or_update_checkout_customer(
  p_store_id uuid,
  p_email text,
  p_full_name text,
  p_phone text,
  p_address text,
  p_city text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_store_active boolean;
BEGIN
  -- Verify store is active (security check)
  SELECT (status = 'active') INTO v_store_active
  FROM stores WHERE id = p_store_id;
  
  IF NOT v_store_active THEN
    RAISE EXCEPTION 'Store is not active';
  END IF;

  -- Try to find existing customer
  SELECT id INTO v_customer_id
  FROM customers
  WHERE store_id = p_store_id AND email = p_email;
  
  IF v_customer_id IS NOT NULL THEN
    -- Update existing customer
    UPDATE customers SET
      full_name = p_full_name,
      phone = p_phone,
      address = p_address,
      city = p_city,
      updated_at = now()
    WHERE id = v_customer_id;
  ELSE
    -- Create new customer
    INSERT INTO customers (store_id, email, full_name, phone, address, city)
    VALUES (p_store_id, p_email, p_full_name, p_phone, p_address, p_city)
    RETURNING id INTO v_customer_id;
  END IF;
  
  RETURN v_customer_id;
END;
$$;