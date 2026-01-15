/**
 * ============================================================================
 * STORE LINKS HOOK
 * ============================================================================
 * 
 * Generates correct URLs for store pages based on routing mode.
 * Works with both subdomain-based and path-based routing.
 * 
 * USAGE:
 * const links = useStoreLinks();
 * <Link to={links.product('my-product')}>View Product</Link>
 * 
 * ============================================================================
 */

import { useStorefront, useStorefrontOptional } from '@/contexts/StorefrontContext';

interface StoreLinks {
  /** Home page */
  home: () => string;
  
  /** Product detail page */
  product: (slug: string) => string;
  
  /** Category page */
  category: (slug: string) => string;
  
  /** Shopping cart */
  cart: () => string;
  
  /** Checkout page */
  checkout: () => string;
  
  /** Product catalog/listing */
  catalog: () => string;
  
  /** Custom page by slug */
  page: (slug: string) => string;
  
  /** Search page */
  search: (query?: string) => string;
  
  /** Order tracking */
  orderTracking: (orderId?: string) => string;
  
  /** Customer authentication */
  auth: (returnTo?: string) => string;
  
  /** Customer account dashboard */
  account: () => string;
  
  /** Customer orders */
  orders: () => string;
  
  /** Customer profile */
  profile: () => string;
  
  /** Build any custom path */
  custom: (path: string) => string;
}

/**
 * Build store links with routing mode awareness
 * Requires StorefrontProvider context
 */
export function useStoreLinks(): StoreLinks {
  const { storeSlug, isSubdomainMode } = useStorefront();
  
  const buildLink = (path: string): string => {
    // Ensure path starts with /
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    if (isSubdomainMode) {
      // Subdomain mode: use relative paths
      return normalizedPath;
    }
    
    // Path mode: prefix with /store/:storeSlug
    return `/store/${storeSlug}${normalizedPath}`;
  };
  
  return {
    home: () => buildLink('/'),
    
    product: (slug: string) => buildLink(`/product/${slug}`),
    
    category: (slug: string) => buildLink(`/categories?cat=${encodeURIComponent(slug)}`),
    
    cart: () => buildLink('/cart'),
    
    checkout: () => buildLink('/checkout'),
    
    catalog: () => buildLink('/catalog'),
    
    page: (slug: string) => buildLink(`/page/${slug}`),
    
    search: (query?: string) => {
      const searchPath = query 
        ? `/search?q=${encodeURIComponent(query)}`
        : '/search';
      return buildLink(searchPath);
    },
    
    orderTracking: (orderId?: string) => {
      const trackingPath = orderId 
        ? `/order/${orderId}`
        : '/order-tracking';
      return buildLink(trackingPath);
    },
    
    auth: (returnTo?: string) => {
      const authPath = returnTo
        ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
        : '/auth';
      return buildLink(authPath);
    },
    
    account: () => buildLink('/account'),
    
    orders: () => buildLink('/account/orders'),
    
    profile: () => buildLink('/account/profile'),
    
    custom: (path: string) => buildLink(path),
  };
}

/**
 * Build store links with optional context
 * For components that may be used outside StorefrontProvider
 * Falls back to provided storeSlug for path-based URLs
 */
export function useStoreLinksWithFallback(fallbackStoreSlug: string): StoreLinks {
  const context = useStorefrontOptional();
  
  const storeSlug = context?.storeSlug || fallbackStoreSlug;
  const isSubdomainMode = context?.isSubdomainMode || false;
  
  const buildLink = (path: string): string => {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    if (isSubdomainMode) {
      return normalizedPath;
    }
    
    return `/store/${storeSlug}${normalizedPath}`;
  };
  
  return {
    home: () => buildLink('/'),
    product: (slug: string) => buildLink(`/product/${slug}`),
    category: (slug: string) => buildLink(`/categories?cat=${encodeURIComponent(slug)}`),
    cart: () => buildLink('/cart'),
    checkout: () => buildLink('/checkout'),
    catalog: () => buildLink('/catalog'),
    page: (slug: string) => buildLink(`/page/${slug}`),
    search: (query?: string) => {
      const searchPath = query 
        ? `/search?q=${encodeURIComponent(query)}`
        : '/search';
      return buildLink(searchPath);
    },
    orderTracking: (orderId?: string) => {
      const trackingPath = orderId 
        ? `/order/${orderId}`
        : '/order-tracking';
      return buildLink(trackingPath);
    },
    auth: (returnTo?: string) => {
      const authPath = returnTo
        ? `/auth?returnTo=${encodeURIComponent(returnTo)}`
        : '/auth';
      return buildLink(authPath);
    },
    account: () => buildLink('/account'),
    orders: () => buildLink('/account/orders'),
    profile: () => buildLink('/account/profile'),
    custom: (path: string) => buildLink(path),
  };
}

/**
 * Simple link builder function (non-hook)
 * For use outside of React components
 */
export function buildStoreLink(
  storeSlug: string, 
  path: string, 
  isSubdomainMode: boolean = false
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  if (isSubdomainMode) {
    return normalizedPath;
  }
  
  return `/store/${storeSlug}${normalizedPath}`;
}
