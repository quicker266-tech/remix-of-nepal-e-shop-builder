/**
 * ============================================================================
 * STOREFRONT LAYOUT - SHARED WRAPPER FOR ALL STOREFRONT PAGES
 * ============================================================================
 *
 * Provides consistent header/footer across all storefront pages.
 * Fetches store data once and passes it to child routes via Outlet context.
 *
 * Child components can access the context using:
 * const { store, theme } = useStorefrontContext();
 *
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { Outlet, useParams, useOutletContext } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { Skeleton } from "@/components/ui/skeleton";

// ============================================================================
// TYPES
// ============================================================================

export interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

export interface Theme {
  colors: Record<string, string>;
  typography: Record<string, string>;
  layout: Record<string, string>;
}

export interface NavItem {
  id: string;
  label: string;
  url?: string;
  page_id?: string;
  location: string;
  parent_id?: string;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
}

export interface HeaderFooterConfig {
  header_config: {
    layout?: 'logo-left' | 'logo-center' | 'logo-right';
    sticky?: boolean;
    showSearch?: boolean;
    showCart?: boolean;
    showAccount?: boolean;
    backgroundColor?: string;
    textColor?: string;
  };
  footer_config: {
    layout?: 'simple' | 'multi-column' | 'minimal';
    showNewsletter?: boolean;
    showSocialLinks?: boolean;
    showPaymentIcons?: boolean;
    copyrightText?: string;
    backgroundColor?: string;
    textColor?: string;
    columns?: Array<{ id: string; title: string; links: Array<{ label: string; url: string }> }>;
  };
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    linkedin?: string;
  };
}

// Context type that child routes will receive
export interface StorefrontContextType {
  store: Store;
  theme: Theme | null;
  headerFooter: HeaderFooterConfig | null;
  navItems: NavItem[];
}

// ============================================================================
// LAYOUT COMPONENT
// ============================================================================

export default function StorefrontLayout() {
  const { storeSlug } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterConfig | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch store data
  useEffect(() => {
    async function fetchStoreData() {
      if (!storeSlug) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch store by slug
        const { data: storeData, error: storeError } = await supabase
          .from("stores")
          .select("id, name, slug, logo_url")
          .eq("slug", storeSlug)
          .eq("status", "active")
          .single();

        if (storeError || !storeData) {
          setError("Store not found");
          setLoading(false);
          return;
        }

        setStore(storeData as Store);

        // 2. Fetch store theme
        const { data: themeData } = await supabase
          .from("store_themes")
          .select("colors, typography, layout")
          .eq("store_id", storeData.id)
          .eq("is_active", true)
          .single();

        if (themeData) {
          setTheme({
            colors: themeData.colors as Record<string, string>,
            typography: themeData.typography as Record<string, string>,
            layout: themeData.layout as Record<string, string>,
          });
        }

        // 3. Fetch header/footer config
        const { data: headerFooterData } = await supabase
          .from("store_header_footer")
          .select("header_config, footer_config, social_links")
          .eq("store_id", storeData.id)
          .single();

        if (headerFooterData) {
          setHeaderFooter({
            header_config: (headerFooterData.header_config as HeaderFooterConfig['header_config']) || {},
            footer_config: (headerFooterData.footer_config as HeaderFooterConfig['footer_config']) || {},
            social_links: (headerFooterData.social_links as HeaderFooterConfig['social_links']) || {},
          });
        }

        // 4. Fetch navigation items
        const { data: navData } = await supabase
          .from("store_navigation")
          .select("id, label, url, page_id, location, parent_id, is_highlighted, open_in_new_tab")
          .eq("store_id", storeData.id)
          .order("sort_order", { ascending: true });

        setNavItems((navData as NavItem[]) || []);

      } catch (err) {
        console.error("Error fetching store data:", err);
        setError("Failed to load store");
      } finally {
        setLoading(false);
      }
    }

    fetchStoreData();
  }, [storeSlug]);

  // Apply theme CSS variables
  useEffect(() => {
    if (theme?.colors) {
      const root = document.documentElement;
      Object.entries(theme.colors).forEach(([key, value]) => {
        root.style.setProperty(`--${key}`, value);
      });

      return () => {
        Object.keys(theme.colors).forEach((key) => {
          root.style.removeProperty(`--${key}`);
        });
      };
    }
  }, [theme]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-[400px] w-full" />
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="aspect-square rounded-lg mb-4" />
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Store not found"}
          </h1>
          <p className="text-muted-foreground">
            The store you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  // Filter nav items by location
  const headerNavItems = navItems.filter(item => item.location === 'header');
  const footerNavItems = navItems.filter(item => item.location === 'footer');

  // Context to pass to child routes
  const outletContext: StorefrontContextType = {
    store,
    theme,
    headerFooter,
    navItems,
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header - always shown */}
      {headerFooter && (
        <StorefrontHeader
          store={store}
          headerConfig={headerFooter.header_config}
          navItems={headerNavItems}
        />
      )}

      {/* Main Content - child routes render here */}
      <main className="flex-1">
        <Outlet context={outletContext} />
      </main>

      {/* Footer - always shown */}
      {headerFooter && (
        <StorefrontFooter
          store={store}
          footerConfig={headerFooter.footer_config}
          socialLinks={headerFooter.social_links}
          navItems={footerNavItems}
        />
      )}
    </div>
  );
}

// ============================================================================
// HOOK FOR CHILD COMPONENTS
// ============================================================================

/**
 * Hook for child routes to access storefront context
 *
 * @example
 * ```tsx
 * function ProductDetail() {
 *   const { store, theme } = useStorefrontContext();
 *   // No need to fetch store data - it's already available!
 * }
 * ```
 */
export function useStorefrontContext() {
  return useOutletContext<StorefrontContextType>();
}
