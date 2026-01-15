-- ============================================================================
-- PHASE 3: Customer Authentication & Secure Order Placement
-- ============================================================================

-- 1. Create store_customers linking table (store-specific customer accounts)
CREATE TABLE IF NOT EXISTS public.store_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(store_id, user_id)
);

-- Enable RLS on store_customers
ALTER TABLE public.store_customers ENABLE ROW LEVEL SECURITY;

-- Users can view their own store_customer records
CREATE POLICY "Users can view their own store customer records"
ON public.store_customers
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own store customer records
CREATE POLICY "Users can create their own store customer records"
ON public.store_customers
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Store owners/staff can view all customers for their store
CREATE POLICY "Store members can view store customers"
ON public.store_customers
FOR SELECT
USING (
  public.can_access_store(store_id, auth.uid())
);

-- 2. Create secure order placement function (security definer)
CREATE OR REPLACE FUNCTION public.place_checkout_order(
  p_store_id uuid,
  p_customer_id uuid,
  p_items jsonb,
  p_shipping_address jsonb,
  p_notes text DEFAULT NULL,
  p_shipping_amount numeric DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_id uuid;
  v_order_number text;
  v_subtotal numeric := 0;
  v_total numeric := 0;
  v_item jsonb;
  v_product_id uuid;
  v_product_store_id uuid;
  v_store_status text;
BEGIN
  -- Validate store exists and is active
  SELECT status INTO v_store_status
  FROM public.stores
  WHERE id = p_store_id;
  
  IF v_store_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Store not found');
  END IF;
  
  IF v_store_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Store is not active');
  END IF;
  
  -- Validate all products belong to this store
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    
    IF v_product_id IS NOT NULL THEN
      SELECT store_id INTO v_product_store_id
      FROM public.products
      WHERE id = v_product_id;
      
      IF v_product_store_id IS NULL OR v_product_store_id != p_store_id THEN
        RETURN jsonb_build_object('success', false, 'error', 'Product does not belong to this store: ' || v_product_id::text);
      END IF;
    END IF;
    
    -- Calculate subtotal
    v_subtotal := v_subtotal + ((v_item->>'unit_price')::numeric * (v_item->>'quantity')::integer);
  END LOOP;
  
  -- Calculate total
  v_total := v_subtotal + COALESCE(p_shipping_amount, 0);
  
  -- Generate order number
  v_order_number := 'ORD-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 8);
  
  -- Create order
  INSERT INTO public.orders (
    id,
    store_id,
    customer_id,
    order_number,
    status,
    subtotal,
    shipping_amount,
    total,
    shipping_address,
    notes
  ) VALUES (
    gen_random_uuid(),
    p_store_id,
    p_customer_id,
    v_order_number,
    'pending',
    v_subtotal,
    p_shipping_amount,
    v_total,
    p_shipping_address,
    p_notes
  )
  RETURNING id INTO v_order_id;
  
  -- Create order items
  INSERT INTO public.order_items (
    order_id,
    product_id,
    variant_id,
    product_name,
    variant_name,
    sku,
    quantity,
    unit_price,
    total_price
  )
  SELECT
    v_order_id,
    (item->>'product_id')::uuid,
    NULLIF(item->>'variant_id', '')::uuid,
    item->>'product_name',
    item->>'variant_name',
    item->>'sku',
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric,
    (item->>'unit_price')::numeric * (item->>'quantity')::integer
  FROM jsonb_array_elements(p_items) AS item;
  
  -- Update customer stats if customer exists
  IF p_customer_id IS NOT NULL THEN
    UPDATE public.customers
    SET 
      total_orders = COALESCE(total_orders, 0) + 1,
      total_spent = COALESCE(total_spent, 0) + v_total,
      updated_at = now()
    WHERE id = p_customer_id;
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'total', v_total
  );
END;
$$;

-- 3. Function to get or create store customer
CREATE OR REPLACE FUNCTION public.get_or_create_store_customer(
  p_store_id uuid,
  p_user_id uuid,
  p_email text,
  p_full_name text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_city text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_customer_id uuid;
  v_store_customer_id uuid;
BEGIN
  -- Check if store_customer link exists
  SELECT customer_id INTO v_customer_id
  FROM public.store_customers
  WHERE store_id = p_store_id AND user_id = p_user_id;
  
  IF v_customer_id IS NOT NULL THEN
    -- Update customer info if provided
    UPDATE public.customers
    SET 
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
    -- Create new customer
    INSERT INTO public.customers (store_id, email, full_name, phone, address, city, user_id)
    VALUES (p_store_id, p_email, p_full_name, p_phone, p_address, p_city, p_user_id)
    RETURNING id INTO v_customer_id;
  ELSE
    -- Update existing customer with user_id link
    UPDATE public.customers
    SET 
      user_id = p_user_id,
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
  ON CONFLICT (store_id, user_id) DO UPDATE SET customer_id = v_customer_id;
  
  RETURN v_customer_id;
END;
$$;

-- 4. Add RLS policy for customers to view their own orders
CREATE POLICY "Customers can view their own orders"
ON public.orders
FOR SELECT
USING (
  customer_id IN (
    SELECT c.id FROM public.customers c
    WHERE c.user_id = auth.uid()
  )
);

-- 5. Add trigger for store_customers updated_at
CREATE TRIGGER update_store_customers_updated_at
BEFORE UPDATE ON public.store_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();