/**
 * ============================================================================
 * BUILT-IN CONTENT PLACEHOLDER COMPONENT (Module 1C.8c)
 * ============================================================================
 * 
 * Visual indicator in the preview frame showing where built-in content
 * (like product listings) will render on system pages.
 * 
 * ============================================================================
 */

import { cn } from '@/lib/utils';
import { Package, Grid, ShoppingBag, User, Search, Receipt } from 'lucide-react';
import { PageType } from '../types';

interface BuiltInContentPlaceholderProps {
  pageType: PageType;
  className?: string;
}

const PAGE_TYPE_INFO: Record<string, { icon: typeof Package; label: string; description: string }> = {
  product: {
    icon: Package,
    label: 'Product Listing',
    description: 'Your store products will display here with filters and sorting',
  },
  category: {
    icon: Grid,
    label: 'Category Grid',
    description: 'Category browsing and product listing will display here',
  },
  cart: {
    icon: ShoppingBag,
    label: 'Shopping Cart',
    description: 'Customer cart contents will display here',
  },
  checkout: {
    icon: Receipt,
    label: 'Checkout Form',
    description: 'Payment and shipping forms will display here',
  },
  profile: {
    icon: User,
    label: 'Customer Profile',
    description: 'Account details and order history will display here',
  },
  search: {
    icon: Search,
    label: 'Search Results',
    description: 'Product search results will display here',
  },
};

export function BuiltInContentPlaceholder({ pageType, className }: BuiltInContentPlaceholderProps) {
  const info = PAGE_TYPE_INFO[pageType];
  
  if (!info) return null;
  
  const Icon = info.icon;
  
  return (
    <div className={cn(
      'border-2 border-dashed border-primary/40 rounded-lg bg-primary/5 p-8 mx-4 my-6',
      className
    )}>
      <div className="flex flex-col items-center justify-center text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground">{info.label}</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md">
            {info.description}
          </p>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
          Built-in Content
        </span>
      </div>
    </div>
  );
}
