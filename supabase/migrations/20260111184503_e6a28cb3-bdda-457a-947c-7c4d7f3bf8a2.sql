-- =============================================================================
-- SECURITY HARDENING MIGRATION
-- Fixes: Unauthenticated INSERT on customers, orders, order_items
-- Creates: Secure view for public store data (hiding owner identity)
-- =============================================================================

-- Drop overly permissive INSERT policies on customers table
-- Customer creation should ONLY happen through the secured RPC function
DROP POLICY IF EXISTS "Anyone can create customers for active stores" ON customers;

-- Drop overly permissive INSERT policies on orders table
DROP POLICY IF EXISTS "Anyone can create orders for active stores" ON orders;

-- Drop overly permissive INSERT policies on order_items table
DROP POLICY IF EXISTS "Anyone can create order items for active store orders" ON order_items;

-- Create new secure INSERT policy for orders (authenticated users only)
CREATE POLICY "Authenticated users can create orders for active stores" ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = orders.store_id 
      AND stores.status = 'active'::store_status
    )
  );

-- Create new secure INSERT policy for order_items (authenticated users only)
CREATE POLICY "Authenticated users can create order items" ON order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      JOIN stores s ON s.id = o.store_id
      WHERE o.id = order_items.order_id 
      AND s.status = 'active'::store_status
    )
  );

-- =============================================================================
-- PUBLIC STORE VIEW - Hides sensitive owner data
-- =============================================================================

-- Create a view for public store information that excludes sensitive fields
-- Excludes: owner_id, email, phone, address, city
CREATE OR REPLACE VIEW public.public_stores AS
SELECT 
  id,
  name,
  slug,
  description,
  logo_url,
  banner_url,
  business_type,
  business_category,
  status,
  settings,
  created_at
FROM stores
WHERE status = 'active'::store_status;

-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.public_stores TO anon, authenticated;