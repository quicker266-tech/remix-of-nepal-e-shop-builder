/**
 * ============================================================================
 * STORE CATALOG PAGE (Customer-facing Storefront)
 * ============================================================================
 * 
 * Public-facing product catalog for a store.
 * Displays products with search, category filtering, and shopping cart.
 * 
 * ARCHITECTURE:
 * - Fetches store by slug from URL
 * - Loads products and categories for the store
 * - Client-side filtering for search and categories
 * - Featured products displayed separately
 * - Responsive grid layout for product cards
 * 
 * URL STRUCTURE:
 * /store/:storeSlug - Main catalog page
 * /store/:storeSlug/product/:productSlug - Product detail
 * /store/:storeSlug/cart - Shopping cart
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
import { Search, Filter, ShoppingCart, Store as StoreIcon } from 'lucide-react';
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
  // Get store slug from URL parameters
  const { storeSlug } = useParams();
  const { cartItemCount } = useCart();
  
  // Data state
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch store data when component mounts or slug changes
  useEffect(() => {
    if (storeSlug) {
      fetchStoreData();
    }
  }, [storeSlug]);

  /**
   * Fetch all data for the store page
   * Loads store info, products, and categories in parallel
   */
  const fetchStoreData = async () => {
    try {
      // ================================================================
      // STEP 1: Fetch store by slug
      // Only active stores are publicly accessible
      // ================================================================
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('slug', storeSlug)
        .eq('status', 'active')
        .maybeSingle();

      if (storeError) throw storeError;

      // Store not found or not active
      if (!storeData) {
        setStore(null);
        setLoading(false);
        return;
      }

      setStore(storeData);

      // ================================================================
      // STEP 2: Fetch products and categories in parallel
      // Only active products are shown to customers
      // ================================================================
      const [productsResult, categoriesResult] = await Promise.all([
        supabase
          .from('products')
          .select('*')
          .eq('store_id', storeData.id)
          .eq('status', 'active')
          .order('featured', { ascending: false }) // Featured products first
          .order('created_at', { ascending: false }), // Then by newest
        supabase
          .from('categories')
          .select('*')
          .eq('store_id', storeData.id)
          .order('sort_order'),
      ]);

      if (productsResult.data) setProducts(productsResult.data);
      if (categoriesResult.data) setCategories(categoriesResult.data);
    } catch (error) {
      console.error('Error fetching store:', error);
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // CLIENT-SIDE FILTERING
  // ================================================================

  /**
   * Filter products based on search query and selected category
   * Runs on every render (memoization could be added for performance)
   */
  const filteredProducts = products.filter((product) => {
    // Search in name and description
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter (null means "All")
    const matchesCategory = !selectedCategory || product.category_id === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Separate featured products for special display
  const featuredProducts = filteredProducts.filter(p => p.featured);
  const regularProducts = filteredProducts.filter(p => !p.featured);

  // ================================================================
  // LOADING STATE
  // ================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
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

  // ================================================================
  // STORE NOT FOUND STATE
  // ================================================================

  if (!store) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <StoreIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Store Not Found</h1>
          <p className="text-muted-foreground mb-4">
            This store doesn't exist or is no longer active.
          </p>
          <Link to="/">
            <Button>Go to Homepage</Button>
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
      {/* ============================================================
       * HEADER: Store logo, search bar, cart button
       * Sticky header for easy access while scrolling
       * ============================================================ */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Store logo and name */}
            <Link to={`/store/${storeSlug}`} className="flex items-center gap-3">
              {store.logo_url ? (
                <img 
                  src={store.logo_url} 
                  alt={store.name} 
                  className="w-10 h-10 rounded-lg object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <StoreIcon className="w-5 h-5 text-primary" />
                </div>
              )}
              <span className="font-bold text-lg hidden sm:block">{store.name}</span>
            </Link>

            {/* Search input */}
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

            {/* Cart button with item count badge */}
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

      {/* ============================================================
       * BANNER: Store banner image with gradient overlay
       * Falls back to simple header if no banner
       * ============================================================ */}
      {store.banner_url && (
        <div className="relative h-48 md:h-64">
          <img 
            src={store.banner_url} 
            alt={store.name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 max-w-7xl mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">{store.name}</h1>
            {store.description && (
              <p className="text-muted-foreground mt-1 line-clamp-2">{store.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Fallback header without banner */}
      {!store.banner_url && (
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          {store.description && (
            <p className="text-muted-foreground mt-1">{store.description}</p>
          )}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* ============================================================
         * CATEGORY FILTER: Horizontal scrollable category buttons
         * ============================================================ */}
        {categories.length > 0 && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {/* "All" button */}
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {/* Category buttons */}
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

        {/* ============================================================
         * FEATURED PRODUCTS SECTION
         * Only shown if there are featured products after filtering
         * ============================================================ */}
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

        {/* ============================================================
         * ALL PRODUCTS SECTION
         * Shows category name if filtering by category
         * ============================================================ */}
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

/**
 * Individual product card for the catalog grid
 * Shows image, name, price, and discount badge
 * 
 * @param product - Product data to display
 * @param storeSlug - Store slug for building product URL
 */
function ProductCard({ product, storeSlug }: { product: Product; storeSlug: string }) {
  // Extract first image or use placeholder
  const images = (product.images as string[]) || [];
  const imageUrl = images[0] || '/placeholder.svg';

  // Calculate discount percentage if compare-at price exists
  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0;

  return (
    <Link to={`/store/${storeSlug}/product/${product.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        {/* Product image with badges */}
        <div className="aspect-square relative overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
          {/* Discount badge (top-left) */}
          {hasDiscount && (
            <Badge className="absolute top-2 left-2 bg-destructive">
              -{discountPercent}%
            </Badge>
          )}
          {/* Featured badge (top-right) */}
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-accent text-accent-foreground">
              Featured
            </Badge>
          )}
        </div>
        
        {/* Product info */}
        <CardContent className="p-3">
          <h3 className="font-medium line-clamp-2 text-sm mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {/* Price display with optional strikethrough */}
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
