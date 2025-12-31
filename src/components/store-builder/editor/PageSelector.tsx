/**
 * ============================================================================
 * PAGE SELECTOR COMPONENT
 * ============================================================================
 * 
 * Dropdown selector for choosing which page to edit in the store builder.
 * Displayed above the Sections/Theme tabs.
 * 
 * ============================================================================
 */

import { StorePage, ExtendedPageType, getExtendedPageType } from '../types';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Home,
  Package,
  Info,
  Phone,
  ShoppingCart,
  CreditCard,
  User,
  FileText,
  File,
  Layers,
} from 'lucide-react';

interface PageSelectorProps {
  pages: StorePage[];
  activePage: StorePage | null;
  onSelectPage: (page: StorePage) => void;
}

// Get icon for page based on extended page type
function getPageIcon(page: StorePage) {
  const extendedType = getExtendedPageType(page);

  const iconMap: Record<ExtendedPageType, React.ComponentType<{ className?: string }>> = {
    homepage: Home,
    catalog: Package,
    product_detail: Layers,
    cart: ShoppingCart,
    checkout: CreditCard,
    profile: User,
    about: Info,
    contact: Phone,
    policy: FileText,
    custom: File,
  };

  return iconMap[extendedType] || File;
}

// Get page type display label
function getPageTypeLabel(page: StorePage): string {
  const extendedType = getExtendedPageType(page);
  
  const labels: Record<ExtendedPageType, string> = {
    homepage: 'Homepage',
    catalog: 'Catalog',
    product_detail: 'Product Page',
    cart: 'Cart',
    checkout: 'Checkout',
    profile: 'Account',
    about: 'About',
    contact: 'Contact',
    policy: 'Policy',
    custom: 'Custom',
  };
  
  return labels[extendedType] || 'Page';
}

export function PageSelector({ pages, activePage, onSelectPage }: PageSelectorProps) {
  // Sort pages: homepage first, then standard pages, then custom pages
  const sortedPages = [...pages].sort((a, b) => {
    const order: Record<string, number> = {
      home: 0,
      products: 1,
      product: 2,
      cart: 3,
      checkout: 4,
      account: 5,
      about: 6,
      contact: 7,
    };
    const aOrder = order[a.slug] ?? 100;
    const bOrder = order[b.slug] ?? 100;
    if (aOrder !== bOrder) return aOrder - bOrder;
    return a.title.localeCompare(b.title);
  });

  const handlePageChange = (pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (page) {
      onSelectPage(page);
    }
  };

  return (
    <div className="p-3 border-b border-border bg-muted/30">
      <Label className="text-xs text-muted-foreground mb-1.5 block">
        Editing Page
      </Label>
      <Select 
        value={activePage?.id || ''} 
        onValueChange={handlePageChange}
      >
        <SelectTrigger className="w-full bg-background">
          <SelectValue placeholder="Select a page to edit...">
            {activePage && (
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = getPageIcon(activePage);
                  return <Icon className="w-4 h-4" />;
                })()}
                <span>{activePage.title}</span>
                {!activePage.is_published && (
                  <span className="text-xs text-muted-foreground">(Draft)</span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {sortedPages.map((page) => {
            const Icon = getPageIcon(page);
            return (
              <SelectItem key={page.id} value={page.id}>
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{page.title}</span>
                  {!page.is_published && (
                    <span className="text-xs text-muted-foreground">(Draft)</span>
                  )}
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      {activePage && (
        <p className="text-xs text-muted-foreground mt-1.5">
          /{activePage.slug} • {getPageTypeLabel(activePage)}
        </p>
      )}
    </div>
  );
}
