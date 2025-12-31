-- Allow guests to create customers for active stores
CREATE POLICY "Anyone can create customers for active stores"
ON public.customers FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_id AND stores.status = 'active'
  )
);

-- Allow guests to create orders for active stores
CREATE POLICY "Anyone can create orders for active stores"
ON public.orders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_id AND stores.status = 'active'
  )
);

-- Allow guests to create order items for orders in active stores
CREATE POLICY "Anyone can create order items for active store orders"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders o
    JOIN stores s ON s.id = o.store_id
    WHERE o.id = order_id AND s.status = 'active'
  )
);

-- Allow guests to update their customer record (for returning customers)
CREATE POLICY "Anyone can update customers for active stores"
ON public.customers FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = store_id AND stores.status = 'active'
  )
);