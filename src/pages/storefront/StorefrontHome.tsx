/**
 * ============================================================================
 * STOREFRONT HOME - HOMEPAGE CONTENT (Nested under StorefrontLayout)
 * ============================================================================
 *
 * Renders the homepage sections for a storefront.
 * Uses parent layout for header/footer via StorefrontLayout.
 *
 * ============================================================================
 */

import { useEffect, useState } from "react";
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
import { Skeleton } from "@/components/ui/skeleton";

interface Section {
  id: string;
  section_type: string;
  config: Record<string, unknown>;
  is_visible: boolean;
  sort_order: number;
  position: 'above' | 'below';
}

export default function StorefrontHome() {
  const { store } = useStorefrontContext();
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHomepageData() {
      if (!store) return;

      setLoading(true);

      try {
        // Find homepage
        const { data: homePage } = await supabase
          .from("store_pages")
          .select("id, title, slug, page_type, seo_title")
          .eq("store_id", store.id)
          .eq("page_type", "homepage")
          .eq("is_published", true)
          .single();

        if (homePage) {
          // Update page title
          document.title = homePage.seo_title || homePage.title || store.name;

          // Fetch sections for homepage
          const { data: sectionsData } = await supabase
            .from("page_sections")
            .select("id, section_type, config, is_visible, sort_order, position")
            .eq("page_id", homePage.id)
            .eq("is_visible", true)
            .order("sort_order", { ascending: true });

          setSections((sectionsData as Section[]) || []);
        }
      } catch (err) {
        console.error("Error fetching homepage data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchHomepageData();
  }, [store]);

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

  return (
    <>
      {/* All sections */}
      {sections.map((section) => (
        <div key={section.id}>{renderSection(section)}</div>
      ))}

      {/* Empty state for pages without content */}
      {sections.length === 0 && (
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
    </>
  );
}
