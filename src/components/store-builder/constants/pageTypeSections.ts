/**
 * ============================================================================
 * PAGE TYPE SECTION FILTERING
 * ============================================================================
 * 
 * Defines which section types are available for each page type.
 * This ensures each page type only shows relevant section options in the palette.
 * 
 * PHILOSOPHY:
 * - Homepage: Full access to all sections (maximum flexibility)
 * - Content pages (about, contact, policy): Content-focused sections only
 * - Shop pages (product, category): Product/category sections + marketing
 * - System pages (cart, checkout, profile): No customizable sections (functional)
 * 
 * ============================================================================
 */

import { PageType, SectionType } from '../types';

/**
 * Map of page types to their allowed section types.
 * Empty array means no customizable sections (system/functional page).
 */
export const PAGE_TYPE_SECTIONS: Record<PageType, SectionType[]> = {
  // ============================================================================
  // HOMEPAGE - Full access to all sections
  // ============================================================================
  homepage: [
    // Hero sections
    'hero_banner', 'hero_slider', 'hero_video',
    // Product sections
    'featured_products', 'product_grid', 'product_carousel', 'new_arrivals', 'best_sellers',
    // Category sections
    'category_grid', 'category_banner',
    // Content sections
    'text_block', 'image_text', 'gallery', 'testimonials', 'faq',
    // Marketing sections
    'announcement_bar', 'newsletter', 'countdown', 'promo_banner', 'trust_badges', 'brand_logos',
    // Layout sections
    'spacer', 'divider', 'custom_html',
  ],

  // ============================================================================
  // CONTENT PAGES - Minimal, content-focused sections
  // ============================================================================
  
  // About page: Content-focused sections for storytelling
  about: [
    'text_block', 'image_text', 'gallery', 'testimonials', 'trust_badges', 'faq',
    'spacer', 'divider',
  ],

  // Contact page: Minimal sections for contact info
  contact: [
    'text_block', 'image_text', 'faq',
    'spacer', 'divider',
  ],

  // Policy pages (terms, privacy, etc.): Text-heavy sections
  policy: [
    'text_block', 'faq',
    'spacer', 'divider',
  ],

  // Custom pages: Basic content sections
  custom: [
    'text_block', 'image_text', 'gallery', 'faq',
    'spacer', 'divider',
  ],

  // ============================================================================
  // SHOP PAGES - Product display + marketing
  // ============================================================================
  
  // Product catalog/listing page
  product: [
    'product_grid', 'product_carousel', 'featured_products', 'new_arrivals', 'best_sellers',
    'category_grid', 'promo_banner', 'trust_badges',
    'spacer', 'divider',
  ],

  // Category browsing page
  category: [
    'category_grid', 'category_banner', 'product_grid',
    'promo_banner',
    'spacer', 'divider',
  ],

  // ============================================================================
  // SYSTEM PAGES - Functional pages, no customizable sections
  // ============================================================================
  
  // Shopping cart - functional component
  cart: [],

  // Checkout flow - functional component
  checkout: [],

  // Customer profile/account - functional component
  profile: [],

  // Order tracking - functional component
  order_tracking: [],

  // Search results - functional component
  search: [],
};

/**
 * Get the allowed sections for a page type.
 * Returns all sections if page type is not found (fallback for safety).
 */
export function getAllowedSections(pageType: PageType): SectionType[] {
  return PAGE_TYPE_SECTIONS[pageType] ?? [];
}

/**
 * Check if a section type is allowed for a page type.
 */
export function isSectionAllowed(pageType: PageType, sectionType: SectionType): boolean {
  const allowed = PAGE_TYPE_SECTIONS[pageType];
  if (!allowed) return false;
  return allowed.includes(sectionType);
}

/**
 * Get a descriptive message for system pages with no customizable sections.
 */
export function getSystemPageMessage(pageType: PageType): string | null {
  const messages: Partial<Record<PageType, string>> = {
    cart: 'Shopping cart is a functional page. Configure cart behavior in store settings.',
    checkout: 'Checkout is a functional page. Configure payment and shipping in store settings.',
    profile: 'Customer profile is a functional page managed by the authentication system.',
    order_tracking: 'Order tracking is a functional page that displays order status automatically.',
    search: 'Search results are generated dynamically based on customer queries.',
  };
  return messages[pageType] ?? null;
}
