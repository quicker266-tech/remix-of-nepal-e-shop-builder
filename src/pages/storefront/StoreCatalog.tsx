/**
 * ============================================================================
 * STORE CATALOG PAGE (Customer-facing Storefront)
 * ============================================================================
 * 
 * Public-facing product catalog for a store.
 * Displays products with search, category filtering, and shopping cart.
 * 
 * STANDALONE VERSION:
 * - Fetches its own store data from URL params
 * - Renders its own header
 * 
 * URL STRUCTURE:
 * /store/:storeSlug/catalog - Catalog page
 * 
 * FEATURES:
 * - Search products by name/description
 * - Filter by category
 * - Featured products section
 * - Discount badges for products with compare-at price
 * - Responsive design (2-4 columns based on screen size)
 * 
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Search, ShoppingCart, ArrowLeft, Store as StoreIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { useCart } from '@/contexts/CartContext';

type Store = Tables<'stores'>;
type Product = Tables<'products'>;
type Category = Tables<'categories'>;

export default function StoreCatalog() {
  const { storeSlug } = useParams();
  const { cartItemCount } = useCart();
  
  // Store state (fetched from URL params)
  const [store, setStore] = useState<Store | null>(null);
  
  // Data state
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch store first, then products and categories
  useEffect(() => {
    if (storeSlug) {
      fetchStoreAndData();
    }
  }, [storeSlug]);

  /**
   * Fetch store, then products and categories
   */
  const fetchStoreAndData = async () => {
    try {
      setLoading(true);

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

      // Fetch products and categories in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('status', 'active')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .order('sort_order'),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (categoriesResult.data) setCategories(categoriesResult.data);
    } catch (error) {
      console.error('Error fetching catalog data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // CLIENT-SIDE FILTERING
  // ================================================================

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredProducts = filteredProducts.filter(p => p.featured);
  const regularProducts = filteredProducts.filter(p => !p.featured);

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Skeleton className="h-16 w-full mb-8" />
          <Skeleton className="h-32 w-full mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Store not found
  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This store doesn't exist or is no longer available.
          </p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ================================================================
  // MAIN RENDER
  // ================================================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
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

      {/* Search Bar */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page title */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Product Catalog</h1>
        <p className="text-muted-foreground mt-1">Browse all products from {store.name}</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.name}
              </Button>
            ))}
          </div>
        )}

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Featured</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={storeSlug!} />
              ))}
            </div>
          </div>
        )}

        {/* All Products Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {selectedCategory 
              ? categories.find(c => c.id === selectedCategory)?.name 
              : 'All Products'
            }
          </h2>
          {regularProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {regularProducts.map((product) => (
                <ProductCard key={product.id} product={product} storeSlug={storeSlug!} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No products found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

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
