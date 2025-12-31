/**
 * ============================================================================
 * PREVIEW FRAME COMPONENT
 * ============================================================================
 * 
 * Live preview of the storefront with responsive modes.
 * Renders sections based on their configuration with theme support.
 * 
 * FEATURES:
 * - Responsive preview (desktop/tablet/mobile)
 * - Zoom control
 * - Theme-aware rendering
 * - Full preview for all section types
 * - Click-to-select sections
 * 
 * ============================================================================
 */

import { PageSection, StoreTheme, SectionType } from '../types';
import { cn } from '@/lib/utils';
import { SPACER_HEIGHTS, HERO_HEIGHTS } from '../constants';
import { 
  ChevronLeft, ChevronRight, Play, Star, Quote, 
  Truck, RotateCcw, Lock, ShieldCheck, Package,
  Mail, HelpCircle, Clock, Building
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface PreviewFrameProps {
  store: { id: string; name: string; slug: string; logo_url?: string | null };
  theme: StoreTheme | null;
  sections: PageSection[];
  previewMode: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
}

const previewWidths = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PreviewFrame({
  store,
  theme,
  sections,
  previewMode,
  zoom,
  selectedSectionId,
  onSelectSection,
}: PreviewFrameProps) {
  // Generate CSS variables from theme
  const themeStyles = theme ? {
    '--preview-primary': `hsl(${theme.colors.primary})`,
    '--preview-secondary': `hsl(${theme.colors.secondary})`,
    '--preview-accent': `hsl(${theme.colors.accent})`,
    '--preview-background': `hsl(${theme.colors.background})`,
    '--preview-foreground': `hsl(${theme.colors.foreground})`,
    '--preview-muted': `hsl(${theme.colors.muted})`,
    '--preview-muted-foreground': `hsl(${theme.colors.mutedForeground})`,
    '--preview-border': `hsl(${theme.colors.border})`,
    '--preview-success': `hsl(${theme.colors.success})`,
    '--preview-warning': `hsl(${theme.colors.warning})`,
    '--preview-error': `hsl(${theme.colors.error})`,
    '--preview-heading-font': theme.typography.headingFont,
    '--preview-body-font': theme.typography.bodyFont,
    '--preview-font-size': theme.typography.baseFontSize,
    '--preview-border-radius': theme.layout.borderRadius,
    '--preview-padding': theme.layout.sectionPadding,
    fontFamily: theme.typography.bodyFont,
  } as React.CSSProperties : {};

  return (
    <div className="flex-1 overflow-auto p-4 flex justify-center">
      <div
        className="bg-background rounded-lg shadow-lg overflow-auto transition-all max-h-full"
        style={{
          width: previewWidths[previewMode],
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
          ...themeStyles,
        }}
      >
        {/* Store Header Preview */}
        <div className="bg-card border-b p-4 flex items-center gap-3">
          {store.logo_url ? (
            <img src={store.logo_url} alt={store.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
              {store.name.charAt(0)}
            </div>
          )}
          <span className="font-semibold">{store.name}</span>
        </div>

        {/* Sections */}
        <div className="min-h-[60vh]">
          {sections.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Add sections to see your store preview
            </div>
          ) : (
            sections.filter(s => s.is_visible).map((section) => (
              <div
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  'border-2 border-transparent cursor-pointer transition-colors',
                  selectedSectionId === section.id && 'border-primary bg-primary/5'
                )}
              >
                <SectionPreview section={section} previewMode={previewMode} />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SECTION PREVIEW RENDERER
// ============================================================================

function SectionPreview({ section, previewMode }: { section: PageSection; previewMode: string }) {
  const config = section.config as Record<string, any>;
  const isMobile = previewMode === 'mobile';

  switch (section.section_type) {
    // ==== HERO SECTIONS ====
    case 'hero_banner':
      return <HeroBannerPreview config={config} />;
    
    case 'hero_slider':
      return <HeroSliderPreview config={config} />;
    
    case 'hero_video':
      return <HeroVideoPreview config={config} />;

    // ==== PRODUCT SECTIONS ====
    case 'featured_products':
    case 'new_arrivals':
    case 'best_sellers':
      return <ProductGridPreview config={config} sectionName={section.name} isMobile={isMobile} />;
    
    case 'product_grid':
      return <ProductGridPreview config={config} sectionName={section.name} isMobile={isMobile} showFilters />;
    
    case 'product_carousel':
      return <ProductCarouselPreview config={config} />;

    // ==== CATEGORY SECTIONS ====
    case 'category_grid':
      return <CategoryGridPreview config={config} isMobile={isMobile} />;
    
    case 'category_banner':
      return <CategoryBannerPreview config={config} />;

    // ==== CONTENT SECTIONS ====
    case 'text_block':
      return <TextBlockPreview config={config} />;
    
    case 'image_text':
      return <ImageTextPreview config={config} isMobile={isMobile} />;
    
    case 'gallery':
      return <GalleryPreview config={config} isMobile={isMobile} />;
    
    case 'testimonials':
      return <TestimonialsPreview config={config} isMobile={isMobile} />;
    
    case 'faq':
      return <FaqPreview config={config} />;

    // ==== MARKETING SECTIONS ====
    case 'announcement_bar':
      return <AnnouncementBarPreview config={config} />;
    
    case 'newsletter':
      return <NewsletterPreview config={config} />;
    
    case 'countdown':
      return <CountdownPreview config={config} />;
    
    case 'promo_banner':
      return <PromoBannerPreview config={config} />;
    
    case 'trust_badges':
      return <TrustBadgesPreview config={config} isMobile={isMobile} />;
    
    case 'brand_logos':
      return <BrandLogosPreview config={config} />;
    
    case 'social_feed':
      return <SocialFeedPreview config={config} />;

    // ==== LAYOUT SECTIONS ====
    case 'spacer':
      return <SpacerPreview config={config} />;
    
    case 'divider':
      return <DividerPreview config={config} />;
    
    case 'custom_html':
      return <CustomHtmlPreview config={config} />;

    default:
      return (
        <div className="p-8 bg-muted/30 text-center text-muted-foreground">
          {section.name} ({section.section_type})
        </div>
      );
  }
}

// ============================================================================
// HERO SECTION PREVIEWS
// ============================================================================

function HeroBannerPreview({ config }: { config: Record<string, any> }) {
  const height = HERO_HEIGHTS[config.height as keyof typeof HERO_HEIGHTS] || HERO_HEIGHTS.large;
  
  return (
    <div
      className="relative flex items-center justify-center p-8"
      style={{
        minHeight: height,
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {config.backgroundImage && (
        <div className="absolute inset-0 bg-black" style={{ opacity: (config.backgroundOverlay || 0) / 100 }} />
      )}
      
      <div className={cn(
        'relative z-10 max-w-2xl',
        !config.backgroundImage && 'bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-12',
        config.textAlignment === 'left' && 'text-left mr-auto',
        config.textAlignment === 'right' && 'text-right ml-auto',
        (!config.textAlignment || config.textAlignment === 'center') && 'text-center mx-auto'
      )}>
        <h1 className={cn(
          'text-3xl font-bold mb-2',
          config.backgroundImage && 'text-white'
        )}>
          {config.title || 'Hero Title'}
        </h1>
        {config.subtitle && (
          <p className={cn('mb-4', config.backgroundImage ? 'text-white/80' : 'text-muted-foreground')}>
            {config.subtitle}
          </p>
        )}
        <div className="flex gap-3 flex-wrap justify-center">
          {config.buttonText && (
            <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
              {config.buttonText}
            </button>
          )}
          {config.secondaryButtonText && (
            <button className={cn(
              'px-6 py-2 rounded-lg font-medium border',
              config.backgroundImage ? 'border-white text-white' : 'border-border'
            )}>
              {config.secondaryButtonText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroSliderPreview({ config }: { config: Record<string, any> }) {
  const slides = config.slides || [];
  const firstSlide = slides[0] || { title: 'Slide Title', subtitle: 'Slide description' };
  
  return (
    <div className="relative min-h-[50vh] bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center p-8">
      <div className="text-center max-w-2xl">
        <h1 className="text-3xl font-bold mb-2">{firstSlide.title}</h1>
        {firstSlide.subtitle && <p className="text-muted-foreground mb-4">{firstSlide.subtitle}</p>}
        {firstSlide.buttonText && (
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg">
            {firstSlide.buttonText}
          </button>
        )}
      </div>
      
      {/* Slider indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_: any, i: number) => (
          <div key={i} className={cn('w-2 h-2 rounded-full', i === 0 ? 'bg-primary' : 'bg-primary/30')} />
        ))}
      </div>
      
      {/* Nav arrows */}
      <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

function HeroVideoPreview({ config }: { config: Record<string, any> }) {
  return (
    <div className="relative min-h-[50vh] bg-gray-900 flex items-center justify-center p-8">
      <div className="absolute inset-0 bg-black/50" />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center">
          <Play className="w-10 h-10 text-white fill-white" />
        </div>
      </div>
      <div className="relative z-10 text-center text-white">
        <h1 className="text-3xl font-bold mb-2">{config.title || 'Video Title'}</h1>
        {config.subtitle && <p className="text-white/80">{config.subtitle}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// PRODUCT SECTION PREVIEWS
// ============================================================================

function ProductGridPreview({ 
  config, 
  sectionName, 
  isMobile,
  showFilters = false 
}: { 
  config: Record<string, any>; 
  sectionName: string;
  isMobile: boolean;
  showFilters?: boolean;
}) {
  const columns = isMobile ? 2 : (config.columns || 4);
  const count = config.productCount || (config.rows ? config.rows * columns : 4);
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-2 text-center">{config.title || sectionName}</h2>
      {config.subtitle && <p className="text-muted-foreground text-center mb-6">{config.subtitle}</p>}
      
      {showFilters && config.showFilters && (
        <div className="flex gap-2 mb-4 justify-center">
          <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-sm">All</span>
          <span className="px-3 py-1 bg-muted rounded-full text-sm">Category 1</span>
          <span className="px-3 py-1 bg-muted rounded-full text-sm">Category 2</span>
        </div>
      )}
      
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-muted rounded-lg overflow-hidden">
            <div className="aspect-square bg-muted-foreground/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="p-3">
              <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2" />
              {config.showPrice !== false && (
                <div className="h-3 bg-primary/30 rounded w-1/3" />
              )}
              {config.showAddToCart && (
                <button className="mt-2 w-full bg-primary text-primary-foreground text-sm py-1.5 rounded">
                  Add to Cart
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCarouselPreview({ config }: { config: Record<string, any> }) {
  const count = Math.min(config.productCount || 4, 6);
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">{config.title || 'Products'}</h2>
      {config.subtitle && <p className="text-muted-foreground text-center mb-4">{config.subtitle}</p>}
      
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex-shrink-0 w-48 bg-muted rounded-lg overflow-hidden">
            <div className="aspect-square bg-muted-foreground/10 flex items-center justify-center">
              <Package className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <div className="p-3">
              <div className="h-3 bg-muted-foreground/20 rounded w-3/4 mb-2" />
              <div className="h-3 bg-primary/30 rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CATEGORY SECTION PREVIEWS
// ============================================================================

function CategoryGridPreview({ config, isMobile }: { config: Record<string, any>; isMobile: boolean }) {
  const columns = isMobile ? 2 : (config.columns || 3);
  
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6 text-center">{config.title || 'Shop by Category'}</h2>
      {config.subtitle && <p className="text-muted-foreground text-center mb-4">{config.subtitle}</p>}
      
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: config.columns || 3 }).map((_, i) => (
          <div key={i} className="bg-muted rounded-lg overflow-hidden group cursor-pointer">
            <div className="aspect-[4/3] bg-muted-foreground/10 flex items-center justify-center">
              <span className="text-muted-foreground">Category {i + 1}</span>
            </div>
            <div className="p-3 text-center">
              <p className="font-medium">Category Name</p>
              {config.showDescription && (
                <p className="text-sm text-muted-foreground">Browse items</p>
              )}
              {config.showProductCount && (
                <p className="text-xs text-muted-foreground mt-1">24 products</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryBannerPreview({ config }: { config: Record<string, any> }) {
  return (
    <div className="relative h-64 bg-gradient-to-r from-primary/30 to-accent/30 flex items-center justify-center"
      style={{
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {config.backgroundImage && <div className="absolute inset-0 bg-black/40" />}
      <div className="relative z-10 text-center">
        <h2 className={cn('text-3xl font-bold', config.backgroundImage && 'text-white')}>
          {config.title || 'Category Name'}
        </h2>
        {config.subtitle && (
          <p className={cn('mt-2', config.backgroundImage ? 'text-white/80' : 'text-muted-foreground')}>
            {config.subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CONTENT SECTION PREVIEWS
// ============================================================================

function TextBlockPreview({ config }: { config: Record<string, any> }) {
  const maxWidths = { small: '480px', medium: '640px', large: '800px', full: '100%' };
  
  return (
    <div 
      className="p-8 mx-auto prose prose-sm" 
      style={{ 
        textAlign: config.alignment || 'left',
        maxWidth: maxWidths[config.maxWidth as keyof typeof maxWidths] || maxWidths.medium 
      }}
    >
      <div dangerouslySetInnerHTML={{ __html: config.content || '<p>Text content here...</p>' }} />
    </div>
  );
}

function ImageTextPreview({ config, isMobile }: { config: Record<string, any>; isMobile: boolean }) {
  const isImageLeft = config.imagePosition !== 'right';
  
  return (
    <div className={cn('flex gap-8 p-8 items-center', isMobile && 'flex-col')}>
      <div className={cn(
        'flex-1 aspect-video bg-muted rounded-lg flex items-center justify-center',
        !isMobile && !isImageLeft && 'order-2'
      )}>
        {config.imageUrl ? (
          <img src={config.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
        ) : (
          <span className="text-muted-foreground">Image</span>
        )}
      </div>
      <div className={cn('flex-1', !isMobile && !isImageLeft && 'order-1')}>
        {config.title && <h2 className="text-2xl font-bold mb-4">{config.title}</h2>}
        <p className="text-muted-foreground mb-4">{config.content || 'Content goes here...'}</p>
        {config.buttonText && (
          <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg">
            {config.buttonText}
          </button>
        )}
      </div>
    </div>
  );
}

function GalleryPreview({ config, isMobile }: { config: Record<string, any>; isMobile: boolean }) {
  const columns = isMobile ? 2 : (config.columns || 3);
  const images = config.images || [];
  const aspectRatios = { square: 'aspect-square', landscape: 'aspect-video', portrait: 'aspect-[3/4]' };
  const aspectRatio = aspectRatios[config.aspectRatio as keyof typeof aspectRatios] || 'aspect-square';
  
  return (
    <div className="p-8">
      {config.title && <h2 className="text-2xl font-bold mb-6 text-center">{config.title}</h2>}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {(images.length > 0 ? images : Array.from({ length: 6 })).map((_: any, i: number) => (
          <div key={i} className={cn(aspectRatio, 'bg-muted rounded-lg flex items-center justify-center')}>
            <span className="text-muted-foreground text-sm">Image {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TestimonialsPreview({ config, isMobile }: { config: Record<string, any>; isMobile: boolean }) {
  const testimonials = config.testimonials?.length > 0 ? config.testimonials : [
    { id: '1', quote: 'Great product, highly recommend!', author: 'Customer Name', rating: 5 },
    { id: '2', quote: 'Amazing service and quality.', author: 'Another Customer', rating: 5 },
    { id: '3', quote: 'Will definitely buy again.', author: 'Happy Buyer', rating: 4 },
  ];
  
  return (
    <div className="p-8 bg-muted/30">
      {config.title && <h2 className="text-2xl font-bold mb-6 text-center">{config.title}</h2>}
      <div className={cn('grid gap-6', isMobile ? 'grid-cols-1' : 'grid-cols-3')}>
        {testimonials.slice(0, 3).map((t: any) => (
          <div key={t.id} className="bg-background p-6 rounded-lg">
            <Quote className="w-8 h-8 text-primary/30 mb-4" />
            <p className="text-muted-foreground mb-4">"{t.quote}"</p>
            <div className="flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={cn('w-4 h-4', i < (t.rating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300')} />
                ))}
              </div>
            </div>
            <p className="font-medium mt-2">{t.author}</p>
            {t.role && <p className="text-sm text-muted-foreground">{t.role}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

function FaqPreview({ config }: { config: Record<string, any> }) {
  const faqs = config.faqs?.length > 0 ? config.faqs : [
    { id: '1', question: 'How do I place an order?', answer: 'Simply browse our products and add to cart.' },
    { id: '2', question: 'What payment methods do you accept?', answer: 'We accept all major credit cards.' },
    { id: '3', question: 'How can I track my order?', answer: 'You will receive tracking info via email.' },
  ];
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      {config.title && <h2 className="text-2xl font-bold mb-2 text-center">{config.title}</h2>}
      {config.subtitle && <p className="text-muted-foreground text-center mb-6">{config.subtitle}</p>}
      <div className="space-y-3">
        {faqs.map((faq: any) => (
          <div key={faq.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-2 font-medium">
              <HelpCircle className="w-4 h-4 text-primary" />
              {faq.question}
            </div>
            <p className="text-muted-foreground text-sm mt-2 pl-6">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MARKETING SECTION PREVIEWS
// ============================================================================

function AnnouncementBarPreview({ config }: { config: Record<string, any> }) {
  return (
    <div 
      className="py-2 px-4 text-center text-sm font-medium"
      style={{
        backgroundColor: config.backgroundColor || 'hsl(var(--primary))',
        color: config.textColor || 'hsl(var(--primary-foreground))',
      }}
    >
      {config.text || 'Announcement text here'}
      {config.link && <span className="ml-2 underline cursor-pointer">Learn more</span>}
    </div>
  );
}

function NewsletterPreview({ config }: { config: Record<string, any> }) {
  return (
    <div 
      className="p-12 text-center"
      style={{ backgroundColor: config.backgroundColor }}
    >
      <Mail className="w-12 h-12 mx-auto mb-4 text-primary" />
      <h2 className="text-2xl font-bold mb-2">{config.title || 'Stay Updated'}</h2>
      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {config.subtitle || 'Subscribe to our newsletter for updates and offers'}
      </p>
      <div className="flex gap-2 max-w-md mx-auto">
        <input 
          type="email" 
          placeholder="Enter your email" 
          className="flex-1 px-4 py-2 border rounded-lg bg-background"
          readOnly
        />
        <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-medium">
          {config.buttonText || 'Subscribe'}
        </button>
      </div>
    </div>
  );
}

function CountdownPreview({ config }: { config: Record<string, any> }) {
  return (
    <div 
      className="p-12 text-center bg-gradient-to-r from-primary/10 to-accent/10"
      style={{
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      <h2 className="text-2xl font-bold mb-6">{config.title || 'Sale Ends In'}</h2>
      <div className="flex gap-4 justify-center">
        {['Days', 'Hours', 'Mins', 'Secs'].map((label) => (
          <div key={label} className="bg-background rounded-lg p-4 min-w-[80px]">
            <div className="text-3xl font-bold">00</div>
            <div className="text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>
      {config.buttonText && (
        <button className="mt-6 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-medium">
          {config.buttonText}
        </button>
      )}
    </div>
  );
}

function PromoBannerPreview({ config }: { config: Record<string, any> }) {
  return (
    <div 
      className="relative p-12 bg-gradient-to-r from-primary to-accent text-white text-center"
      style={{
        backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
        backgroundSize: 'cover',
      }}
    >
      {config.badge && (
        <span className="inline-block bg-white text-primary px-3 py-1 rounded-full text-sm font-bold mb-4">
          {config.badge}
        </span>
      )}
      <h2 className="text-3xl font-bold mb-2">{config.title || 'Special Offer'}</h2>
      {config.subtitle && <p className="text-white/80 mb-6">{config.subtitle}</p>}
      {config.buttonText && (
        <button className="bg-white text-primary px-8 py-3 rounded-lg font-medium">
          {config.buttonText}
        </button>
      )}
    </div>
  );
}

function TrustBadgesPreview({ config, isMobile }: { config: Record<string, any>; isMobile: boolean }) {
  const badges = config.badges?.length > 0 ? config.badges : [
    { id: '1', icon: 'Truck', title: 'Free Shipping', description: 'On orders over $50' },
    { id: '2', icon: 'RotateCcw', title: 'Easy Returns', description: '30-day return policy' },
    { id: '3', icon: 'Lock', title: 'Secure Checkout', description: 'SSL encrypted' },
  ];
  
  const iconMap: Record<string, any> = { Truck, RotateCcw, Lock, ShieldCheck };
  
  return (
    <div className="p-8 bg-muted/30">
      {config.title && <h2 className="text-xl font-bold mb-6 text-center">{config.title}</h2>}
      <div className={cn('flex justify-center gap-8', isMobile && 'flex-col items-center gap-4')}>
        {badges.map((badge: any) => {
          const Icon = iconMap[badge.icon] || ShieldCheck;
          return (
            <div key={badge.id} className="text-center">
              <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="font-medium">{badge.title}</p>
              {badge.description && (
                <p className="text-sm text-muted-foreground">{badge.description}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrandLogosPreview({ config }: { config: Record<string, any> }) {
  const logos = config.logos || [];
  
  return (
    <div className="p-8">
      {config.title && <h2 className="text-xl font-bold mb-6 text-center">{config.title}</h2>}
      <div className="flex justify-center items-center gap-8 flex-wrap">
        {(logos.length > 0 ? logos : Array.from({ length: 5 })).map((_: any, i: number) => (
          <div 
            key={i} 
            className={cn(
              'w-24 h-12 bg-muted rounded flex items-center justify-center',
              config.grayscale && 'grayscale'
            )}
          >
            <Building className="w-6 h-6 text-muted-foreground" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SocialFeedPreview({ config }: { config: Record<string, any> }) {
  return (
    <div className="p-8">
      <h2 className="text-xl font-bold mb-6 text-center">Follow Us on Social</h2>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
            <span className="text-muted-foreground text-xs">Post {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// LAYOUT SECTION PREVIEWS
// ============================================================================

function SpacerPreview({ config }: { config: Record<string, any> }) {
  const height = SPACER_HEIGHTS[config.height as keyof typeof SPACER_HEIGHTS] || SPACER_HEIGHTS.medium;
  
  return (
    <div style={{ height }} className="bg-muted/20 flex items-center justify-center border-y border-dashed border-muted-foreground/30">
      <span className="text-xs text-muted-foreground">Spacer ({config.height || 'medium'})</span>
    </div>
  );
}

function DividerPreview({ config }: { config: Record<string, any> }) {
  const widthClasses = { full: 'w-full', container: 'max-w-4xl mx-auto', narrow: 'max-w-md mx-auto' };
  
  return (
    <div className="py-4 px-8">
      <hr 
        className={cn(widthClasses[config.width as keyof typeof widthClasses] || 'max-w-4xl mx-auto')}
        style={{ 
          borderStyle: config.style || 'solid',
          borderColor: config.color || 'hsl(var(--border))'
        }}
      />
    </div>
  );
}

function CustomHtmlPreview({ config }: { config: Record<string, any> }) {
  return (
    <div className="p-8 bg-muted/30">
      <div className="border border-dashed border-muted-foreground/30 rounded-lg p-4">
        <p className="text-xs text-muted-foreground mb-2">Custom HTML</p>
        <div dangerouslySetInnerHTML={{ __html: config.html || '<p>Custom content</p>' }} />
      </div>
    </div>
  );
}
