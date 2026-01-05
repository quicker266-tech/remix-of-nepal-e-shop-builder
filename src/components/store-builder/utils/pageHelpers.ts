/**
 * ============================================================================
 * PAGE HELPER UTILITIES (Module 1C.8e)
 * ============================================================================
 * 
 * Helper functions for identifying page types and their capabilities.
 * 
 * ============================================================================
 */

import { PageType } from '../types';

/**
 * Page types that have built-in content (not just sections)
 * These pages render system content (product listings, cart, etc.)
 * in addition to custom sections.
 */
export const PAGES_WITH_BUILT_IN_CONTENT: PageType[] = [
  'product',
  'category',
  'cart',
  'checkout',
  'profile',
  'search',
  'order_tracking',
];

/**
 * Check if a page type has built-in system content
 */
export function hasBuiltInContent(pageType: PageType): boolean {
  return PAGES_WITH_BUILT_IN_CONTENT.includes(pageType);
}

/**
 * Get human-readable label for page type
 */
export function getPageTypeLabel(pageType: PageType): string {
  const labels: Record<PageType, string> = {
    homepage: 'Homepage',
    about: 'About',
    contact: 'Contact',
    policy: 'Policy',
    custom: 'Custom Page',
    product: 'Products',
    category: 'Categories',
    cart: 'Cart',
    checkout: 'Checkout',
    profile: 'Profile',
    order_tracking: 'Order Tracking',
    search: 'Search',
  };
  return labels[pageType] || pageType;
}

/**
 * Check if sections can be positioned above/below content
 */
export function supportsPositioning(pageType: PageType): boolean {
  return hasBuiltInContent(pageType);
}
