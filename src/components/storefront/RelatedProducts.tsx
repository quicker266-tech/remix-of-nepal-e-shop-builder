/**
 * ============================================================================
 * RELATED PRODUCTS COMPONENT
 * ============================================================================
 *
 * Displays products from the same category as the current product.
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

interface RelatedProductsProps {
  currentProductId: string;
  categoryId: string | null;
  storeId: string;
  storeSlug: string;
  maxProducts?: number;
}

export function RelatedProducts({
  currentProductId,
  categoryId,
  storeId,
  storeSlug,
  maxProducts = 4,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentProductId, categoryId, storeId]);

  const fetchRelatedProducts = async () => {
    if (!categoryId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('category_id', categoryId)
        .eq('status', 'active')
        .neq('id', currentProductId)
        .limit(maxProducts);

      if (error) throw error;

      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching related products:', error);
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
 * Product card for related products display
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
