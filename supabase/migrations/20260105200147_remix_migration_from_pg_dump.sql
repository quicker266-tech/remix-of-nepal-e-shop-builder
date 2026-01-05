CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
BEGIN;

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'super_admin',
    'store_admin',
    'store_staff',
    'customer'
);


--
-- Name: nav_location; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.nav_location AS ENUM (
    'header',
    'footer',
    'mobile'
);


--
-- Name: order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'refunded'
);


--
-- Name: page_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.page_type AS ENUM (
    'homepage',
    'about',
    'contact',
    'policy',
    'custom',
    'product',
    'category',
    'cart',
    'checkout',
    'profile',
    'order_tracking',
    'search'
);


--
-- Name: product_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_status AS ENUM (
    'draft',
    'active',
    'archived'
);


--
-- Name: section_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.section_type AS ENUM (
    'header',
    'footer',
    'hero_banner',
    'hero_slider',
    'hero_video',
    'featured_products',
    'product_grid',
    'product_carousel',
    'new_arrivals',
    'best_sellers',
    'category_grid',
    'category_banner',
    'text_block',
    'image_text',
    'gallery',
    'testimonials',
    'faq',
    'announcement_bar',
    'newsletter',
    'countdown',
    'promo_banner',
    'social_feed',
    'trust_badges',
    'brand_logos',
    'custom_html',
    'spacer',
    'divider',
    'product_filters',
    'product_sort',
    'recently_viewed',
    'recommended_products',
    'product_reviews'
);


--
-- Name: store_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.store_status AS ENUM (
    'pending',
    'active',
    'suspended',
    'closed'
);


--
-- Name: auto_initialize_store_pages(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.auto_initialize_store_pages() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  PERFORM public.initialize_store_pages(
    NEW.id,
    COALESCE(NEW.business_type, 'ecommerce'),
    COALESCE(NEW.business_category, 'general')
  );
  
  RETURN NEW;
END;
$$;


--
-- Name: can_access_store(uuid, uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.can_access_store(_user_id uuid, _store_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.stores WHERE id = _store_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM public.store_staff WHERE store_id = _store_id AND user_id = _user_id
    UNION
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;


--
-- Name: get_standard_pages_for_business(text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_standard_pages_for_business(p_business_type text, p_business_category text DEFAULT NULL::text) RETURNS TABLE(page_type public.page_type, title text, slug text, default_sections jsonb, sort_order integer)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pt.page_type,
    pt.default_title,
    pt.default_slug,
    pt.default_sections,
    pt.sort_order
  FROM public.page_templates pt
  WHERE 
    pt.business_type = p_business_type
    AND (pt.business_category IS NULL OR pt.business_category = p_business_category)
    AND pt.is_active = true
  ORDER BY pt.sort_order;
END;
$$;


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Default role is customer
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;


--
-- Name: initialize_store_pages(uuid, text, text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.initialize_store_pages(p_store_id uuid, p_business_type text DEFAULT 'ecommerce'::text, p_business_category text DEFAULT 'general'::text) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
DECLARE
  v_page_count INTEGER := 0;
  v_template RECORD;
  v_page_id UUID;
  v_section JSONB;
  v_section_order INTEGER;
BEGIN
  FOR v_template IN 
    SELECT * FROM public.get_standard_pages_for_business(p_business_type, p_business_category)
  LOOP
    INSERT INTO public.store_pages (
      store_id,
      title,
      slug,
      page_type,
      is_published,
      show_header,
      show_footer
    )
    VALUES (
      p_store_id,
      v_template.title,
      v_template.slug,
      v_template.page_type,
      true,
      true,
      true
    )
    ON CONFLICT (store_id, slug) DO NOTHING
    RETURNING id INTO v_page_id;
    
    IF v_page_id IS NOT NULL THEN
      v_page_count := v_page_count + 1;
      
      v_section_order := 0;
      FOR v_section IN SELECT * FROM jsonb_array_elements(v_template.default_sections)
      LOOP
        INSERT INTO public.page_sections (
          page_id,
          store_id,
          section_type,
          name,
          config,
          sort_order,
          is_visible
        )
        VALUES (
          v_page_id,
          p_store_id,
          (v_section->>'type')::public.section_type,
          v_section->>'name',
          '{}'::jsonb,
          v_section_order,
          true
        );
        
        v_section_order := v_section_order + 1;
      END LOOP;
    END IF;
  END LOOP;
  
  RETURN v_page_count;
END;
$$;


--
-- Name: is_super_admin(uuid); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.is_super_admin(_user_id uuid) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    parent_id uuid,
    image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    attribute_template jsonb DEFAULT '[]'::jsonb
);


--
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    user_id uuid,
    email text NOT NULL,
    full_name text,
    phone text,
    address text,
    city text,
    notes text,
    total_orders integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: discount_codes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.discount_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    code text NOT NULL,
    description text,
    discount_type text DEFAULT 'percentage'::text NOT NULL,
    discount_value numeric(10,2) NOT NULL,
    minimum_amount numeric(10,2),
    max_uses integer,
    used_count integer DEFAULT 0,
    starts_at timestamp with time zone,
    expires_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid,
    variant_id uuid,
    product_name text NOT NULL,
    variant_name text,
    sku text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price numeric(10,2) DEFAULT 0 NOT NULL,
    total_price numeric(10,2) DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    customer_id uuid,
    order_number text NOT NULL,
    status public.order_status DEFAULT 'pending'::public.order_status NOT NULL,
    subtotal numeric(12,2) DEFAULT 0 NOT NULL,
    discount_amount numeric(12,2) DEFAULT 0,
    shipping_amount numeric(12,2) DEFAULT 0,
    tax_amount numeric(12,2) DEFAULT 0,
    total numeric(12,2) DEFAULT 0 NOT NULL,
    shipping_address jsonb,
    billing_address jsonb,
    notes text,
    internal_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: page_sections; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_sections (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    page_id uuid NOT NULL,
    store_id uuid NOT NULL,
    section_type public.section_type NOT NULL,
    name text NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    mobile_config jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    "position" text DEFAULT 'below'::text NOT NULL,
    CONSTRAINT page_sections_position_check CHECK (("position" = ANY (ARRAY['above'::text, 'below'::text])))
);


--
-- Name: page_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.page_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_type text NOT NULL,
    business_category text,
    page_type public.page_type NOT NULL,
    template_name text NOT NULL,
    description text,
    default_sections jsonb DEFAULT '[]'::jsonb NOT NULL,
    default_title text,
    default_slug text,
    is_active boolean DEFAULT true NOT NULL,
    preview_image_url text,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    name text NOT NULL,
    sku text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(10,2),
    stock_quantity integer DEFAULT 0 NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb,
    image_url text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    category_id uuid,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    price numeric(10,2) DEFAULT 0 NOT NULL,
    compare_at_price numeric(10,2),
    cost_price numeric(10,2),
    sku text,
    barcode text,
    stock_quantity integer DEFAULT 0 NOT NULL,
    track_inventory boolean DEFAULT true,
    status public.product_status DEFAULT 'draft'::public.product_status NOT NULL,
    featured boolean DEFAULT false,
    images jsonb DEFAULT '[]'::jsonb,
    attributes jsonb DEFAULT '{}'::jsonb,
    seo_title text,
    seo_description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    full_name text,
    avatar_url text,
    phone text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_extensions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_extensions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    extension_id text NOT NULL,
    is_enabled boolean DEFAULT false,
    config jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: store_header_footer; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_header_footer (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    header_config jsonb DEFAULT '{"layout": "logo-center", "sticky": true, "showCart": true, "textColor": null, "showSearch": true, "showAccount": false, "announcementBar": null, "backgroundColor": null}'::jsonb NOT NULL,
    footer_config jsonb DEFAULT '{"layout": "multi-column", "columns": [], "textColor": null, "copyrightText": null, "showNewsletter": true, "backgroundColor": null, "showSocialLinks": true, "showPaymentIcons": true}'::jsonb NOT NULL,
    social_links jsonb DEFAULT '{"tiktok": null, "twitter": null, "youtube": null, "facebook": null, "instagram": null, "pinterest": null}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_navigation; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_navigation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    label text NOT NULL,
    url text,
    page_id uuid,
    location public.nav_location DEFAULT 'header'::public.nav_location NOT NULL,
    parent_id uuid,
    sort_order integer DEFAULT 0 NOT NULL,
    is_highlighted boolean DEFAULT false NOT NULL,
    open_in_new_tab boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_pages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_pages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    page_type public.page_type DEFAULT 'custom'::public.page_type NOT NULL,
    seo_title text,
    seo_description text,
    og_image_url text,
    is_published boolean DEFAULT false NOT NULL,
    published_at timestamp with time zone,
    show_header boolean DEFAULT true NOT NULL,
    show_footer boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_shipping_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_shipping_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    enable_shipping boolean DEFAULT true,
    free_shipping_threshold numeric,
    default_shipping_rate numeric DEFAULT 0,
    shipping_zones jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: store_staff; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_staff (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text DEFAULT 'staff'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: store_themes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_themes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    store_id uuid NOT NULL,
    name text DEFAULT 'Default Theme'::text NOT NULL,
    is_active boolean DEFAULT false NOT NULL,
    colors jsonb DEFAULT '{"error": "0 84% 60%", "muted": "210 40% 96%", "accent": "217 91% 60%", "border": "214 32% 91%", "primary": "222 47% 31%", "success": "142 76% 36%", "warning": "38 92% 50%", "secondary": "210 40% 96%", "background": "0 0% 100%", "foreground": "222 47% 11%", "mutedForeground": "215 16% 47%"}'::jsonb NOT NULL,
    typography jsonb DEFAULT '{"bodyFont": "Plus Jakarta Sans", "bodyWeight": "400", "headingFont": "Plus Jakarta Sans", "baseFontSize": "16px", "headingWeight": "700"}'::jsonb NOT NULL,
    layout jsonb DEFAULT '{"borderRadius": "0.5rem", "buttonRadius": "0.375rem", "sectionPadding": "4rem", "containerMaxWidth": "1280px"}'::jsonb NOT NULL,
    custom_css text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stores (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id uuid NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    logo_url text,
    banner_url text,
    address text,
    city text,
    phone text,
    email text,
    status public.store_status DEFAULT 'pending'::public.store_status NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    business_type text DEFAULT 'ecommerce'::text NOT NULL,
    business_category text DEFAULT 'general'::text NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role DEFAULT 'customer'::public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_store_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_store_id_slug_key UNIQUE (store_id, slug);


--
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- Name: customers customers_store_id_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_store_id_email_key UNIQUE (store_id, email);


--
-- Name: discount_codes discount_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_pkey PRIMARY KEY (id);


--
-- Name: discount_codes discount_codes_store_id_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_store_id_code_key UNIQUE (store_id, code);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: orders orders_store_id_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_store_id_order_number_key UNIQUE (store_id, order_number);


--
-- Name: page_sections page_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_pkey PRIMARY KEY (id);


--
-- Name: page_templates page_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT page_templates_pkey PRIMARY KEY (id);


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_store_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_slug_key UNIQUE (store_id, slug);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_key UNIQUE (user_id);


--
-- Name: store_extensions store_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_extensions
    ADD CONSTRAINT store_extensions_pkey PRIMARY KEY (id);


--
-- Name: store_extensions store_extensions_store_id_extension_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_extensions
    ADD CONSTRAINT store_extensions_store_id_extension_id_key UNIQUE (store_id, extension_id);


--
-- Name: store_header_footer store_header_footer_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_header_footer
    ADD CONSTRAINT store_header_footer_pkey PRIMARY KEY (id);


--
-- Name: store_header_footer store_header_footer_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_header_footer
    ADD CONSTRAINT store_header_footer_store_id_key UNIQUE (store_id);


--
-- Name: store_navigation store_navigation_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_navigation
    ADD CONSTRAINT store_navigation_pkey PRIMARY KEY (id);


--
-- Name: store_pages store_pages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_pages
    ADD CONSTRAINT store_pages_pkey PRIMARY KEY (id);


--
-- Name: store_pages store_pages_store_id_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_pages
    ADD CONSTRAINT store_pages_store_id_slug_key UNIQUE (store_id, slug);


--
-- Name: store_shipping_settings store_shipping_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_shipping_settings
    ADD CONSTRAINT store_shipping_settings_pkey PRIMARY KEY (id);


--
-- Name: store_shipping_settings store_shipping_settings_store_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_shipping_settings
    ADD CONSTRAINT store_shipping_settings_store_id_key UNIQUE (store_id);


--
-- Name: store_staff store_staff_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_staff
    ADD CONSTRAINT store_staff_pkey PRIMARY KEY (id);


--
-- Name: store_staff store_staff_store_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_staff
    ADD CONSTRAINT store_staff_store_id_user_id_key UNIQUE (store_id, user_id);


--
-- Name: store_themes store_themes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_themes
    ADD CONSTRAINT store_themes_pkey PRIMARY KEY (id);


--
-- Name: stores stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_pkey PRIMARY KEY (id);


--
-- Name: stores stores_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_slug_key UNIQUE (slug);


--
-- Name: store_pages unique_page_slug_per_store; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_pages
    ADD CONSTRAINT unique_page_slug_per_store UNIQUE (store_id, slug);


--
-- Name: page_templates unique_template_per_business; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_templates
    ADD CONSTRAINT unique_template_per_business UNIQUE (business_type, business_category, page_type, template_name);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_categories_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_categories_store_id ON public.categories USING btree (store_id);


--
-- Name: idx_customers_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_store_id ON public.customers USING btree (store_id);


--
-- Name: idx_orders_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);


--
-- Name: idx_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_status ON public.orders USING btree (status);


--
-- Name: idx_orders_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_orders_store_id ON public.orders USING btree (store_id);


--
-- Name: idx_page_sections_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_sections_order ON public.page_sections USING btree (page_id, sort_order);


--
-- Name: idx_page_sections_page_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_sections_page_id ON public.page_sections USING btree (page_id);


--
-- Name: idx_page_sections_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_sections_store_id ON public.page_sections USING btree (store_id);


--
-- Name: idx_page_templates_business; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_page_templates_business ON public.page_templates USING btree (business_type, business_category, is_active);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_status ON public.products USING btree (status);


--
-- Name: idx_products_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_store_id ON public.products USING btree (store_id);


--
-- Name: idx_store_navigation_location; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_navigation_location ON public.store_navigation USING btree (store_id, location);


--
-- Name: idx_store_navigation_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_navigation_parent ON public.store_navigation USING btree (parent_id);


--
-- Name: idx_store_navigation_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_navigation_store_id ON public.store_navigation USING btree (store_id);


--
-- Name: idx_store_pages_published; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_pages_published ON public.store_pages USING btree (store_id, is_published) WHERE (is_published = true);


--
-- Name: idx_store_pages_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_pages_slug ON public.store_pages USING btree (store_id, slug);


--
-- Name: idx_store_pages_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_pages_store_id ON public.store_pages USING btree (store_id);


--
-- Name: idx_store_pages_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_pages_type ON public.store_pages USING btree (store_id, page_type) WHERE (is_published = true);


--
-- Name: idx_store_themes_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_themes_active ON public.store_themes USING btree (store_id, is_active) WHERE (is_active = true);


--
-- Name: idx_store_themes_store_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_store_themes_store_id ON public.store_themes USING btree (store_id);


--
-- Name: idx_stores_owner_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_owner_id ON public.stores USING btree (owner_id);


--
-- Name: idx_stores_slug; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_slug ON public.stores USING btree (slug);


--
-- Name: idx_stores_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_stores_status ON public.stores USING btree (status);


--
-- Name: stores trigger_auto_initialize_pages; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_auto_initialize_pages AFTER INSERT ON public.stores FOR EACH ROW EXECUTE FUNCTION public.auto_initialize_store_pages();


--
-- Name: categories update_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: customers update_customers_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: discount_codes update_discount_codes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON public.discount_codes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: orders update_orders_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: page_sections update_page_sections_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_page_sections_updated_at BEFORE UPDATE ON public.page_sections FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: product_variants update_product_variants_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_product_variants_updated_at BEFORE UPDATE ON public.product_variants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: products update_products_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: profiles update_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_header_footer update_store_header_footer_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_header_footer_updated_at BEFORE UPDATE ON public.store_header_footer FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_navigation update_store_navigation_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_navigation_updated_at BEFORE UPDATE ON public.store_navigation FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_pages update_store_pages_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_pages_updated_at BEFORE UPDATE ON public.store_pages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_shipping_settings update_store_shipping_settings_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_shipping_settings_updated_at BEFORE UPDATE ON public.store_shipping_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: store_themes update_store_themes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_store_themes_updated_at BEFORE UPDATE ON public.store_themes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: stores update_stores_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: categories categories_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: categories categories_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: customers customers_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: customers customers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: discount_codes discount_codes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.discount_codes
    ADD CONSTRAINT discount_codes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: order_items order_items_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE SET NULL;


--
-- Name: orders orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- Name: orders orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: page_sections page_sections_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.store_pages(id) ON DELETE CASCADE;


--
-- Name: page_sections page_sections_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.page_sections
    ADD CONSTRAINT page_sections_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_variants
    ADD CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- Name: products products_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: store_extensions store_extensions_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_extensions
    ADD CONSTRAINT store_extensions_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_header_footer store_header_footer_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_header_footer
    ADD CONSTRAINT store_header_footer_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_navigation store_navigation_page_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_navigation
    ADD CONSTRAINT store_navigation_page_id_fkey FOREIGN KEY (page_id) REFERENCES public.store_pages(id) ON DELETE SET NULL;


--
-- Name: store_navigation store_navigation_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_navigation
    ADD CONSTRAINT store_navigation_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.store_navigation(id) ON DELETE CASCADE;


--
-- Name: store_navigation store_navigation_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_navigation
    ADD CONSTRAINT store_navigation_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_pages store_pages_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_pages
    ADD CONSTRAINT store_pages_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_shipping_settings store_shipping_settings_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_shipping_settings
    ADD CONSTRAINT store_shipping_settings_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_staff store_staff_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_staff
    ADD CONSTRAINT store_staff_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: store_staff store_staff_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_staff
    ADD CONSTRAINT store_staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: store_themes store_themes_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_themes
    ADD CONSTRAINT store_themes_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.stores(id) ON DELETE CASCADE;


--
-- Name: stores stores_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stores
    ADD CONSTRAINT stores_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: customers Anyone can create customers for active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create customers for active stores" ON public.customers FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = customers.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: order_items Anyone can create order items for active store orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create order items for active store orders" ON public.order_items FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM (public.orders o
     JOIN public.stores s ON ((s.id = o.store_id)))
  WHERE ((o.id = order_items.order_id) AND (s.status = 'active'::public.store_status)))));


--
-- Name: orders Anyone can create orders for active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can create orders for active stores" ON public.orders FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = orders.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: customers Anyone can update customers for active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can update customers for active stores" ON public.customers FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = customers.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: products Anyone can view active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active products" ON public.products FOR SELECT USING (((status = 'active'::public.product_status) AND (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = products.store_id) AND (stores.status = 'active'::public.store_status))))));


--
-- Name: stores Anyone can view active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active stores" ON public.stores FOR SELECT USING ((status = 'active'::public.store_status));


--
-- Name: page_templates Anyone can view active templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active templates" ON public.page_templates FOR SELECT USING ((is_active = true));


--
-- Name: store_themes Anyone can view active theme of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view active theme of active stores" ON public.store_themes FOR SELECT USING (((is_active = true) AND (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_themes.store_id) AND (stores.status = 'active'::public.store_status))))));


--
-- Name: categories Anyone can view categories of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view categories of active stores" ON public.categories FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = categories.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: store_header_footer Anyone can view header/footer of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view header/footer of active stores" ON public.store_header_footer FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_header_footer.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: store_navigation Anyone can view navigation of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view navigation of active stores" ON public.store_navigation FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_navigation.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: store_pages Anyone can view published pages of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view published pages of active stores" ON public.store_pages FOR SELECT USING (((is_published = true) AND (EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_pages.store_id) AND (stores.status = 'active'::public.store_status))))));


--
-- Name: store_shipping_settings Anyone can view shipping settings of active stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view shipping settings of active stores" ON public.store_shipping_settings FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_shipping_settings.store_id) AND (stores.status = 'active'::public.store_status)))));


--
-- Name: product_variants Anyone can view variants of active products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view variants of active products" ON public.product_variants FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.products p
     JOIN public.stores s ON ((s.id = p.store_id)))
  WHERE ((p.id = product_variants.product_id) AND (p.status = 'active'::public.product_status) AND (s.status = 'active'::public.store_status)))));


--
-- Name: page_sections Anyone can view visible sections of published pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Anyone can view visible sections of published pages" ON public.page_sections FOR SELECT USING (((is_visible = true) AND (EXISTS ( SELECT 1
   FROM (public.store_pages sp
     JOIN public.stores s ON ((s.id = sp.store_id)))
  WHERE ((sp.id = page_sections.page_id) AND (sp.is_published = true) AND (s.status = 'active'::public.store_status))))));


--
-- Name: stores Authenticated users can create stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can create stores" ON public.stores FOR INSERT WITH CHECK ((auth.uid() = owner_id));


--
-- Name: order_items Order items inherit order permissions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Order items inherit order permissions" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND public.can_access_store(auth.uid(), o.store_id)))));


--
-- Name: categories Store members can manage categories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage categories" ON public.categories USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: customers Store members can manage customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage customers" ON public.customers USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: discount_codes Store members can manage discount codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage discount codes" ON public.discount_codes USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_extensions Store members can manage extensions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage extensions" ON public.store_extensions USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_header_footer Store members can manage header/footer; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage header/footer" ON public.store_header_footer USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_navigation Store members can manage navigation; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage navigation" ON public.store_navigation USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: order_items Store members can manage order items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage order items" ON public.order_items USING ((EXISTS ( SELECT 1
   FROM public.orders o
  WHERE ((o.id = order_items.order_id) AND public.can_access_store(auth.uid(), o.store_id)))));


--
-- Name: orders Store members can manage orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage orders" ON public.orders USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_pages Store members can manage pages; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage pages" ON public.store_pages USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: products Store members can manage products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage products" ON public.products USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: page_sections Store members can manage sections; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage sections" ON public.page_sections USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_shipping_settings Store members can manage shipping settings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage shipping settings" ON public.store_shipping_settings USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_themes Store members can manage themes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage themes" ON public.store_themes USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: product_variants Store members can manage variants; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can manage variants" ON public.product_variants USING ((EXISTS ( SELECT 1
   FROM public.products p
  WHERE ((p.id = product_variants.product_id) AND public.can_access_store(auth.uid(), p.store_id)))));


--
-- Name: products Store members can view all their products; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can view all their products" ON public.products FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: customers Store members can view customers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can view customers" ON public.customers FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: discount_codes Store members can view discount codes; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can view discount codes" ON public.discount_codes FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: orders Store members can view orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can view orders" ON public.orders FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_extensions Store members can view their extensions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store members can view their extensions" ON public.store_extensions FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: store_staff Store owners can manage staff; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can manage staff" ON public.store_staff USING (((EXISTS ( SELECT 1
   FROM public.stores
  WHERE ((stores.id = store_staff.store_id) AND (stores.owner_id = auth.uid())))) OR public.is_super_admin(auth.uid())));


--
-- Name: stores Store owners can update their stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can update their stores" ON public.stores FOR UPDATE USING ((auth.uid() = owner_id));


--
-- Name: stores Store owners can view their own stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store owners can view their own stores" ON public.stores FOR SELECT USING ((auth.uid() = owner_id));


--
-- Name: store_staff Store staff can view store membership; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Store staff can view store membership" ON public.store_staff FOR SELECT USING (public.can_access_store(auth.uid(), store_id));


--
-- Name: user_roles Super admins can manage all roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all roles" ON public.user_roles USING (public.is_super_admin(auth.uid()));


--
-- Name: stores Super admins can manage all stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage all stores" ON public.stores USING (public.is_super_admin(auth.uid()));


--
-- Name: page_templates Super admins can manage templates; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can manage templates" ON public.page_templates USING (public.is_super_admin(auth.uid()));


--
-- Name: orders Super admins can view all orders; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all orders" ON public.orders FOR SELECT USING (public.is_super_admin(auth.uid()));


--
-- Name: profiles Super admins can view all profiles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_super_admin(auth.uid()));


--
-- Name: stores Super admins can view all stores; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Super admins can view all stores" ON public.stores FOR SELECT USING (public.is_super_admin(auth.uid()));


--
-- Name: profiles Users can insert their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK ((auth.uid() = user_id));


--
-- Name: profiles Users can update their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view their own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: user_roles Users can view their own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- Name: discount_codes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.discount_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: page_sections; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;

--
-- Name: page_templates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.page_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: store_extensions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_extensions ENABLE ROW LEVEL SECURITY;

--
-- Name: store_header_footer; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_header_footer ENABLE ROW LEVEL SECURITY;

--
-- Name: store_navigation; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_navigation ENABLE ROW LEVEL SECURITY;

--
-- Name: store_pages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_pages ENABLE ROW LEVEL SECURITY;

--
-- Name: store_shipping_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_shipping_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: store_staff; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_staff ENABLE ROW LEVEL SECURITY;

--
-- Name: store_themes; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_themes ENABLE ROW LEVEL SECURITY;

--
-- Name: stores; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--




COMMIT;