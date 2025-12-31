/**
 * ============================================================================
 * PAGE CONFIGURATION
 * ============================================================================
 * 
 * Defines which section types are allowed for each page type.
 * This allows for page-specific customization options in the store builder.
 * 
 * SCALABILITY NOTE:
 * This configuration is designed to be extensible for future business verticals.
 * To add a new vertical (e.g., restaurant, service, portfolio):
 * 1. Add new PageType values to types.ts
 * 2. Add corresponding entries in PAGE_ALLOWED_SECTIONS
 * 3. Update STANDARD_PAGES in useStoreBuilder.ts
 * 
 * ============================================================================
 */

import { PageType, SectionType } from './types';

// All available section types for reference
const ALL_SECTIONS: SectionType[] = [
  'hero_banner', 'hero_slider', 'hero_video',
  'featured_products', 'product_grid', 'product_carousel', 'new_arrivals', 'best_sellers',
  'category_grid', 'category_banner',
  'text_block', 'image_text', 'gallery', 'testimonials', 'faq',
  'announcement_bar', 'newsletter', 'countdown', 'promo_banner',
  'trust_badges', 'brand_logos', 'spacer', 'divider',
];

// Content-focused sections for informational pages
const CONTENT_SECTIONS: SectionType[] = [
  'text_block', 'image_text', 'gallery', 'testimonials', 'faq',
  'trust_badges', 'brand_logos', 'spacer', 'divider',
];

// Marketing sections
const MARKETING_SECTIONS: SectionType[] = [
  'announcement_bar', 'newsletter', 'countdown', 'promo_banner',
  'trust_badges', 'brand_logos',
];

// Product display sections
const PRODUCT_SECTIONS: SectionType[] = [
  'featured_products', 'product_grid', 'product_carousel', 'new_arrivals', 'best_sellers',
  'category_grid', 'category_banner',
];

/**
 * Maps each PageType to the section types that can be added to that page.
 * Homepage gets full customization, other pages get limited options.
 */
export const PAGE_ALLOWED_SECTIONS: Record<PageType, SectionType[]> = {
  // Homepage: Full customization with all sections
  homepage: ALL_SECTIONS,

  // About page: Content-focused sections
  about: [
    'hero_banner',
    'text_block', 
    'image_text', 
    'gallery', 
    'testimonials',
    'trust_badges', 
    'brand_logos',
    'spacer', 
    'divider',
  ],

  // Contact page: Minimal content sections
  contact: [
    'text_block', 
    'image_text',
    'faq',
    'spacer', 
    'divider',
  ],

  // Policy pages (Terms, Privacy, Refund): Text only
  policy: [
    'text_block',
    'spacer', 
    'divider',
  ],

  // Custom pages: Most sections available
  custom: [
    'hero_banner', 'hero_slider',
    ...PRODUCT_SECTIONS,
    ...CONTENT_SECTIONS,
    ...MARKETING_SECTIONS,
    'spacer', 'divider',
  ],
};

/**
 * Standard pages that should exist for every e-commerce store.
 * These are auto-created when a store is first set up.
 * 
 * FUTURE EXTENSIBILITY:
 * For different business types, create separate standard page configs:
 * - RESTAURANT_PAGES: menu, reservations, locations
 * - SERVICE_PAGES: services, booking, portfolio
 * - PORTFOLIO_PAGES: work, case-studies, clients
 */
export interface StandardPageDefinition {
  page_type: PageType;
  title: string;
  slug: string;
  is_published: boolean;
  is_protected?: boolean; // Cannot be deleted
  default_sections?: Array<{
    section_type: SectionType;
    name: string;
    config: Record<string, unknown>;
  }>;
}

export const ECOMMERCE_STANDARD_PAGES: StandardPageDefinition[] = [
  {
    page_type: 'homepage',
    title: 'Homepage',
    slug: 'home',
    is_published: true,
    is_protected: true,
    // Homepage sections are created via store builder
  },
  {
    page_type: 'custom', // Using 'custom' until we extend PageType enum in DB
    title: 'Products',
    slug: 'products',
    is_published: true,
    is_protected: true,
    default_sections: [
      {
        section_type: 'product_grid',
        name: 'All Products',
        config: { title: 'All Products', columns: 4, rows: 4, showFilters: true },
      },
    ],
  },
  {
    page_type: 'about',
    title: 'About Us',
    slug: 'about',
    is_published: true,
    is_protected: false,
    default_sections: [
      {
        section_type: 'text_block',
        name: 'About Us',
        config: {
          title: 'About Our Store',
          content: '<p>Welcome to our store. Tell your customers about your business, your story, and what makes you unique.</p>',
          alignment: 'center',
          maxWidth: 'medium',
        },
      },
    ],
  },
  {
    page_type: 'contact',
    title: 'Contact',
    slug: 'contact',
    is_published: true,
    is_protected: false,
    default_sections: [
      {
        section_type: 'text_block',
        name: 'Contact Information',
        config: {
          title: 'Contact Us',
          content: '<p>Get in touch with us. We\'d love to hear from you!</p>',
          alignment: 'center',
          maxWidth: 'medium',
        },
      },
    ],
  },
];

/**
 * Protected page slugs that cannot be deleted by users.
 * These are essential pages for the store to function.
 */
export const PROTECTED_PAGE_SLUGS = ['home', 'products'];
