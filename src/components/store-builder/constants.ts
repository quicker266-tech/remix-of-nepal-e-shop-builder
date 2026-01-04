/**
 * ============================================================================
 * STORE BUILDER CONSTANTS
 * ============================================================================
 * 
 * This file contains all constant values used throughout the Store Builder.
 * Includes section definitions, default configs, and available fonts.
 * 
 * ============================================================================
 */

import { SectionDefinition, SectionType } from './types';

// ============================================================================
// AVAILABLE GOOGLE FONTS
// ============================================================================

export const AVAILABLE_FONTS = [
  { name: 'Plus Jakarta Sans', value: "'Plus Jakarta Sans', sans-serif" },
  { name: 'Inter', value: "'Inter', sans-serif" },
  { name: 'Poppins', value: "'Poppins', sans-serif" },
  { name: 'Roboto', value: "'Roboto', sans-serif" },
  { name: 'Open Sans', value: "'Open Sans', sans-serif" },
  { name: 'Lato', value: "'Lato', sans-serif" },
  { name: 'Montserrat', value: "'Montserrat', sans-serif" },
  { name: 'Playfair Display', value: "'Playfair Display', serif" },
  { name: 'Merriweather', value: "'Merriweather', serif" },
  { name: 'Raleway', value: "'Raleway', sans-serif" },
  { name: 'Nunito', value: "'Nunito', sans-serif" },
  { name: 'Work Sans', value: "'Work Sans', sans-serif" },
  { name: 'DM Sans', value: "'DM Sans', sans-serif" },
  { name: 'Space Grotesk', value: "'Space Grotesk', sans-serif" },
];

// ============================================================================
// SECTION DEFINITIONS
// ============================================================================
// Each section has a type, label, icon, category, and default configuration.
// This allows the editor to dynamically render section options.
// ============================================================================

export const SECTION_DEFINITIONS: Record<SectionType, SectionDefinition> = {
  // Header/Footer (typically not user-added, but configurable)
  header: {
    type: 'header',
    label: 'Header',
    icon: 'LayoutTop',
    category: 'layout',
    description: 'Site header with logo and navigation',
    defaultConfig: {},
  },
  footer: {
    type: 'footer',
    label: 'Footer',
    icon: 'LayoutBottom',
    category: 'layout',
    description: 'Site footer with links and info',
    defaultConfig: {},
  },

  // Hero Sections
  hero_banner: {
    type: 'hero_banner',
    label: 'Hero Banner',
    icon: 'Image',
    category: 'hero',
    description: 'Full-width banner with title, subtitle, and CTA',
    defaultConfig: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products',
      buttonText: 'Shop Now',
      buttonLink: '#products',
      textAlignment: 'center',
      height: 'large',
      backgroundOverlay: 40,
    },
  },
  hero_slider: {
    type: 'hero_slider',
    label: 'Hero Slider',
    icon: 'Layers',
    category: 'hero',
    description: 'Sliding hero banners with multiple slides',
    defaultConfig: {
      slides: [
        { id: '1', title: 'Slide 1', subtitle: 'First slide description' },
        { id: '2', title: 'Slide 2', subtitle: 'Second slide description' },
      ],
      autoplay: true,
      interval: 5000,
    },
  },
  hero_video: {
    type: 'hero_video',
    label: 'Hero Video',
    icon: 'Video',
    category: 'hero',
    description: 'Video background with overlay content',
    defaultConfig: {
      videoUrl: '',
      title: 'Watch Our Story',
      muted: true,
      loop: true,
    },
  },

  // Product Sections
  featured_products: {
    type: 'featured_products',
    label: 'Featured Products',
    icon: 'Star',
    category: 'products',
    description: 'Showcase your featured products',
    defaultConfig: {
      title: 'Featured Products',
      productCount: 4,
      columns: 4,
      showPrice: true,
      showAddToCart: true,
    },
  },
  product_grid: {
    type: 'product_grid',
    label: 'Product Grid',
    icon: 'Grid3x3',
    category: 'products',
    description: 'Display products in a grid layout',
    defaultConfig: {
      title: 'Our Products',
      columns: 4,
      rows: 2,
      showFilters: false,
    },
  },
  product_carousel: {
    type: 'product_carousel',
    label: 'Product Carousel',
    icon: 'ChevronLeftRight',
    category: 'products',
    description: 'Scrollable product showcase',
    defaultConfig: {
      title: 'Popular Items',
      productCount: 8,
      autoplay: true,
    },
  },
  new_arrivals: {
    type: 'new_arrivals',
    label: 'New Arrivals',
    icon: 'Sparkles',
    category: 'products',
    description: 'Display newest products',
    defaultConfig: {
      title: 'New Arrivals',
      productCount: 4,
      columns: 4,
    },
  },
  best_sellers: {
    type: 'best_sellers',
    label: 'Best Sellers',
    icon: 'TrendingUp',
    category: 'products',
    description: 'Show top-selling products',
    defaultConfig: {
      title: 'Best Sellers',
      productCount: 4,
      columns: 4,
    },
  },

  // Category Sections
  category_grid: {
    type: 'category_grid',
    label: 'Category Grid',
    icon: 'LayoutGrid',
    category: 'categories',
    description: 'Display categories in a grid',
    defaultConfig: {
      title: 'Shop by Category',
      columns: 3,
      showDescription: true,
      showProductCount: true,
    },
  },
  category_banner: {
    type: 'category_banner',
    label: 'Category Banner',
    icon: 'ImagePlus',
    category: 'categories',
    description: 'Featured category with banner',
    defaultConfig: {
      title: 'Category Name',
      showProducts: true,
    },
  },

  // Content Sections
  text_block: {
    type: 'text_block',
    label: 'Text Block',
    icon: 'Type',
    category: 'content',
    description: 'Rich text content block',
    defaultConfig: {
      content: '<p>Add your content here...</p>',
      alignment: 'left',
      maxWidth: 'medium',
    },
  },
  image_text: {
    type: 'image_text',
    label: 'Image + Text',
    icon: 'Columns',
    category: 'content',
    description: 'Side-by-side image and text',
    defaultConfig: {
      title: 'About Us',
      content: 'Tell your brand story...',
      imageUrl: '',
      imagePosition: 'left',
    },
  },
  gallery: {
    type: 'gallery',
    label: 'Image Gallery',
    icon: 'Images',
    category: 'content',
    description: 'Grid of images',
    defaultConfig: {
      title: 'Gallery',
      images: [],
      columns: 3,
      aspectRatio: 'square',
    },
  },
  testimonials: {
    type: 'testimonials',
    label: 'Testimonials',
    icon: 'Quote',
    category: 'content',
    description: 'Customer reviews and quotes',
    defaultConfig: {
      title: 'What Our Customers Say',
      testimonials: [],
      layout: 'carousel',
    },
  },
  faq: {
    type: 'faq',
    label: 'FAQ',
    icon: 'HelpCircle',
    category: 'content',
    description: 'Frequently asked questions',
    defaultConfig: {
      title: 'Frequently Asked Questions',
      faqs: [],
    },
  },

  // Marketing Sections
  announcement_bar: {
    type: 'announcement_bar',
    label: 'Announcement Bar',
    icon: 'Megaphone',
    category: 'marketing',
    description: 'Top banner for announcements',
    defaultConfig: {
      text: 'Free shipping on orders over $50!',
      dismissible: true,
    },
  },
  newsletter: {
    type: 'newsletter',
    label: 'Newsletter Signup',
    icon: 'Mail',
    category: 'marketing',
    description: 'Email subscription form',
    defaultConfig: {
      title: 'Stay Updated',
      subtitle: 'Subscribe to our newsletter for updates and offers',
      buttonText: 'Subscribe',
      successMessage: 'Thank you for subscribing!',
    },
  },
  countdown: {
    type: 'countdown',
    label: 'Countdown Timer',
    icon: 'Clock',
    category: 'marketing',
    description: 'Sale or event countdown',
    defaultConfig: {
      title: 'Sale Ends In',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      expiredMessage: 'Sale has ended',
    },
  },
  promo_banner: {
    type: 'promo_banner',
    label: 'Promo Banner',
    icon: 'BadgePercent',
    category: 'marketing',
    description: 'Promotional banner',
    defaultConfig: {
      title: 'Special Offer',
      subtitle: 'Limited time only',
      buttonText: 'Shop Now',
      badge: 'SALE',
    },
  },

  // Social/Trust Sections
  social_feed: {
    type: 'social_feed',
    label: 'Social Feed',
    icon: 'Instagram',
    category: 'marketing',
    description: 'Social media feed display',
    defaultConfig: {},
  },
  trust_badges: {
    type: 'trust_badges',
    label: 'Trust Badges',
    icon: 'ShieldCheck',
    category: 'marketing',
    description: 'Trust and security badges',
    defaultConfig: {
      title: 'Why Shop With Us',
      badges: [
        { id: '1', icon: 'Truck', title: 'Free Shipping', description: 'On orders over $50' },
        { id: '2', icon: 'RotateCcw', title: 'Easy Returns', description: '30-day return policy' },
        { id: '3', icon: 'Lock', title: 'Secure Checkout', description: 'SSL encrypted' },
      ],
    },
  },
  brand_logos: {
    type: 'brand_logos',
    label: 'Brand Logos',
    icon: 'Building',
    category: 'marketing',
    description: 'Partner or brand logos',
    defaultConfig: {
      title: 'Our Partners',
      logos: [],
      grayscale: true,
    },
  },

  // Layout Elements
  custom_html: {
    type: 'custom_html',
    label: 'Custom HTML',
    icon: 'Code',
    category: 'layout',
    description: 'Custom HTML/CSS block',
    defaultConfig: {
      html: '<div>Custom content here</div>',
    },
  },
  spacer: {
    type: 'spacer',
    label: 'Spacer',
    icon: 'ArrowUpDown',
    category: 'layout',
    description: 'Vertical spacing element',
    defaultConfig: {
      height: 'medium',
    },
  },
  divider: {
    type: 'divider',
    label: 'Divider',
    icon: 'Minus',
    category: 'layout',
    description: 'Horizontal line divider',
    defaultConfig: {
      style: 'solid',
      width: 'container',
    },
  },

  // =========================================================================
  // PRODUCT PAGE SPECIFIC SECTIONS (Step 2.2)
  // =========================================================================
  product_filters: {
    type: 'product_filters',
    label: 'Product Filters',
    icon: 'Filter',
    category: 'products',
    description: 'Sidebar filters for products (price, category, attributes)',
    defaultConfig: {
      showPriceFilter: true,
      showCategoryFilter: true,
      showAttributeFilters: true,
      layout: 'sidebar',
    },
  },
  product_sort: {
    type: 'product_sort',
    label: 'Product Sort',
    icon: 'ArrowUpDown',
    category: 'products',
    description: 'Sort dropdown for products',
    defaultConfig: {
      options: ['newest', 'price_low', 'price_high', 'name_asc', 'name_desc'],
      defaultSort: 'newest',
    },
  },
  recently_viewed: {
    type: 'recently_viewed',
    label: 'Recently Viewed',
    icon: 'Clock',
    category: 'products',
    description: 'Display recently viewed products',
    defaultConfig: {
      title: 'Recently Viewed',
      productCount: 4,
      columns: 4,
    },
  },
  recommended_products: {
    type: 'recommended_products',
    label: 'Recommended Products',
    icon: 'Sparkles',
    category: 'products',
    description: 'Show recommended products based on browsing',
    defaultConfig: {
      title: 'You May Also Like',
      productCount: 4,
      columns: 4,
    },
  },
  product_reviews: {
    type: 'product_reviews',
    label: 'Product Reviews',
    icon: 'Star',
    category: 'products',
    description: 'Customer reviews and ratings section',
    defaultConfig: {
      title: 'Customer Reviews',
      showRatingSummary: true,
      showWriteReview: true,
      sortBy: 'newest',
    },
  },
};

// ============================================================================
// SECTION CATEGORIES
// ============================================================================

export const SECTION_CATEGORIES = [
  { id: 'hero', label: 'Hero Sections', icon: 'Image' },
  { id: 'products', label: 'Products', icon: 'Package' },
  { id: 'categories', label: 'Categories', icon: 'FolderTree' },
  { id: 'content', label: 'Content', icon: 'Type' },
  { id: 'marketing', label: 'Marketing', icon: 'Megaphone' },
  { id: 'layout', label: 'Layout', icon: 'Layout' },
];

// ============================================================================
// DEFAULT THEME
// ============================================================================

export const DEFAULT_THEME = {
  colors: {
    primary: '222 47% 31%',
    secondary: '210 40% 96%',
    accent: '217 91% 60%',
    background: '0 0% 100%',
    foreground: '222 47% 11%',
    muted: '210 40% 96%',
    mutedForeground: '215 16% 47%',
    border: '214 32% 91%',
    success: '142 76% 36%',
    warning: '38 92% 50%',
    error: '0 84% 60%',
  },
  typography: {
    headingFont: 'Plus Jakarta Sans',
    bodyFont: 'Plus Jakarta Sans',
    baseFontSize: '16px',
    headingWeight: '700',
    bodyWeight: '400',
  },
  layout: {
    containerMaxWidth: '1280px',
    sectionPadding: '4rem',
    borderRadius: '0.5rem',
    buttonRadius: '0.375rem',
  },
};

// ============================================================================
// SPACER HEIGHTS
// ============================================================================

export const SPACER_HEIGHTS = {
  small: '2rem',
  medium: '4rem',
  large: '6rem',
  xlarge: '8rem',
};

// ============================================================================
// HERO HEIGHTS
// ============================================================================

export const HERO_HEIGHTS = {
  small: '40vh',
  medium: '60vh',
  large: '80vh',
  full: '100vh',
};
