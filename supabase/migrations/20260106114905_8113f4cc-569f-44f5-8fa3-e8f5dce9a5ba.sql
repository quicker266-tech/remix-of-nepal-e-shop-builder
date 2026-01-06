-- Change default store status from 'pending' to 'active'
-- Store owners can now publish their stores directly without admin approval

ALTER TABLE public.stores 
ALTER COLUMN status SET DEFAULT 'active'::store_status;