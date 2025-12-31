/**
 * Related Products Section
 * Displays products that are related to the current product
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface RelatedProductsProps {
  storeSlug: string;
  storeId: string;
  currentProductId: string;
  categoryId?: string | null;
  title?: string;
  productCount?: number;
}

export function RelatedProducts({
  storeSlug,
  storeId,
  currentProductId,
  categoryId,
  title = 'You May Also Like',
  productCount = 4,
}: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchRelatedProducts();
  }, [storeId, currentProductId, categoryId]);

  const fetchRelatedProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('status', 'active')
        .neq('id', currentProductId)
        .limit(productCount);

      // If category exists, prioritize same category products
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // If not enough products from same category, fetch more from store
      if (!data || data.length < productCount) {
        const remainingCount = productCount - (data?.length || 0);
        const existingIds = [currentProductId, ...(data?.map(p => p.id) || [])];

        const { data: moreProducts } = await supabase
          .from('products')
          .select('*')
          .eq('store_id', storeId)
          .eq('status', 'active')
          .not('id', 'in', `(${existingIds.join(',')})`)
          .limit(remainingCount);

        setProducts([...(data || []), ...(moreProducts || [])]);
      } else {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching related products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const images = (product.images as string[]) || [];
    addToCart({
      productId: product.id,
      variantId: null,
      name: product.name,
      variantName: null,
      price: Number(product.price),
      quantity: 1,
      image: images[0] || null,
    });

    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <section className="py-12">
        <div className="max-w-6xl mx-auto px-4">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: productCount }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold mb-6">{title}</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => {
            const images = (product.images as string[]) || [];
            const hasDiscount = product.compare_at_price && 
              Number(product.compare_at_price) > Number(product.price);
            const discountPercent = hasDiscount
              ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
              : 0;

            return (
              <Link
                key={product.id}
                to={`/store/${storeSlug}/product/${product.slug}`}
              >
                <Card className="group overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square relative overflow-hidden bg-muted">
                    <img
                      src={images[0] || '/placeholder.svg'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.svg';
                      }}
                    />
                    {hasDiscount && (
                      <Badge 
                        variant="destructive" 
                        className="absolute top-2 right-2"
                      >
                        -{discountPercent}%
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    <Button
                      size="icon"
                      className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleAddToCart(product, e)}
                    >
                      <ShoppingCart className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2 mb-1">
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
          })}
        </div>
      </div>
    </section>
  );
}
