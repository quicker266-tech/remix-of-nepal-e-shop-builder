/**
 * ============================================================================
 * CATEGORY PAGE CONTENT - Built-in Storefront Component
 * ============================================================================
 * 
 * Displays category grid OR products filtered by category.
 * Used when page_type = 'category'
 * 
 * BEHAVIOR:
 * - If no category selected: Shows all categories as a grid
 * - If category selected (via URL): Shows products from that category
 * 
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronRight, Grid3X3, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;
type Product = Tables<'products'>;

interface CategoryPageContentProps {
  storeId: string;
  storeSlug: string;
}

export function CategoryPageContent({ storeId, storeSlug }: CategoryPageContentProps) {
  const [searchParams] = useSearchParams();
  const categorySlug = searchParams.get('cat');
  
  // Data state
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  
  // View state
  const [sortBy, setSortBy] = useState<string>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchData();
  }, [storeId, categorySlug]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Always fetch categories for sidebar/breadcrumbs
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });
      
      setCategories(categoriesData || []);

      if (categorySlug) {
        // Find the selected category
        const category = categoriesData?.find(c => c.slug === categorySlug);
        setSelectedCategory(category || null);

        if (category) {
          // Fetch products for this category
          const { data: productsData } = await supabase
            .from('products')
            .select('*')
            .eq('store_id', storeId)
            .eq('category_id', category.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
          
          setProducts(productsData || []);
        }
      } else {
        // No category selected, show all categories
        setSelectedCategory(null);
        setProducts([]);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sort products based on selection
  const sortedProducts = [...products].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'newest':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-64 mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  // If category is selected, show products
  if (selectedCategory) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to={`/store/${storeSlug}`} className="hover:text-foreground transition-colors">
            Home
          </Link>
          <ChevronRight className="w-4 h-4" />
          <Link 
            to={`/store/${storeSlug}/page/category`} 
            className="hover:text-foreground transition-colors"
          >
            Categories
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-foreground font-medium">{selectedCategory.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{selectedCategory.name}</h1>
          {selectedCategory.description && (
            <p className="text-muted-foreground">{selectedCategory.description}</p>
          )}
        </div>

        {/* Toolbar: Sort + View Toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {sortedProducts.length} {sortedProducts.length === 1 ? 'product' : 'products'}
          </p>
          
          <div className="flex items-center gap-4">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center border rounded-lg">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-r-none"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="rounded-l-none"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Products Grid/List */}
        {sortedProducts.length > 0 ? (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              : "flex flex-col gap-4"
          }>
            {sortedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                storeSlug={storeSlug}
                viewMode={viewMode}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No products found in this category.</p>
            <Link to={`/store/${storeSlug}/page/category`}>
              <Button variant="link" className="mt-2">Browse all categories</Button>
            </Link>
          </div>
        )}

        {/* Category Sidebar (other categories) */}
        {categories.length > 1 && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Other Categories</h3>
            <div className="flex flex-wrap gap-2">
              {categories
                .filter(c => c.id !== selectedCategory.id)
                .map((category) => (
                  <Link
                    key={category.id}
                    to={`/store/${storeSlug}/page/category?cat=${category.slug}`}
                  >
                    <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                      {category.name}
                    </Badge>
                  </Link>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Show all categories as grid
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link to={`/store/${storeSlug}`} className="hover:text-foreground transition-colors">
          Home
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium">Categories</span>
      </nav>

      <h1 className="text-3xl font-bold text-foreground mb-8">Shop by Category</h1>

      {categories.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard 
              key={category.id} 
              category={category} 
              storeSlug={storeSlug}
              productCount={0} // Could be enhanced with product count
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-muted-foreground">No categories available yet.</p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CATEGORY CARD COMPONENT
// ============================================================================

interface CategoryCardProps {
  category: Category;
  storeSlug: string;
  productCount: number;
}

function CategoryCard({ category, storeSlug }: CategoryCardProps) {
  return (
    <Link to={`/store/${storeSlug}/page/category?cat=${category.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
        <div className="aspect-square relative overflow-hidden bg-muted">
          {category.image_url ? (
            <img
              src={category.image_url}
              alt={category.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary">
              <span className="text-4xl font-bold text-secondary-foreground/30">
                {category.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {category.description}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// PRODUCT CARD COMPONENT
// ============================================================================

interface ProductCardProps {
  product: Product;
  storeSlug: string;
  viewMode: 'grid' | 'list';
}

function ProductCard({ product, storeSlug, viewMode }: ProductCardProps) {
  const images = (product.images as string[]) || [];
  const imageUrl = images[0] || '/placeholder.svg';

  const hasDiscount = product.compare_at_price && product.compare_at_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round(((Number(product.compare_at_price) - Number(product.price)) / Number(product.compare_at_price)) * 100)
    : 0;

  if (viewMode === 'list') {
    return (
      <Link to={`/store/${storeSlug}/product/${product.slug}`}>
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
          <div className="flex">
            <div className="w-32 h-32 md:w-48 md:h-48 relative overflow-hidden bg-muted flex-shrink-0">
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
            <CardContent className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3 className="font-medium text-foreground group-hover:text-primary transition-colors mb-2">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 mt-3">
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
          </div>
        </Card>
      </Link>
    );
  }

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
