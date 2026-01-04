/**
 * ============================================================================
 * PAGE TYPE SECTION MAPPING
 * ============================================================================
 * 
 * Defines which section types are available for each page type.
 * This ensures pages have appropriate content options:
 * - Homepage: Full access to all sections
 * - About/Contact: Content-focused sections only
 * - Product/Category: Shop-specific sections
 * - System pages: No customizable sections (functional components)
 * 
 * ============================================================================
 */

import { PageType, SectionType } from '../types';

/**
 * Maps page types to their allowed section types.
 * Empty array means the page uses functional components (no customizable sections).
 */
export const PAGE_TYPE_SECTIONS: Record<PageType, SectionType[]> = {
  // Homepage: Full access to all content and marketing sections
  homepage: [
    // Hero
    'hero_banner', 'hero_slider', 'hero_video',
    // Products
    'featured_products', 'product_grid', 'product_carousel', 'new_arrivals', 'best_sellers',
    // Categories
    'category_grid', 'category_banner',
    // Content
    'text_block', 'image_text', 'gallery', 'testimonials', 'faq',
    // Marketing
    'announcement_bar', 'newsletter', 'countdown', 'promo_banner', 'trust_badges', 'brand_logos',
    // Layout
    'spacer', 'divider',
  ],

  // About page: Content-focused sections only
  about: [
    'text_block', 'image_text', 'gallery', 'testimonials', 'trust_badges', 'faq',
    'spacer', 'divider',
  ],

  // Contact page: Minimal content sections
  contact: [
    'text_block', 'image_text', 'faq',
    'spacer', 'divider',
  ],

  // Policy pages (privacy, terms, etc.): Text-focused
  policy: [
    'text_block', 'faq',
    'spacer', 'divider',
  ],

  // Custom pages: Basic content sections
  custom: [
    'text_block', 'image_text', 'gallery', 'faq',
    'spacer', 'divider',
  ],

  // Product catalog page: Product display + promotional sections + product-specific
  product: [
    // Product-specific sections (Step 2.2)
    'product_filters', 'product_sort', 'recently_viewed', 'recommended_products', 'product_reviews',
    // General product sections
    'product_grid', 'product_carousel', 'featured_products',
    'category_grid', 'promo_banner', 'trust_badges',
    'spacer', 'divider',
  ],

  // Category browsing page: Category focus + products
  category: [
    'category_grid', 'category_banner', 'product_grid',
    'product_filters', 'recently_viewed',
    'promo_banner',
    'spacer', 'divider',
  ],

  // =========================================================================
  // SYSTEM PAGES - No customizable sections (functional components only)
  // =========================================================================
  cart: [],
  checkout: [],
  profile: [],
  order_tracking: [],
  search: [],
};

/**
 * Get human-readable label for page type
 */
export const PAGE_TYPE_LABELS: Record<PageType, string> = {
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

/**
 * Check if a page type supports customizable sections
 */
export function isCustomizablePage(pageType: PageType): boolean {
  return PAGE_TYPE_SECTIONS[pageType].length > 0;
}

/**
 * Get available section count for a page type
 */
export function getAvailableSectionCount(pageType: PageType): number {
  return PAGE_TYPE_SECTIONS[pageType].length;
}
