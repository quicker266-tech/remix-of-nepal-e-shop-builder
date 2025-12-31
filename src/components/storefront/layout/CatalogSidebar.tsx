/**
 * Catalog Sidebar Component
 * Provides category navigation and filters for product listings
 */

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Category = Tables<'categories'>;

interface CatalogSidebarProps {
  storeId: string;
  storeSlug: string;
  selectedCategory?: string;
  onCategoryChange?: (categorySlug: string | null) => void;
  maxPrice?: number;
  className?: string;
}

export function CatalogSidebar({
  storeId,
  storeSlug,
  selectedCategory,
  onCategoryChange,
  maxPrice = 50000,
  className = '',
}: CatalogSidebarProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, maxPrice]);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, [storeId]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategoryChange) {
      onCategoryChange(category.slug);
    } else {
      navigate(`/store/${storeSlug}/products?category=${category.slug}`);
    }
  };

  const handlePriceChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams);
    params.set('min_price', priceRange[0].toString());
    params.set('max_price', priceRange[1].toString());
    setSearchParams(params);
  };

  const clearFilters = () => {
    setPriceRange([0, maxPrice]);
    const params = new URLSearchParams();
    setSearchParams(params);
    if (onCategoryChange) {
      onCategoryChange(null);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  // Build category tree
  const rootCategories = categories.filter(c => !c.parent_id);
  const getChildCategories = (parentId: string) =>
    categories.filter(c => c.parent_id === parentId);

  const renderCategory = (category: Category, level = 0) => {
    const children = getChildCategories(category.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedCategories.includes(category.id);
    const isSelected = selectedCategory === category.slug;

    return (
      <div key={category.id}>
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
            isSelected 
              ? 'bg-primary text-primary-foreground' 
              : 'hover:bg-muted'
          }`}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => handleCategoryClick(category)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleCategory(category.id);
              }}
              className="p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          )}
          <span className={`text-sm ${!hasChildren ? 'ml-5' : ''}`}>
            {category.name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {children.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const SidebarContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">Categories</h3>
        <div className="space-y-1">
          <div
            className={`flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer transition-colors ${
              !selectedCategory 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted'
            }`}
            onClick={() => onCategoryChange?.(null)}
          >
            <span className="text-sm ml-5">All Products</span>
          </div>
          {rootCategories.map(category => renderCategory(category))}
        </div>
      </div>

      <Separator />

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">Price Range</h3>
        <div className="px-2">
          <Slider
            value={priceRange}
            min={0}
            max={maxPrice}
            step={100}
            onValueChange={handlePriceChange}
            className="mb-4"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
            <span>रु {priceRange[0].toLocaleString()}</span>
            <span>रु {priceRange[1].toLocaleString()}</span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={applyPriceFilter}
          >
            Apply Price Filter
          </Button>
        </div>
      </div>

      <Separator />

      {/* Clear Filters */}
      <Button
        variant="ghost"
        className="w-full text-muted-foreground"
        onClick={clearFilters}
      >
        <X className="w-4 h-4 mr-2" />
        Clear All Filters
      </Button>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className={`hidden lg:block w-64 flex-shrink-0 ${className}`}>
        <div className="sticky top-24 bg-background rounded-lg border p-4">
          <SidebarContent />
        </div>
      </aside>

      {/* Mobile Filter Button & Sheet */}
      <div className="lg:hidden mb-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-80px)] pr-4">
              <div className="py-4">
                <SidebarContent />
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
