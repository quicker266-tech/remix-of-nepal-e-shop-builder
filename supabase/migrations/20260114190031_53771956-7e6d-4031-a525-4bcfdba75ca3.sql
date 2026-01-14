-- Fix for ON CONFLICT error in auto_initialize_store_pages trigger
-- The trigger uses "ON CONFLICT (store_id) WHERE is_active = true" 
-- but no matching unique partial index exists

CREATE UNIQUE INDEX IF NOT EXISTS unique_active_theme_per_store 
ON public.store_themes (store_id) 
WHERE is_active = true;