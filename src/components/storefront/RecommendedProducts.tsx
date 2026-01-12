/**
 * ============================================================================
 * RECOMMENDED PRODUCTS COMPONENT
 * ============================================================================
 *
 * Displays featured products from the store.
 * Excludes the current product from the list.
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface RecommendedProductsProps {
  currentProductId: string;
  storeId: string;
  storeSlug: string;
  maxProducts?: number;
}

export function RecommendedProducts({
  currentProductId,
  storeId,
  storeSlug,
  maxProducts = 4,
}: RecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedProducts();
  }, [currentProductId, storeId]);

  const fetchRecommendedProducts = async () => {
    try {
      // First try to get featured products
      const { data: featuredData, error: featuredError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .eq('featured', true)
        .neq('id', currentProductId)
        .limit(maxProducts);

      if (featuredError) throw featuredError;

      // If we have enough featured products, use them
      if (featuredData && featuredData.length >= maxProducts) {
        setProducts(featuredData);
        setLoading(false);
        return;
      }

      // Otherwise, fill with recent products
      const existingIds = featuredData?.map(p => p.id) || [];
      const remaining = maxProducts - (featuredData?.length || 0);

      if (remaining > 0) {
        const { data: recentData } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'active')
          .neq('id', currentProductId)
          .not('id', 'in', `(${[...existingIds, currentProductId].join(',')})`)
          .order('created_at', { ascending: false })
          .limit(remaining);

        setProducts([...(featuredData || []), ...(recentData || [])]);
      } else {
        setProducts(featuredData || []);
      }
    } catch (error) {
      console.error('Error fetching recommended products:', error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="aspect-square rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} storeSlug={storeSlug} />
      ))}
    </div>
  );
}

/**
 * Product card for recommended products display
 */
function ProductCard({ product, storeSlug }: { product: Product; storeSlug: string }) {
  const images = (product.images as string[]) || [];
  const imageUrl = images[0] || '/placeholder.svg';

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0;

  return (
    <Link to={`/store/${storeSlug}/product/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive">
              -{discountPercent}%
            </Badge>
          )}
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
        </div>
        <CardContent className="p-3">
          <h3 className="font-medium line-clamp-2 text-sm mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center gap-2">
            <span className="font-bold text-primary">
              रु {Number(product.price).toLocaleString()}
            </span>
            {hasDiscount && (
              <span className="text-sm text-muted-foreground line-through">
                रु {Number(product.compare_at_price).toLocaleString()}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
