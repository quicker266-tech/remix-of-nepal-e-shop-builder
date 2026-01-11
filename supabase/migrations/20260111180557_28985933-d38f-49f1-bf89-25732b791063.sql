-- Remove the overly permissive UPDATE policy on customers table
-- Only allow updates through the SECURITY DEFINER RPC function
DROP POLICY IF EXISTS "Anyone can update customers for active stores" ON customers;

-- Create a more restrictive policy that only allows store owners to directly update customers
-- Customer updates during checkout should happen via the create_or_update_checkout_customer RPC
CREATE POLICY "Store owners can update customers" ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  );