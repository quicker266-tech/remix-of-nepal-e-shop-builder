/**
 * ============================================================================
 * STORE BUILDER TYPE DEFINITIONS
 * ============================================================================
 * 
 * This file contains all TypeScript types for the Store Builder module.
 * These types mirror the database schema and provide type safety throughout
 * the visual editor and storefront renderer.
 * 
 * ARCHITECTURE NOTES:
 * - Types are organized by domain (theme, page, section, navigation)
 * - Each section type has a corresponding config interface
 * - All types are designed for extensibility
 * 
 * ============================================================================
 */

// ============================================================================
// ENUMS
// ============================================================================

/**
 * Page types for stores - matches database enum
 * 
 * NOTE: The database has a limited set of page_types. For special pages like
 * cart, checkout, profile, we use 'custom' type but identify them by slug.
 */
export type PageType = 'homepage' | 'about' | 'contact' | 'policy' | 'custom';

/**
 * Extended page type for UI purposes - includes special pages
 * identified by slug (cart, checkout, profile, catalog, product_detail)
 */
export type ExtendedPageType = 
  | PageType
  | 'cart'
  | 'checkout' 
  | 'profile'
  | 'catalog'
  | 'product_detail';

export type SectionType =
  // Header/Footer
  | 'header' | 'footer'
  // Hero Sections
  | 'hero_banner' | 'hero_slider' | 'hero_video'
  // Product Sections
  | 'featured_products' | 'product_grid' | 'product_carousel' | 'new_arrivals' | 'best_sellers'
  // Category Sections
  | 'category_grid' | 'category_banner'
  // Content Sections
  | 'text_block' | 'image_text' | 'gallery' | 'testimonials' | 'faq'
  // Marketing
  | 'announcement_bar' | 'newsletter' | 'countdown' | 'promo_banner'
  // Social/Trust
  | 'social_feed' | 'trust_badges' | 'brand_logos'
  // Custom
  | 'custom_html' | 'spacer' | 'divider';

export type NavLocation = 'header' | 'footer' | 'mobile';

// ============================================================================
// THEME TYPES
// ============================================================================

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface ThemeTypography {
  headingFont: string;
  bodyFont: string;
  baseFontSize: string;
  headingWeight: string;
  bodyWeight: string;
}

export interface ThemeLayout {
  containerMaxWidth: string;
  sectionPadding: string;
  borderRadius: string;
  buttonRadius: string;
}

export interface StoreTheme {
  id: string;
  store_id: string;
  name: string;
  is_active: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  custom_css?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// PAGE TYPES
// ============================================================================

export interface StorePage {
  id: string;
  store_id: string;
  title: string;
  slug: string;
  page_type: PageType;
  seo_title?: string;
  seo_description?: string;
  og_image_url?: string;
  is_published: boolean;
  published_at?: string;
  show_header: boolean;
  show_footer: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the extended page type based on page_type and slug
 * This allows us to identify special pages like cart, checkout by their slug
 */
export function getExtendedPageType(page: StorePage): ExtendedPageType {
  // Check slug first for special pages
  const slugMap: Record<string, ExtendedPageType> = {
    'cart': 'cart',
    'checkout': 'checkout',
    'account': 'profile',
    'profile': 'profile',
    'products': 'catalog',
    'catalog': 'catalog',
    'product': 'product_detail',
  };
  
  if (slugMap[page.slug]) {
    return slugMap[page.slug];
  }
  
  return page.page_type;
}

// ============================================================================
// SECTION CONFIG TYPES
// ============================================================================
// Each section type has its own configuration interface.
// This allows for type-safe section editing.
// ============================================================================

export interface HeroBannerConfig {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImage?: string;
  backgroundOverlay?: number; // 0-100 opacity
  textAlignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}

export interface HeroSliderConfig {
  slides: Array<{
    id: string;
    title: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    backgroundImage?: string;
  }>;
  autoplay?: boolean;
  interval?: number;
}

export interface HeroVideoConfig {
  videoUrl: string;
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  muted?: boolean;
  loop?: boolean;
}

export interface FeaturedProductsConfig {
  title?: string;
  subtitle?: string;
  productCount?: number;
  columns?: 2 | 3 | 4 | 5;
  showPrice?: boolean;
  showAddToCart?: boolean;
}

export interface ProductGridConfig {
  title?: string;
  categoryId?: string;
  productIds?: string[];
  columns?: 2 | 3 | 4 | 5;
  rows?: number;
  showFilters?: boolean;
}

export interface ProductCarouselConfig {
  title?: string;
  subtitle?: string;
  productCount?: number;
  autoplay?: boolean;
}

export interface CategoryGridConfig {
  title?: string;
  subtitle?: string;
  categoryIds?: string[];
  columns?: 2 | 3 | 4;
  showDescription?: boolean;
  showProductCount?: boolean;
}

export interface CategoryBannerConfig {
  categoryId: string;
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  showProducts?: boolean;
}

export interface TextBlockConfig {
  content: string; // Rich text / HTML
  alignment?: 'left' | 'center' | 'right';
  maxWidth?: 'small' | 'medium' | 'large' | 'full';
}

export interface ImageTextConfig {
  title?: string;
  content: string;
  imageUrl: string;
  imagePosition?: 'left' | 'right';
  buttonText?: string;
  buttonLink?: string;
}

export interface GalleryConfig {
  title?: string;
  images: Array<{
    id: string;
    url: string;
    alt?: string;
    link?: string;
  }>;
  columns?: 2 | 3 | 4;
  aspectRatio?: 'square' | 'landscape' | 'portrait';
}

export interface TestimonialsConfig {
  title?: string;
  testimonials: Array<{
    id: string;
    quote: string;
    author: string;
    role?: string;
    avatar?: string;
    rating?: number;
  }>;
  layout?: 'grid' | 'carousel';
}

export interface FaqConfig {
  title?: string;
  subtitle?: string;
  faqs: Array<{
    id: string;
    question: string;
    answer: string;
  }>;
}

export interface AnnouncementBarConfig {
  text: string;
  link?: string;
  backgroundColor?: string;
  textColor?: string;
  dismissible?: boolean;
}

export interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  backgroundColor?: string;
  successMessage?: string;
}

export interface CountdownConfig {
  title?: string;
  endDate: string;
  backgroundImage?: string;
  buttonText?: string;
  buttonLink?: string;
  expiredMessage?: string;
}

export interface PromoBannerConfig {
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  buttonText?: string;
  buttonLink?: string;
  badge?: string;
}

export interface TrustBadgesConfig {
  title?: string;
  badges: Array<{
    id: string;
    icon: string;
    title: string;
    description?: string;
  }>;
}

export interface BrandLogosConfig {
  title?: string;
  logos: Array<{
    id: string;
    imageUrl: string;
    alt: string;
    link?: string;
  }>;
  grayscale?: boolean;
}

export interface SpacerConfig {
  height: 'small' | 'medium' | 'large' | 'xlarge';
}

export interface DividerConfig {
  style: 'solid' | 'dashed' | 'dotted';
  color?: string;
  width?: 'full' | 'container' | 'narrow';
}

export interface CustomHtmlConfig {
  html: string;
  css?: string;
}

// Union type for all section configs
export type SectionConfig =
  | HeroBannerConfig
  | HeroSliderConfig
  | HeroVideoConfig
  | FeaturedProductsConfig
  | ProductGridConfig
  | ProductCarouselConfig
  | CategoryGridConfig
  | CategoryBannerConfig
  | TextBlockConfig
  | ImageTextConfig
  | GalleryConfig
  | TestimonialsConfig
  | FaqConfig
  | AnnouncementBarConfig
  | NewsletterConfig
  | CountdownConfig
  | PromoBannerConfig
  | TrustBadgesConfig
  | BrandLogosConfig
  | SpacerConfig
  | DividerConfig
  | CustomHtmlConfig
  | Record<string, unknown>;

// ============================================================================
// PAGE SECTION TYPE
// ============================================================================

export interface PageSection {
  id: string;
  page_id: string;
  store_id: string;
  section_type: SectionType;
  name: string;
  config: SectionConfig;
  is_visible: boolean;
  sort_order: number;
  mobile_config?: SectionConfig;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// NAVIGATION TYPES
// ============================================================================

export interface NavItem {
  id: string;
  store_id: string;
  label: string;
  url?: string;
  page_id?: string;
  location: NavLocation;
  parent_id?: string;
  sort_order: number;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
  children?: NavItem[];
  created_at: string;
  updated_at: string;
}

// ============================================================================
// HEADER/FOOTER CONFIG TYPES
// ============================================================================

export interface HeaderConfig {
  layout: 'logo-left' | 'logo-center' | 'logo-right';
  sticky: boolean;
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
  announcementBar?: {
    text: string;
    link?: string;
    backgroundColor?: string;
    textColor?: string;
  };
  backgroundColor?: string;
  textColor?: string;
}

export interface FooterColumn {
  id: string;
  title: string;
  links: Array<{
    label: string;
    url: string;
  }>;
}

export interface FooterConfig {
  layout: 'simple' | 'multi-column' | 'minimal';
  showNewsletter: boolean;
  showSocialLinks: boolean;
  showPaymentIcons: boolean;
  copyrightText?: string;
  backgroundColor?: string;
  textColor?: string;
  columns: FooterColumn[];
}

export interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
  pinterest?: string;
}

export interface StoreHeaderFooter {
  id: string;
  store_id: string;
  header_config: HeaderConfig;
  footer_config: FooterConfig;
  social_links: SocialLinks;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// EDITOR STATE TYPES
// ============================================================================

export interface EditorState {
  selectedSectionId: string | null;
  isDragging: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  showGrid: boolean;
  zoom: number;
}

export interface SectionDefinition {
  type: SectionType;
  label: string;
  icon: string;
  category: 'hero' | 'products' | 'categories' | 'content' | 'marketing' | 'layout';
  description: string;
  defaultConfig: SectionConfig;
}
