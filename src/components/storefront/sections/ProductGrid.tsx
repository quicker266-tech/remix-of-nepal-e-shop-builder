import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: string[] | null;
  store_id: string;
}

interface ProductGridConfig {
  title?: string;
  subtitle?: string;
  columns?: number;
  rows?: number;
  showPrices?: boolean;
  categoryId?: string;
  sortBy?: string;
}

interface ProductGridProps {
  config: ProductGridConfig;
  storeId: string;
  storeSlug: string;
}

export function ProductGrid({ config, storeId, storeSlug }: ProductGridProps) {
  const {
    title = "Our Products",
    subtitle,
    columns = 4,
    rows = 2,
    showPrices = true,
    categoryId,
    sortBy = "created_at",
  } = config;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      let query = supabase
        .from("products")
        .select("id, name, slug, price, compare_at_price, images, store_id")
        .eq("store_id", storeId)
        .eq("status", "active")
        .limit(columns * rows);

      if (categoryId) {
        query = query.eq("category_id", categoryId);
      }

      if (sortBy === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_desc") {
        query = query.order("price", { ascending: false });
      } else if (sortBy === "name") {
        query = query.order("name", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false });
      }

      const { data, error } = await query;

      if (!error && data) {
        setProducts(data as Product[]);
      }
      setLoading(false);
    }

    if (storeId) {
      fetchProducts();
    }
  }, [storeId, categoryId, columns, rows, sortBy]);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {loading ? (
          <div className={`grid ${gridCols} gap-6`}>
            {Array.from({ length: columns * rows }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-4" />
                <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground">No products found</p>
        ) : (
          <div className={`grid ${gridCols} gap-6`}>
            {products.map((product) => {
              const images = Array.isArray(product.images) ? product.images : [];
              const imageUrl = images[0] || "/placeholder.svg";

              return (
                <Link
                  key={product.id}
                  to={`/store/${storeSlug}/product/${product.slug}`}
                  className="group"
                >
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
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
