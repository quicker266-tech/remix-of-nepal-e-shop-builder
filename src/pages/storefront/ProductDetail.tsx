/**
 * ============================================================================
 * PRODUCT DETAIL PAGE
 * ============================================================================
 *
 * Displays a single product with images, description, variants, and add to cart.
 *
 * NOTE: Header/Footer are now rendered by StorefrontLayout (parent)
 * This component receives store data via useStorefrontContext()
 *
 * FEATURES:
 * - Product images gallery with thumbnail selection
 * - Variant selection (size, color, etc.)
 * - Quantity selector with stock validation
 * - Add to cart functionality
 * - Back navigation button
 * - Product reviews section
 * - Related products (same category)
 * - Recommended products (featured)
 *
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { useStorefrontContext } from '@/components/storefront/StorefrontLayout';
import { ReviewSummary, ReviewList, ReviewForm } from '@/components/storefront/reviews';
import { RelatedProducts } from '@/components/storefront/RelatedProducts';
import { RecommendedProducts } from '@/components/storefront/RecommendedProducts';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type ProductVariant = Tables<'product_variants'>;

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { store } = useStorefrontContext();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (store && productSlug) {
      fetchProductData();
    }
  }, [store, productSlug]);

  const fetchProductData = async () => {
    if (!store) return;

    try {
      // Fetch product using store from context
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .eq('slug', productSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (productError) throw productError;

      if (!productData) {
        setLoading(false);
        return;
      }

      setProduct(productData);

      // Fetch variants
      const { data: variantsData } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productData.id)
        .order('created_at');

      if (variantsData && variantsData.length > 0) {
        setVariants(variantsData);
        setSelectedVariant(variantsData[0]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const images = (product?.images as string[]) || [];
  const currentImage = images[selectedImage] || '/placeholder.svg';

  const currentPrice = selectedVariant ? selectedVariant.price : product?.price;
  const comparePrice = selectedVariant ? selectedVariant.compare_at_price : product?.compare_at_price;
  const currentStock = selectedVariant ? selectedVariant.stock_quantity : product?.stock_quantity;

  const hasDiscount = comparePrice && Number(comparePrice) > Number(currentPrice);
  const discountPercent = hasDiscount
    ? Math.round(((Number(comparePrice) - Number(currentPrice)) / Number(comparePrice)) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!product || !storeSlug) return;

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || null,
      storeSlug: storeSlug,
      name: product.name,
      variantName: selectedVariant?.name || null,
      price: Number(currentPrice),
      quantity,
      image: images[0] || null,
    });

    toast.success('Added to cart');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="aspect-square w-full" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Product Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This product doesn't exist or is no longer available.
          </p>
          <Link to={`/store/${storeSlug}`}>
            <Button>Back to Store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Back Navigation */}
      <Link to={`/store/${storeSlug}/catalog`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Continue Shopping
      </Link>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={currentImage}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img
                    src={img}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            {product.featured && (
              <Badge className="mb-2 bg-accent text-accent-foreground">Featured</Badge>
            )}
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">
              रु {Number(currentPrice).toLocaleString()}
            </span>
            {hasDiscount && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  रु {Number(comparePrice).toLocaleString()}
                </span>
                <Badge variant="destructive">-{discountPercent}%</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground leading-relaxed">{product.description}</p>
          )}

          {/* Variants */}
          {variants.length > 0 && (
            <div className="space-y-3">
              <label className="font-medium">Options</label>
              <div className="flex flex-wrap gap-2">
                {variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant?.id === variant.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.stock_quantity === 0}
                  >
                    {variant.name}
                    {variant.stock_quantity === 0 && ' (Out of Stock)'}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="space-y-3">
            <label className="font-medium">Quantity</label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="w-12 text-center font-medium">{quantity}</span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
                disabled={currentStock !== undefined && quantity >= currentStock}
              >
                <Plus className="w-4 h-4" />
              </Button>
              {currentStock !== undefined && (
                <span className="text-sm text-muted-foreground">
                  {currentStock} in stock
                </span>
              )}
            </div>
          </div>

          {/* Add to Cart */}
          <Button
            size="lg"
            className="w-full"
            onClick={handleAddToCart}
            disabled={currentStock === 0}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {currentStock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>

          {/* SKU */}
          {(product.sku || selectedVariant?.sku) && (
            <p className="text-sm text-muted-foreground">
              SKU: {selectedVariant?.sku || product.sku}
            </p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <Separator className="my-12" />
      <section className="space-y-8">
        <h2 className="text-2xl font-bold">Customer Reviews</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <ReviewSummary productId={product.id} />
          </div>
          <div className="md:col-span-2">
            <ReviewForm productId={product.id} storeId={store.id} />
          </div>
        </div>
        <ReviewList productId={product.id} />
      </section>

      {/* Related Products (Same Category) */}
      {product.category_id && (
        <>
          <Separator className="my-12" />
          <section>
            <h2 className="text-2xl font-bold mb-6">Similar Products</h2>
            <RelatedProducts
              currentProductId={product.id}
              categoryId={product.category_id}
              storeId={store.id}
              storeSlug={storeSlug!}
            />
          </section>
        </>
      )}

      {/* Recommended Products (Featured) */}
      <Separator className="my-12" />
      <section>
        <h2 className="text-2xl font-bold mb-6">You May Also Like</h2>
        <RecommendedProducts
          currentProductId={product.id}
          storeId={store.id}
          storeSlug={storeSlug!}
        />
      </section>
    </div>
  );
}
