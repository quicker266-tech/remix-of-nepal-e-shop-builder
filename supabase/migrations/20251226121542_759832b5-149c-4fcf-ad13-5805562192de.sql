-- Add attribute template column to categories for storing category-specific attributes
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS 
  attribute_template jsonb DEFAULT '[]'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.categories.attribute_template IS 'JSON array of attribute definitions, e.g., [{"name": "Size", "type": "select", "options": ["S", "M", "L", "XL"]}, {"name": "Color", "type": "select", "options": ["Red", "Blue"]}]';

-- Make user a super admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('a431ac05-d460-4f4c-9033-db288356df33', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;