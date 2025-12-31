-- ============================================================================
-- STORE SHIPPING SETTINGS TABLE
-- ============================================================================
CREATE TABLE public.store_shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  enable_shipping BOOLEAN DEFAULT true,
  free_shipping_threshold NUMERIC,
  default_shipping_rate NUMERIC DEFAULT 0,
  shipping_zones JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id)
);

-- Enable RLS
ALTER TABLE public.store_shipping_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view shipping settings of active stores"
ON public.store_shipping_settings
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM stores
  WHERE stores.id = store_shipping_settings.store_id
  AND stores.status = 'active'::store_status
));

CREATE POLICY "Store members can manage shipping settings"
ON public.store_shipping_settings
FOR ALL
USING (can_access_store(auth.uid(), store_id));

-- Trigger for updated_at
CREATE TRIGGER update_store_shipping_settings_updated_at
BEFORE UPDATE ON public.store_shipping_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- STORE EXTENSIONS TABLE
-- ============================================================================
CREATE TABLE public.store_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  extension_id TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(store_id, extension_id)
);

-- Enable RLS
ALTER TABLE public.store_extensions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Store members can view their extensions"
ON public.store_extensions
FOR SELECT
USING (can_access_store(auth.uid(), store_id));

CREATE POLICY "Store members can manage extensions"
ON public.store_extensions
FOR ALL
USING (can_access_store(auth.uid(), store_id));