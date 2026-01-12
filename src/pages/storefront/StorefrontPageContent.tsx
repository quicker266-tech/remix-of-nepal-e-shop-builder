/**
 * ============================================================================
 * STOREFRONT PAGE CONTENT - CUSTOM PAGE RENDERER (Nested under StorefrontLayout)
 * ============================================================================
 *
 * Renders custom pages with sections based on page_type.
 * Uses parent layout for header/footer via StorefrontLayout.
 *
 * PAGE TYPES WITH BUILT-IN CONTENT:
 * - category: CategoryPageContent
 * - product: ProductListingContent
 * - Others: sections only
 *
 * ============================================================================
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useStorefrontContext } from "@/components/storefront/StorefrontLayout";
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
import { CategoryPageContent } from "@/components/storefront/pages/CategoryPageContent";
import { ProductListingContent } from "@/components/storefront/pages/ProductListingContent";
import { Skeleton } from "@/components/ui/skeleton";

interface Section {
  id: string;
  section_type: string;
  config: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
  position: 'above' | 'below';
}

interface Page {
  id: string;
  title: string;
  slug: string;
  page_type: string;
  seo_title: string | null;
  seo_description: string | null;
}

export default function StorefrontPageContent() {
  const { pageSlug } = useParams();
  const { store } = useStorefrontContext();
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPageData() {
      if (!store || !pageSlug) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch page by slug
        const { data: pageData, error: pageError } = await supabase
          .from("store_pages")
          .select("id, title, slug, page_type, seo_title, seo_description")
          .eq("store_id", store.id)
          .eq("slug", pageSlug)
          .eq("is_published", true)
          .single();

        if (pageError || !pageData) {
          setError("Page not found");
          setLoading(false);
          return;
        }

        setPage(pageData as Page);

        // Update page title
        document.title = pageData.seo_title || pageData.title || store.name;

        // Fetch sections for the page
        const { data: sectionsData } = await supabase
          .from("page_sections")
          .select("id, section_type, config, is_visible, sort_order, position")
          .eq("page_id", pageData.id)
          .eq("is_visible", true)
          .order("sort_order", { ascending: true });

        setSections((sectionsData as Section[]) || []);
      } catch (err) {
        console.error("Error fetching page data:", err);
        setError("Failed to load page");
      } finally {
        setLoading(false);
      }
    }

    fetchPageData();
  }, [store, pageSlug]);

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

  if (loading) {
    return (
      <div className="min-h-[400px]">
        <Skeleton className="h-[300px] w-full" />
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

  if (error || !page) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            {error || "Page not found"}
          </h1>
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Sections ABOVE built-in content */}
      {sections
        .filter((section) => section.position === 'above')
        .map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}

      {/* Built-in Page Content based on page_type */}
      {page.page_type === 'category' && (
        <CategoryPageContent storeId={store.id} storeSlug={store.slug} />
      )}
      {page.page_type === 'product' && (
        <ProductListingContent storeId={store.id} storeSlug={store.slug} />
      )}

      {/* Sections BELOW built-in content (or all sections for pages without built-in content) */}
      {sections
        .filter((section) => section.position === 'below' || section.position === undefined)
        .map((section) => (
          <div key={section.id}>{renderSection(section)}</div>
        ))}
    </>
  );
}
