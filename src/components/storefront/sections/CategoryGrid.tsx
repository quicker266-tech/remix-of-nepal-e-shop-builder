import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useStorefrontOptional } from "@/contexts/StorefrontContext";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
}

interface CategoryGridConfig {
  title?: string;
  subtitle?: string;
  columns?: number;
  showDescription?: boolean;
  limit?: number;
}

interface CategoryGridProps {
  config: CategoryGridConfig;
  storeId: string;
  storeSlug: string;
}

export function CategoryGrid({ config, storeId, storeSlug }: CategoryGridProps) {
  const {
    title = "Shop by Category",
    subtitle,
    columns = 4,
    showDescription = false,
    limit = 8,
  } = config;

  // Get routing mode from context
  const storefrontContext = useStorefrontOptional();
  const isSubdomainMode = storefrontContext?.isSubdomainMode || false;
  
  // Build links based on routing mode
  const buildLink = (path: string): string => {
    return isSubdomainMode ? path : `/store/${storeSlug}${path}`;
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url")
        .eq("store_id", storeId)
        .order("sort_order", { ascending: true })
        .limit(limit);

      if (!error && data) {
        setCategories(data);
      }
      setLoading(false);
    }

    if (storeId) {
      fetchCategories();
    }
  }, [storeId, limit]);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-2 md:grid-cols-4";

  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {loading ? (
          <div className={`grid ${gridCols} gap-6`}>
            {Array.from({ length: Math.min(limit, 8) }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg" />
              </div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-center text-muted-foreground">No categories found</p>
        ) : (
          <div className={`grid ${gridCols} gap-6`}>
            {categories.map((category) => (
              <Link
                key={category.id}
                to={buildLink(`/page/category?cat=${category.slug}`)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted"
              >
                {category.image_url ? (
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40" />
                )}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <h3 className="text-xl font-bold text-white mb-2">
                    {category.name}
                  </h3>
                  {showDescription && category.description && (
                    <p className="text-sm text-white/80 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
