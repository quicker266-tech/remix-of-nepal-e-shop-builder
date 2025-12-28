import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
}

interface FeaturedProductsConfig {
  title?: string;
  subtitle?: string;
  columns?: number;
  limit?: number;
  showPrices?: boolean;
  showAddToCart?: boolean;
}

interface FeaturedProductsProps {
  config: FeaturedProductsConfig;
  storeId: string;
  storeSlug: string;
}

export function FeaturedProducts({ config, storeId, storeSlug }: FeaturedProductsProps) {
  const {
    title = "Featured Products",
    subtitle,
    columns = 4,
    limit = 8,
    showPrices = true,
    showAddToCart = true,
  } = config;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images")
        .eq("store_id", storeId)
        .eq("status", "active")
        .eq("featured", true)
        .limit(limit);

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }

    if (storeId) {
      fetchFeatured();
    }
  }, [storeId, limit]);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }[columns] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <section className="py-16 px-6 bg-background">
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
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No featured products yet</p>
        ) : (
          <div className={`grid ${gridCols} gap-6`}>
            {products.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const imageUrl = images[0] || "/placeholder.svg";

              return (
                <div key={product.id} className="group">
                  <Link to={`/store/${storeSlug}/product/${product.slug}`}>
                    <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-4">
                      <img
                        src={imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  {showPrices && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-foreground font-semibold">
                        ${product.price.toFixed(2)}
                      </span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-muted-foreground line-through text-sm">
                          ${product.compare_at_price.toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                  {showAddToCart && (
                    <Button variant="outline" size="sm" className="mt-3 w-full">
                      Add to Cart
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
