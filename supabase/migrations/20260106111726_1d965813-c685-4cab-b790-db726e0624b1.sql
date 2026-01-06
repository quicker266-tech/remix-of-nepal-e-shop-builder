-- =============================================
-- Populate page_templates with standard e-commerce pages
-- and fix existing stores missing pages
-- =============================================

-- Step 1: Clear existing templates (if any incomplete data)
DELETE FROM public.page_templates;

-- Step 2: Insert standard e-commerce page templates
INSERT INTO public.page_templates (business_type, business_category, page_type, template_name, default_title, default_slug, default_sections, sort_order, is_active) VALUES
  -- Homepage
  ('ecommerce', NULL, 'homepage', 'E-commerce Homepage', 'Home', 'home', 
   '[{"type": "hero_banner", "name": "Hero Banner"}, {"type": "featured_products", "name": "Featured Products"}, {"type": "category_grid", "name": "Shop by Category"}, {"type": "newsletter", "name": "Newsletter Signup"}]'::jsonb, 
   1, true),
  
  -- Product page (built-in content)
  ('ecommerce', NULL, 'product', 'Product Detail', 'Product', 'product', 
   '[]'::jsonb, 
   2, true),
  
  -- Category page (built-in content)
  ('ecommerce', NULL, 'category', 'Category', 'Category', 'category', 
   '[]'::jsonb, 
   3, true),
  
  -- Cart page (built-in content)
  ('ecommerce', NULL, 'cart', 'Shopping Cart', 'Cart', 'cart', 
   '[]'::jsonb, 
   4, true),
  
  -- Checkout page (built-in content)
  ('ecommerce', NULL, 'checkout', 'Checkout', 'Checkout', 'checkout', 
   '[]'::jsonb, 
   5, true),
  
  -- Profile/Account page (built-in content)
  ('ecommerce', NULL, 'profile', 'My Account', 'My Account', 'profile', 
   '[]'::jsonb, 
   6, true),
  
  -- About page
  ('ecommerce', NULL, 'about', 'About Us', 'About Us', 'about', 
   '[{"type": "text_block", "name": "About Content"}, {"type": "image_text", "name": "Our Story"}]'::jsonb, 
   7, true),
  
  -- Contact page
  ('ecommerce', NULL, 'contact', 'Contact Us', 'Contact Us', 'contact', 
   '[{"type": "text_block", "name": "Contact Information"}]'::jsonb, 
   8, true);

-- Step 3: Normalize existing homepage titles (Homepage → Home)
UPDATE public.store_pages 
SET title = 'Home', slug = 'home'
WHERE page_type = 'homepage' AND (title = 'Homepage' OR slug = 'homepage');

-- Step 4: Add missing pages to existing stores
DO $$
DECLARE
  v_store RECORD;
  v_pages_added INTEGER;
BEGIN
  FOR v_store IN SELECT id, business_type, business_category FROM public.stores
  LOOP
    -- initialize_store_pages uses ON CONFLICT DO NOTHING, so it only adds missing pages
    SELECT public.initialize_store_pages(
      v_store.id, 
      COALESCE(v_store.business_type, 'ecommerce'),
      COALESCE(v_store.business_category, 'general')
    ) INTO v_pages_added;
    
    RAISE NOTICE 'Store % - Added % new pages', v_store.id, v_pages_added;
  END LOOP;
END $$;