import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Search, Grid3X3, List, ChevronRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compare_at_price: number | null;
  images: unknown;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductListingContentProps {
  storeId: string;
  storeSlug: string;
}

export function ProductListingContent({ storeId, storeSlug }: ProductListingContentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Get routing mode from context
  const storefrontContext = useStorefrontOptional();
  const isSubdomainMode = storefrontContext?.isSubdomainMode || false;
  
  // Build links based on routing mode
  const buildLink = (path: string): string => {
    return isSubdomainMode ? path : `/store/${storeSlug}${path}`;
  };
  
  const searchQuery = searchParams.get('q') || '';
  const sortBy = searchParams.get('sort') || 'newest';
  const categoryFilter = searchParams.get('category') || '';

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  useEffect(() => {
    fetchProducts();
  }, [storeId, sortBy, categoryFilter, searchQuery]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('id, name, slug')
      .eq('store_id', storeId)
      .order('sort_order', { ascending: true });
    
    if (data) setCategories(data);
  };

  const fetchProducts = async () => {
    setLoading(true);
    
    let query = supabase
      .from('products')
      .select('id, name, slug, price, compare_at_price, images, category_id')
      .eq('store_id', storeId)
      .eq('status', 'active');

    // Apply category filter
    if (categoryFilter) {
      const category = categories.find(c => c.slug === categoryFilter);
      if (category) {
        query = query.eq('category_id', category.id);
      }
    }

    // Apply search filter
    if (searchQuery) {
      query = query.ilike('name', `%${searchQuery}%`);
    }

    // Apply sorting
    switch (sortBy) {
      case 'price-asc':
        query = query.order('price', { ascending: true });
        break;
      case 'price-desc':
        query = query.order('price', { ascending: false });
        break;
      case 'name':
        query = query.order('name', { ascending: true });
        break;
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }

    const { data } = await query;
    setProducts(data || []);
    setLoading(false);
  };

  const updateParams = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('search') as string;
    updateParams('q', query);
  };

  const getProductImage = (product: Product) => {
    if (product.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images[0];
    }
    return '/placeholder.svg';
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to={buildLink('/')} className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">All Products</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">All Products</h1>
          <p className="text-muted-foreground mt-1">
            {loading ? 'Loading...' : `${products.length} products found`}
          </p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="search"
              placeholder="Search products..."
              defaultValue={searchQuery}
              className="pl-9"
            />
          </div>
          <Button type="submit" variant="secondary">
            Search
          </Button>
        </form>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar - Category Filter */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-card rounded-lg border p-4">
            <h3 className="font-semibold mb-4">Categories</h3>
            <div className="space-y-2">
              <button
                onClick={() => updateParams('category', '')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  !categoryFilter 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                }`}
              >
                All Categories
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => updateParams('category', category.slug)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                    categoryFilter === category.slug 
                      ? 'bg-primary text-primary-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          {/* Toolbar */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <Select value={sortBy} onValueChange={(value) => updateParams('sort', value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Products */}
          {loading ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 gap-4'
              : 'space-y-4'
            }>
              {[...Array(6)].map((_, i) => (
                <div key={i} className={viewMode === 'grid' ? '' : 'flex gap-4'}>
                  <Skeleton className={viewMode === 'grid' ? 'aspect-square w-full' : 'w-32 h-32'} />
                  <div className={viewMode === 'grid' ? 'mt-2 space-y-2' : 'flex-1 space-y-2'}>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No products found</p>
              {(searchQuery || categoryFilter) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={buildLink(`/product/${product.slug}`)}
                  className="group"
                >
                  <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="mt-3">
                    <h3 className="font-medium group-hover:text-primary transition-colors line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-semibold">{formatPrice(product.price)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={buildLink(`/product/${product.slug}`)}
                  className="flex gap-4 p-4 bg-card rounded-lg border hover:border-primary transition-colors"
                >
                  <div className="w-32 h-32 bg-muted rounded-lg overflow-hidden shrink-0">
                    <img
                      src={getProductImage(product)}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-lg">{product.name}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="font-semibold text-lg">{formatPrice(product.price)}</span>
                      {product.compare_at_price && product.compare_at_price > product.price && (
                        <span className="text-muted-foreground line-through">
                          {formatPrice(product.compare_at_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
