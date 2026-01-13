-- Extend the auto_initialize_store_pages function to also create header/footer and theme
CREATE OR REPLACE FUNCTION public.auto_initialize_store_pages()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- 1. Initialize pages (existing logic)
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
  
  -- 3. Create theme config
  INSERT INTO public.store_themes (store_id, name, is_active, colors, typography, layout)
  VALUES (
    NEW.id,
    'Default Theme',
    true,
    jsonb_build_object(
      'primary', '#000000',
      'secondary', '#666666',
      'accent', '#3b82f6',
      'background', '#ffffff',
      'foreground', '#000000',
      'muted', '#f5f5f5',
      'border', '#e5e5e5'
    ),
    jsonb_build_object(
      'headingFont', 'Inter',
      'bodyFont', 'Inter',
      'baseSize', '16px'
    ),
    jsonb_build_object(
      'containerWidth', '1200px',
      'spacing', 'normal'
    )
  )
  ON CONFLICT (store_id) WHERE is_active = true DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Backfill: Create header_footer for stores that don't have one
INSERT INTO store_header_footer (store_id, header_config, footer_config, social_links)
SELECT 
  s.id,
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
    'copyrightText', '© ' || EXTRACT(YEAR FROM NOW())::text || ' ' || s.name || '. All rights reserved.'
  ),
  '{}'::jsonb
FROM stores s
LEFT JOIN store_header_footer shf ON shf.store_id = s.id
WHERE shf.id IS NULL;

-- Backfill: Create themes for stores that don't have one
INSERT INTO store_themes (store_id, name, is_active, colors, typography, layout)
SELECT 
  s.id,
  'Default Theme',
  true,
  jsonb_build_object(
    'primary', '#000000',
    'secondary', '#666666',
    'accent', '#3b82f6',
    'background', '#ffffff',
    'foreground', '#000000',
    'muted', '#f5f5f5',
    'border', '#e5e5e5'
  ),
  jsonb_build_object(
    'headingFont', 'Inter',
    'bodyFont', 'Inter',
    'baseSize', '16px'
  ),
  jsonb_build_object(
    'containerWidth', '1200px',
    'spacing', 'normal'
  )
FROM stores s
LEFT JOIN store_themes st ON st.store_id = s.id AND st.is_active = true
WHERE st.id IS NULL;