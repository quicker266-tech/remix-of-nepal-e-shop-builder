-- Update auto_initialize_store_pages to use HSL format for theme colors
CREATE OR REPLACE FUNCTION public.auto_initialize_store_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Initialize pages
  PERFORM public.initialize_store_pages(
    NEW.id,
    COALESCE(NEW.business_type, 'ecommerce'),
    COALESCE(NEW.business_category, 'general')
  );
  
  -- 2. Create header/footer config
  INSERT INTO public.store_header_footer (store_id, header_config, footer_config, social_links)
  VALUES (
    NEW.id,
    jsonb_build_object(
      'layout', 'logo-left',
      'sticky', true,
      'showSearch', true,
      'showCart', true,
      'showAccount', false
    ),
    jsonb_build_object(
      'layout', 'simple',
      'showSocial', false,
      'showNewsletter', false,
      'showPaymentIcons', true,
      'copyrightText', '© ' || EXTRACT(YEAR FROM NOW())::text || ' ' || NEW.name || '. All rights reserved.'
    ),
    '{}'::jsonb
  )
  ON CONFLICT (store_id) DO NOTHING;
  
  -- 3. Create theme config with HSL colors (matching DEFAULT_THEME in constants.ts)
  INSERT INTO public.store_themes (store_id, name, is_active, colors, typography, layout)
  VALUES (
    NEW.id,
    'Default Theme',
    true,
    jsonb_build_object(
      'primary', '222 47% 31%',
      'secondary', '210 40% 96%',
      'accent', '217 91% 60%',
      'background', '0 0% 100%',
      'foreground', '222 47% 11%',
      'muted', '210 40% 96%',
      'mutedForeground', '215 16% 47%',
      'border', '214 32% 91%',
      'success', '142 76% 36%',
      'warning', '38 92% 50%',
      'error', '0 84% 60%'
    ),
    jsonb_build_object(
      'headingFont', 'Plus Jakarta Sans',
      'bodyFont', 'Plus Jakarta Sans',
      'baseFontSize', '16px',
      'headingWeight', '700',
      'bodyWeight', '400'
    ),
    jsonb_build_object(
      'containerMaxWidth', '1280px',
      'sectionPadding', '4rem',
      'borderRadius', '0.5rem'
    )
  )
  ON CONFLICT (store_id) WHERE is_active = true DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Backfill existing stores with hex format to HSL
UPDATE store_themes
SET colors = jsonb_build_object(
  'primary', '222 47% 31%',
  'secondary', '210 40% 96%',
  'accent', '217 91% 60%',
  'background', '0 0% 100%',
  'foreground', '222 47% 11%',
  'muted', '210 40% 96%',
  'mutedForeground', '215 16% 47%',
  'border', '214 32% 91%',
  'success', '142 76% 36%',
  'warning', '38 92% 50%',
  'error', '0 84% 60%'
)
WHERE colors->>'primary' LIKE '#%';