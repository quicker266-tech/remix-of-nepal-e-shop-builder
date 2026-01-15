-- ============================================================================
-- STORE-SPECIFIC CUSTOMER AUTHENTICATION SYSTEM
-- ============================================================================
-- Creates a completely separate auth system for store customers, independent
-- from the platform's auth.users. Each store has its own customer accounts.
-- ============================================================================

-- 1) Create store_customer_accounts table for per-store login credentials
CREATE TABLE IF NOT EXISTS public.store_customer_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  email text NOT NULL,
  password_hash text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(store_id, email)
);

-- Enable RLS
ALTER TABLE public.store_customer_accounts ENABLE ROW LEVEL SECURITY;

-- No direct access to this table from clients (only via functions)
-- RLS policy: deny all direct access
CREATE POLICY "No direct access to store_customer_accounts"
ON public.store_customer_accounts
FOR ALL
USING (false);

-- 2) Create store_customer_sessions table for session management
CREATE TABLE IF NOT EXISTS public.store_customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.store_customer_accounts(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.store_customer_sessions ENABLE ROW LEVEL SECURITY;

-- No direct access to this table from clients (only via functions)
CREATE POLICY "No direct access to store_customer_sessions"
ON public.store_customer_sessions
FOR ALL
USING (false);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_store_customer_sessions_token_hash 
ON public.store_customer_sessions(token_hash);

-- Index for cleanup of expired sessions
CREATE INDEX IF NOT EXISTS idx_store_customer_sessions_expires_at 
ON public.store_customer_sessions(expires_at);

-- 3) Create function to register a store customer
CREATE OR REPLACE FUNCTION public.store_customer_register(
  p_store_id uuid,
  p_email text,
  p_password_hash text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_customer_id uuid;
  v_account_id uuid;
  v_existing_account_id uuid;
BEGIN
  -- Validate inputs
  IF p_store_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Store ID is required');
  END IF;
  
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email is required');
  END IF;
  
  IF p_password_hash IS NULL OR trim(p_password_hash) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Password is required');
  END IF;

  -- Normalize email
  p_email := lower(trim(p_email));

  -- Check if account already exists for this store
  SELECT id INTO v_existing_account_id
  FROM public.store_customer_accounts
  WHERE store_id = p_store_id AND email = p_email;

  IF v_existing_account_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'An account with this email already exists');
  END IF;

  -- Check if customer record exists (might have been created via guest checkout)
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE store_id = p_store_id AND email = p_email;

  IF v_customer_id IS NULL THEN
    -- Create new customer
    INSERT INTO public.customers (store_id, email, full_name, phone)
    VALUES (p_store_id, p_email, p_full_name, p_phone)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update existing customer with any new info
    UPDATE public.customers
    SET 
      full_name = COALESCE(p_full_name, full_name),
      phone = COALESCE(p_phone, phone),
      updated_at = now()
    WHERE id = v_customer_id;
  END IF;

  -- Create the account
  INSERT INTO public.store_customer_accounts (store_id, email, password_hash, customer_id)
  VALUES (p_store_id, p_email, p_password_hash, v_customer_id)
  RETURNING id INTO v_account_id;

  RETURN jsonb_build_object(
    'success', true,
    'account_id', v_account_id,
    'customer_id', v_customer_id
  );
END;
$$;

-- 4) Create function to validate login and create session
CREATE OR REPLACE FUNCTION public.store_customer_login(
  p_store_id uuid,
  p_email text,
  p_password_hash text,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_account record;
  v_session_id uuid;
  v_expires_at timestamptz;
BEGIN
  -- Normalize email
  p_email := lower(trim(p_email));

  -- Find account
  SELECT sca.id, sca.customer_id, sca.password_hash, c.full_name, c.email
  INTO v_account
  FROM public.store_customer_accounts sca
  JOIN public.customers c ON c.id = sca.customer_id
  WHERE sca.store_id = p_store_id AND sca.email = p_email;

  IF v_account IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Verify password (comparison done in edge function, we receive the hash)
  IF v_account.password_hash <> p_password_hash THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Set expiry to 7 days from now
  v_expires_at := now() + interval '7 days';

  -- Create session
  INSERT INTO public.store_customer_sessions (account_id, store_id, customer_id, token_hash, expires_at)
  VALUES (v_account.id, p_store_id, v_account.customer_id, p_token_hash, v_expires_at)
  RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session_id,
    'customer_id', v_account.customer_id,
    'email', v_account.email,
    'full_name', v_account.full_name,
    'expires_at', v_expires_at
  );
END;
$$;

-- 5) Create function to validate a session token
CREATE OR REPLACE FUNCTION public.store_customer_validate_session(
  p_store_id uuid,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session record;
  v_customer record;
BEGIN
  -- Find valid session
  SELECT s.id, s.customer_id, s.expires_at
  INTO v_session
  FROM public.store_customer_sessions s
  WHERE s.store_id = p_store_id 
    AND s.token_hash = p_token_hash
    AND s.expires_at > now();

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Get customer data
  SELECT id, email, full_name, phone, address, city
  INTO v_customer
  FROM public.customers
  WHERE id = v_session.customer_id;

  -- Update last used
  UPDATE public.store_customer_sessions
  SET last_used_at = now()
  WHERE id = v_session.id;

  RETURN jsonb_build_object(
    'success', true,
    'customer_id', v_customer.id,
    'email', v_customer.email,
    'full_name', v_customer.full_name,
    'phone', v_customer.phone,
    'address', v_customer.address,
    'city', v_customer.city,
    'expires_at', v_session.expires_at
  );
END;
$$;

-- 6) Create function to logout (invalidate session)
CREATE OR REPLACE FUNCTION public.store_customer_logout(
  p_store_id uuid,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.store_customer_sessions
  WHERE store_id = p_store_id AND token_hash = p_token_hash;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 7) Create function to update customer profile (requires valid session)
CREATE OR REPLACE FUNCTION public.store_customer_update_profile(
  p_store_id uuid,
  p_token_hash text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session record;
BEGIN
  -- Validate session
  SELECT s.id, s.customer_id
  INTO v_session
  FROM public.store_customer_sessions s
  WHERE s.store_id = p_store_id 
    AND s.token_hash = p_token_hash
    AND s.expires_at > now();

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Update customer
  UPDATE public.customers
  SET 
    full_name = COALESCE(p_full_name, full_name),
    phone = COALESCE(p_phone, phone),
    address = COALESCE(p_address, address),
    city = COALESCE(p_city, city),
    updated_at = now()
  WHERE id = v_session.customer_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- 8) Create function to get customer orders (requires valid session)
CREATE OR REPLACE FUNCTION public.store_customer_get_orders(
  p_store_id uuid,
  p_token_hash text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_session record;
  v_orders jsonb;
BEGIN
  -- Validate session
  SELECT s.id, s.customer_id
  INTO v_session
  FROM public.store_customer_sessions s
  WHERE s.store_id = p_store_id 
    AND s.token_hash = p_token_hash
    AND s.expires_at > now();

  IF v_session IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Get orders with items
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', o.id,
      'order_number', o.order_number,
      'status', o.status,
      'subtotal', o.subtotal,
      'shipping_amount', o.shipping_amount,
      'total', o.total,
      'created_at', o.created_at,
      'items', (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'id', oi.id,
            'product_name', oi.product_name,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price
          )
        ), '[]'::jsonb)
        FROM public.order_items oi
        WHERE oi.order_id = o.id
      )
    ) ORDER BY o.created_at DESC
  ), '[]'::jsonb)
  INTO v_orders
  FROM public.orders o
  WHERE o.customer_id = v_session.customer_id
    AND o.store_id = p_store_id;

  RETURN jsonb_build_object('success', true, 'orders', v_orders);
END;
$$;

-- 9) Cleanup function for expired sessions (can be called periodically)
CREATE OR REPLACE FUNCTION public.cleanup_expired_store_customer_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM public.store_customer_sessions
  WHERE expires_at < now();
END;
$$;

-- Add updated_at trigger to store_customer_accounts
CREATE TRIGGER update_store_customer_accounts_updated_at
BEFORE UPDATE ON public.store_customer_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();