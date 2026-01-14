/**
 * ============================================================================
 * SUBDOMAIN DETECTION UTILITIES
 * ============================================================================
 * 
 * Detects store slugs from subdomains and builds correct URLs.
 * Supports both subdomain-based and path-based routing modes.
 * 
 * USAGE:
 * - getStoreSlugFromSubdomain(): Returns store slug if on subdomain
 * - isStorefrontSubdomain(): Check if we're on a store subdomain
 * - isMainDomain(): Check if we're on the main platform domain
 * - buildStoreUrl(): Generate correct URL for a store path
 * 
 * CONFIGURATION:
 * - Add production domains to SUBDOMAIN_ENABLED_DOMAINS
 * - Add system subdomains to RESERVED_SUBDOMAINS
 * 
 * ============================================================================
 */

// Domains where subdomain routing is enabled
// Add your production domain here
const SUBDOMAIN_ENABLED_DOMAINS = [
  'extendbee.com',
  'nepal-shop-nest.lovable.app',
  // Add other domains as needed
];

// Subdomains that are reserved for system use (not stores)
const RESERVED_SUBDOMAINS = [
  'www',
  'app', 
  'admin',
  'dashboard',
  'api',
  'mail',
  'smtp',
  'ftp',
  'cdn',
  'static',
  'assets',
  'dev',
  'staging',
  'test',
];

/**
 * Extract store slug from subdomain
 * 
 * @returns Store slug if on a valid store subdomain, null otherwise
 * 
 * @example
 * // On bombay.extendbee.com
 * getStoreSlugFromSubdomain() // => 'bombay'
 * 
 * // On www.extendbee.com or extendbee.com
 * getStoreSlugFromSubdomain() // => null
 */
export function getStoreSlugFromSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  
  // Check each enabled domain
  for (const rootDomain of SUBDOMAIN_ENABLED_DOMAINS) {
    // Handle domain with potential port (for lovable.app preview domains)
    const baseDomain = rootDomain.split(':')[0];
    
    if (hostname.endsWith(`.${baseDomain}`)) {
      // Extract subdomain part
      const subdomain = hostname.replace(`.${baseDomain}`, '');
      
      // Skip if it's a reserved subdomain
      if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
        return null;
      }
      
      // Skip if contains dots (e.g., www.bombay.extendbee.com)
      if (subdomain.includes('.')) {
        return null;
      }
      
      // Skip empty subdomain
      if (!subdomain) {
        return null;
      }
      
      return subdomain.toLowerCase();
    }
  }
  
  return null;
}

/**
 * Check if current page is a storefront subdomain
 * 
 * @returns true if on a store subdomain, false otherwise
 */
export function isStorefrontSubdomain(): boolean {
  return getStoreSlugFromSubdomain() !== null;
}

/**
 * Check if current page is on the main platform domain
 * (not a store subdomain)
 * 
 * @returns true if on main domain, false if on subdomain
 */
export function isMainDomain(): boolean {
  if (typeof window === 'undefined') return true;
  
  const hostname = window.location.hostname;
  
  // Localhost is always main domain (for development)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return true;
  }
  
  // Check if it's a root domain or www subdomain
  for (const rootDomain of SUBDOMAIN_ENABLED_DOMAINS) {
    const baseDomain = rootDomain.split(':')[0];
    if (hostname === baseDomain || hostname === `www.${baseDomain}`) {
      return true;
    }
  }
  
  // Check for Lovable preview domains (id-preview--xxx.lovable.app)
  if (hostname.includes('lovable.app') && !isStorefrontSubdomain()) {
    return true;
  }
  
  return !isStorefrontSubdomain();
}

/**
 * Build a URL for a store page
 * 
 * @param storeSlug - The store's slug
 * @param path - The path within the store (e.g., '/product/xyz')
 * @param forceSubdomain - Force subdomain URL even when on path-based
 * @returns The full URL path
 * 
 * @example
 * // When on subdomain mode (bombay.extendbee.com)
 * buildStoreUrl('bombay', '/product/xyz') // => '/product/xyz'
 * 
 * // When on path mode (extendbee.com)
 * buildStoreUrl('bombay', '/product/xyz') // => '/store/bombay/product/xyz'
 */
export function buildStoreUrl(
  storeSlug: string, 
  path: string = '',
  forceSubdomain: boolean = false
): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // If we're already on a subdomain, use relative paths
  if (isStorefrontSubdomain()) {
    return normalizedPath === '/' ? '/' : normalizedPath;
  }
  
  // If forcing subdomain URL (for display purposes)
  if (forceSubdomain) {
    // Return the subdomain URL format
    return `https://${storeSlug}.extendbee.com${normalizedPath}`;
  }
  
  // Default: path-based URL
  return `/store/${storeSlug}${normalizedPath}`;
}

/**
 * Get the full subdomain URL for a store
 * Used for display in admin/settings
 * 
 * @param storeSlug - The store's slug
 * @returns Full subdomain URL
 */
export function getSubdomainUrl(storeSlug: string): string {
  return `https://${storeSlug}.extendbee.com`;
}

/**
 * Get the path-based URL for a store
 * Used for display in admin/settings
 * 
 * @param storeSlug - The store's slug
 * @returns Full path-based URL
 */
export function getPathBasedUrl(storeSlug: string): string {
  return `https://extendbee.com/store/${storeSlug}`;
}
