-- Fix the public_stores view to use SECURITY INVOKER (default) instead of SECURITY DEFINER
-- This ensures the view respects the calling user's permissions

DROP VIEW IF EXISTS public.public_stores;

CREATE VIEW public.public_stores 
WITH (security_invoker = true) AS
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