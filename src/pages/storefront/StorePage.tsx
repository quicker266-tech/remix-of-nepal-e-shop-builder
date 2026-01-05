/**
 * ============================================================================
 * STORE PAGE - CUSTOMER STOREFRONT RENDERER
 * ============================================================================
 * 
 * Renders a complete storefront page with:
 * - Header (if enabled for the page)
 * - Built-in page content based on page_type
 * - Page sections from database
 * - Footer (if enabled for the page)
 * 
 * PAGE TYPES WITH BUILT-IN CONTENT:
 * - category: CategoryPageContent (category grid / product listing)
 * - about: AboutPageContent (store info)
 * - contact: ContactPageContent (contact form)
 * - homepage: Sections only (no built-in content)
 * 
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import {
  HeroBanner,
  HeroSlider,
  HeroVideo,
  ProductGrid,
  FeaturedProducts,
  CategoryGrid,
  Newsletter,
  Testimonials,
  FAQ,
  TrustBadges,
  TextBlock,
  AnnouncementBar,
  Countdown,
  ImageText,
  Gallery,
  PromoBanner,
  BrandLogos,
  Spacer,
  Divider,
} from "@/components/storefront/sections";
import { StorefrontHeader } from "@/components/storefront/StorefrontHeader";
import { StorefrontFooter } from "@/components/storefront/StorefrontFooter";
import { CategoryPageContent } from "@/components/storefront/pages/CategoryPageContent";
import { Skeleton } from "@/components/ui/skeleton";

interface Store {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
}

interface Theme {
  colors: Record<string, string>;
  typography: Record<string, string>;
  layout: Record<string, string>;
}

interface Section {
  id: string;
  section_type: string;
  config: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
}

interface Page {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  seo_title: string | null;
  seo_description: string | null;
  show_header: boolean;
  show_footer: boolean;
}

interface NavItem {
  id: string;
  label: string;
  url?: string;
  page_id?: string;
  location: string;
  parent_id?: string;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
}

interface HeaderFooterConfig {
  header_config: {
    layout?: 'logo-left' | 'logo-center' | 'logo-right';
    sticky?: boolean;
    showSearch?: boolean;
    showCart?: boolean;
    showAccount?: boolean;
  };
  footer_config: {
    layout?: 'simple' | 'multi-column' | 'minimal';
    showNewsletter?: boolean;
    showSocialLinks?: boolean;
    showPaymentIcons?: boolean;
    copyrightText?: string;
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

export default function StorePage() {
  const { storeSlug, pageSlug = "home" } = useParams();
  const [store, setStore] = useState<Store | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterConfig | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPageData() {
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

        // 5. Fetch page by slug (with show_header, show_footer)
        const { data: pageData, error: pageError } = await supabase
          .from("store_pages")
          .select("id, title, slug, page_type, seo_title, seo_description, show_header, show_footer")
          .eq("store_id", storeData.id)
          .eq("slug", pageSlug)
          .eq("is_published", true)
          .single();

        if (pageError || !pageData) {
          // Try to find homepage
          const { data: homePage } = await supabase
            .from("store_pages")
            .select("id, title, slug, page_type, seo_title, seo_description, show_header, show_footer")
            .eq("store_id", storeData.id)
            .eq("page_type", "homepage")
            .eq("is_published", true)
            .single();

          if (!homePage) {
            setError("Page not found");
            setLoading(false);
            return;
          }
          setPage(homePage as Page);

          // 6. Fetch sections for homepage
          const { data: sectionsData } = await supabase
            .from("page_sections")
            .select("id, section_type, config, is_visible, sort_order")
            .eq("page_id", homePage.id)
            .eq("is_visible", true)
            .order("sort_order", { ascending: true });

          setSections((sectionsData as Section[]) || []);
        } else {
          setPage(pageData as Page);

          // 6. Fetch sections for the page
          const { data: sectionsData } = await supabase
            .from("page_sections")
            .select("id, section_type, config, is_visible, sort_order")
            .eq("page_id", pageData.id)
            .eq("is_visible", true)
            .order("sort_order", { ascending: true });

          setSections((sectionsData as Section[]) || []);
        }
      } catch (err) {
        console.error("Error fetching page data:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    }

    fetchPageData();
  }, [storeSlug, pageSlug]);

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

  // Update page title
  useEffect(() => {
    if (page) {
      document.title = page.seo_title || page.title || store?.name || "Store";
    }
  }, [page, store]);

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

  if (error || !store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Store not found"}
          </h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const renderSection = (section: Section) => {
    const config = section.config as Record<string, unknown>;

    switch (section.section_type) {
      case "hero_banner":
        return <HeroBanner config={config} />;
      case "hero_slider":
        return <HeroSlider config={config} />;
      case "hero_video":
        return <HeroVideo config={config} />;
      case "product_grid":
        return <ProductGrid config={config} storeId={store.id} storeSlug={store.slug} />;
      case "featured_products":
        return <FeaturedProducts config={config} storeId={store.id} storeSlug={store.slug} />;
      case "new_arrivals":
        return <ProductGrid config={{ ...config, title: (config.title as string) || "New Arrivals", sortBy: "created_at" }} storeId={store.id} storeSlug={store.slug} />;
      case "best_sellers":
        return <FeaturedProducts config={{ ...config, title: (config.title as string) || "Best Sellers" }} storeId={store.id} storeSlug={store.slug} />;
      case "category_grid":
        return <CategoryGrid config={config} storeId={store.id} storeSlug={store.slug} />;
      case "category_banner":
        return <CategoryGrid config={{ ...config, columns: 2 }} storeId={store.id} storeSlug={store.slug} />;
      case "text_block":
        return <TextBlock config={config} />;
      case "image_text":
        return <ImageText config={config} />;
      case "gallery":
        return <Gallery config={config} />;
      case "testimonials":
        return <Testimonials config={config} />;
      case "faq":
        return <FAQ config={config} />;
      case "announcement_bar":
        return <AnnouncementBar config={config} />;
      case "newsletter":
        return <Newsletter config={config} />;
      case "countdown":
        return <Countdown config={config} />;
      case "promo_banner":
        return <PromoBanner config={config} />;
      case "trust_badges":
        return <TrustBadges config={config} />;
      case "brand_logos":
        return <BrandLogos config={config} />;
      case "spacer":
        return <Spacer config={config} />;
      case "divider":
        return <Divider config={config} />;
      default:
        return null;
    }
  };

  // Filter nav items by location
  const headerNavItems = navItems.filter(item => item.location === 'header');
  const footerNavItems = navItems.filter(item => item.location === 'footer');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      {page?.show_header && headerFooter && (
        <StorefrontHeader
          store={store}
          headerConfig={headerFooter.header_config}
          navItems={headerNavItems}
        />
      )}

      {/* Main Content */}
      <main className="flex-1">
        {/* Sections ABOVE built-in content */}
        {sections.map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}

        {/* Built-in Page Content based on page_type */}
        {page?.page_type === 'category' && (
          <CategoryPageContent storeId={store.id} storeSlug={store.slug} />
        )}

        {/* Empty state for pages without content */}
        {sections.length === 0 && page?.page_type === 'homepage' && (
          <div className="min-h-[400px] flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-xl font-semibold text-foreground mb-2">
                Welcome to {store.name}
              </h2>
              <p className="text-muted-foreground">
                This page is being set up. Check back soon!
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      {page?.show_footer && headerFooter && (
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
