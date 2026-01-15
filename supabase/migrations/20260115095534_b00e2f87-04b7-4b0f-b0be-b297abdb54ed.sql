-- Add RLS policy for customers to update their own records
-- This allows authenticated users to update customer records that are linked to their user_id

CREATE POLICY "Customers can update their own records"
ON public.customers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Also add a SELECT policy for customers to view their own records
CREATE POLICY "Customers can view their own records"
ON public.customers FOR SELECT
TO authenticated
USING (user_id = auth.uid());