import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Minus, Plus, ShoppingCart, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type Store = Tables<'stores'>;
type Product = Tables<'products'>;
type ProductVariant = Tables<'product_variants'>;

export default function ProductDetail() {
  const { storeSlug, productSlug } = useParams();
  const { addToCart, cartItemCount } = useCart();
  const [store, setStore] = useState<Store | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storeSlug && productSlug) {
      fetchProductData();
    }
  }, [storeSlug, productSlug]);

  const fetchProductData = async () => {
    try {
      // Fetch store first
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (storeError) throw storeError;

      if (!storeData) {
        setLoading(false);
        return;
      }

      setStore(storeData);

      // Fetch product
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeData.id)
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
    if (!product) return;

    addToCart({
      productId: product.id,
      variantId: selectedVariant?.id || null,
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
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  if (!store || !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={`/store/${storeSlug}`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <Link to={`/store/${storeSlug}`} className="flex items-center gap-2">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={store.name} 
                    className="w-8 h-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <StoreIcon className="w-4 h-4 text-primary" />
                  </div>
                )}
                <span className="font-semibold hidden sm:block">{store.name}</span>
              </Link>
            </div>

            <Link to={`/store/${storeSlug}/cart`}>
              <Button variant="outline" size="icon" className="relative">
                <ShoppingCart className="w-5 h-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
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
      </div>
    </div>
  );
}
