export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          attribute_template: Json | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          parent_id: string | null
          slug: string
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          attribute_template?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          attribute_template?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          notes: string | null
          phone: string | null
          store_id: string
          total_orders: number | null
          total_spent: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          store_id: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          total_orders?: number | null
          total_spent?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          minimum_amount: number | null
          starts_at: string | null
          store_id: string
          updated_at: string
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount?: number | null
          starts_at?: string | null
          store_id: string
          updated_at?: string
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          minimum_amount?: number | null
          starts_at?: string | null
          store_id?: string
          updated_at?: string
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discount_codes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          sku: string | null
          total_price: number
          unit_price: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          sku?: string | null
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          sku?: string | null
          total_price?: number
          unit_price?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          billing_address: Json | null
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          internal_notes: string | null
          notes: string | null
          order_number: string
          shipping_address: Json | null
          shipping_amount: number | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          tax_amount: number | null
          total: number
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          order_number?: string
          shipping_address?: Json | null
          shipping_amount?: number | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          tax_amount?: number | null
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      page_sections: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_visible: boolean
          mobile_config: Json | null
          name: string
          page_id: string
          section_type: Database["public"]["Enums"]["section_type"]
          sort_order: number
          store_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          mobile_config?: Json | null
          name: string
          page_id: string
          section_type: Database["public"]["Enums"]["section_type"]
          sort_order?: number
          store_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_visible?: boolean
          mobile_config?: Json | null
          name?: string
          page_id?: string
          section_type?: Database["public"]["Enums"]["section_type"]
          sort_order?: number
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "store_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_sections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      page_templates: {
        Row: {
          business_category: string | null
          business_type: string
          created_at: string
          default_sections: Json
          default_slug: string | null
          default_title: string | null
          description: string | null
          id: string
          is_active: boolean
          page_type: Database["public"]["Enums"]["page_type"]
          preview_image_url: string | null
          sort_order: number | null
          template_name: string
          updated_at: string
        }
        Insert: {
          business_category?: string | null
          business_type: string
          created_at?: string
          default_sections?: Json
          default_slug?: string | null
          default_title?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          page_type: Database["public"]["Enums"]["page_type"]
          preview_image_url?: string | null
          sort_order?: number | null
          template_name: string
          updated_at?: string
        }
        Update: {
          business_category?: string | null
          business_type?: string
          created_at?: string
          default_sections?: Json
          default_slug?: string | null
          default_title?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          page_type?: Database["public"]["Enums"]["page_type"]
          preview_image_url?: string | null
          sort_order?: number | null
          template_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          attributes: Json | null
          compare_at_price: number | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          product_id: string
          sku: string | null
          stock_quantity: number
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price?: number
          product_id: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          compare_at_price?: number | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          product_id?: string
          sku?: string | null
          stock_quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          attributes: Json | null
          barcode: string | null
          category_id: string | null
          compare_at_price: number | null
          cost_price: number | null
          created_at: string
          description: string | null
          featured: boolean | null
          id: string
          images: Json | null
          name: string
          price: number
          seo_description: string | null
          seo_title: string | null
          sku: string | null
          slug: string
          status: Database["public"]["Enums"]["product_status"]
          stock_quantity: number
          store_id: string
          track_inventory: boolean | null
          updated_at: string
        }
        Insert: {
          attributes?: Json | null
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          name: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          store_id: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Update: {
          attributes?: Json | null
          barcode?: string | null
          category_id?: string | null
          compare_at_price?: number | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          featured?: boolean | null
          id?: string
          images?: Json | null
          name?: string
          price?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["product_status"]
          stock_quantity?: number
          store_id?: string
          track_inventory?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_extensions: {
        Row: {
          config: Json | null
          created_at: string | null
          extension_id: string
          id: string
          is_enabled: boolean | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          extension_id: string
          id?: string
          is_enabled?: boolean | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          extension_id?: string
          id?: string
          is_enabled?: boolean | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_extensions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_header_footer: {
        Row: {
          created_at: string
          footer_config: Json
          header_config: Json
          id: string
          social_links: Json
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          footer_config?: Json
          header_config?: Json
          id?: string
          social_links?: Json
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          footer_config?: Json
          header_config?: Json
          id?: string
          social_links?: Json
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_header_footer_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_navigation: {
        Row: {
          created_at: string
          id: string
          is_highlighted: boolean
          label: string
          location: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab: boolean
          page_id: string | null
          parent_id: string | null
          sort_order: number
          store_id: string
          updated_at: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_highlighted?: boolean
          label: string
          location?: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab?: boolean
          page_id?: string | null
          parent_id?: string | null
          sort_order?: number
          store_id: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_highlighted?: boolean
          label?: string
          location?: Database["public"]["Enums"]["nav_location"]
          open_in_new_tab?: boolean
          page_id?: string | null
          parent_id?: string | null
          sort_order?: number
          store_id?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_navigation_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "store_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_navigation_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "store_navigation"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_navigation_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pages: {
        Row: {
          created_at: string
          id: string
          is_published: boolean
          og_image_url: string | null
          page_type: Database["public"]["Enums"]["page_type"]
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          show_footer: boolean
          show_header: boolean
          slug: string
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          page_type?: Database["public"]["Enums"]["page_type"]
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_footer?: boolean
          show_header?: boolean
          slug: string
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          page_type?: Database["public"]["Enums"]["page_type"]
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          show_footer?: boolean
          show_header?: boolean
          slug?: string
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_shipping_settings: {
        Row: {
          created_at: string | null
          default_shipping_rate: number | null
          enable_shipping: boolean | null
          free_shipping_threshold: number | null
          id: string
          shipping_zones: Json | null
          store_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_shipping_rate?: number | null
          enable_shipping?: boolean | null
          free_shipping_threshold?: number | null
          id?: string
          shipping_zones?: Json | null
          store_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_shipping_rate?: number | null
          enable_shipping?: boolean | null
          free_shipping_threshold?: number | null
          id?: string
          shipping_zones?: Json | null
          store_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_shipping_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_staff: {
        Row: {
          created_at: string
          id: string
          role: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_staff_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_themes: {
        Row: {
          colors: Json
          created_at: string
          custom_css: string | null
          id: string
          is_active: boolean
          layout: Json
          name: string
          store_id: string
          typography: Json
          updated_at: string
        }
        Insert: {
          colors?: Json
          created_at?: string
          custom_css?: string | null
          id?: string
          is_active?: boolean
          layout?: Json
          name?: string
          store_id: string
          typography?: Json
          updated_at?: string
        }
        Update: {
          colors?: Json
          created_at?: string
          custom_css?: string | null
          id?: string
          is_active?: boolean
          layout?: Json
          name?: string
          store_id?: string
          typography?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_themes_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          banner_url: string | null
          business_category: string
          business_type: string
          city: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          settings: Json | null
          slug: string
          status: Database["public"]["Enums"]["store_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          business_category?: string
          business_type?: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          settings?: Json | null
          slug: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          business_category?: string
          business_type?: string
          city?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          settings?: Json | null
          slug?: string
          status?: Database["public"]["Enums"]["store_status"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_store: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      get_standard_pages_for_business: {
        Args: { p_business_category?: string; p_business_type: string }
        Returns: {
          default_sections: Json
          page_type: Database["public"]["Enums"]["page_type"]
          slug: string
          sort_order: number
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      initialize_store_pages: {
        Args: {
          p_business_category?: string
          p_business_type?: string
          p_store_id: string
        }
        Returns: number
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "super_admin" | "store_admin" | "store_staff" | "customer"
      nav_location: "header" | "footer" | "mobile"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      page_type:
        | "homepage"
        | "about"
        | "contact"
        | "policy"
        | "custom"
        | "product"
        | "category"
        | "cart"
        | "checkout"
        | "profile"
        | "order_tracking"
        | "search"
      product_status: "draft" | "active" | "archived"
      section_type:
        | "header"
        | "footer"
        | "hero_banner"
        | "hero_slider"
        | "hero_video"
        | "featured_products"
        | "product_grid"
        | "product_carousel"
        | "new_arrivals"
        | "best_sellers"
        | "category_grid"
        | "category_banner"
        | "text_block"
        | "image_text"
        | "gallery"
        | "testimonials"
        | "faq"
        | "announcement_bar"
        | "newsletter"
        | "countdown"
        | "promo_banner"
        | "social_feed"
        | "trust_badges"
        | "brand_logos"
        | "custom_html"
        | "spacer"
        | "divider"
      store_status: "pending" | "active" | "suspended" | "closed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "store_admin", "store_staff", "customer"],
      nav_location: ["header", "footer", "mobile"],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      page_type: [
        "homepage",
        "about",
        "contact",
        "policy",
        "custom",
        "product",
        "category",
        "cart",
        "checkout",
        "profile",
        "order_tracking",
        "search",
      ],
      product_status: ["draft", "active", "archived"],
      section_type: [
        "header",
        "footer",
        "hero_banner",
        "hero_slider",
        "hero_video",
        "featured_products",
        "product_grid",
        "product_carousel",
        "new_arrivals",
        "best_sellers",
        "category_grid",
        "category_banner",
        "text_block",
        "image_text",
        "gallery",
        "testimonials",
        "faq",
        "announcement_bar",
        "newsletter",
        "countdown",
        "promo_banner",
        "social_feed",
        "trust_badges",
        "brand_logos",
        "custom_html",
        "spacer",
        "divider",
      ],
      store_status: ["pending", "active", "suspended", "closed"],
    },
  },
} as const
