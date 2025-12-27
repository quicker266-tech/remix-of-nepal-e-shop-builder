/**
 * ============================================================================
 * PREVIEW FRAME COMPONENT
 * ============================================================================
 * 
 * Live preview of the storefront with responsive modes.
 * Renders sections based on their configuration.
 * 
 * ARCHITECTURE:
 * - Container adjusts width based on preview mode (desktop/tablet/mobile)
 * - Zoom is applied via CSS transform
 * - Sections are rendered in order, filtered by visibility
 * - Clicking a section selects it for editing
 * 
 * RESPONSIVE PREVIEW WIDTHS:
 * - desktop: 100% (full width)
 * - tablet: 768px (iPad width)
 * - mobile: 375px (iPhone width)
 * 
 * HOW TO ADD A NEW SECTION PREVIEW:
 * 1. Add case to the switch statement in SectionPreview
 * 2. Extract config properties as needed
 * 3. Render appropriate preview UI
 * 4. Consider both with-content and placeholder states
 * 
 * ============================================================================
 */

import { PageSection, StoreTheme } from '../types';
import { cn } from '@/lib/utils';

/**
 * Props for the PreviewFrame component
 * 
 * @property store - Basic store info for header display
 * @property theme - Theme configuration (colors, fonts, layout) - currently not fully applied
 * @property sections - Array of sections to render
 * @property previewMode - Current preview mode affecting width
 * @property zoom - Zoom percentage (50-150)
 * @property selectedSectionId - ID of currently selected section for highlight
 * @property onSelectSection - Callback when section is clicked
 */
interface PreviewFrameProps {
  store: { id: string; name: string; slug: string; logo_url?: string | null };
  theme: StoreTheme | null;
  sections: PageSection[];
  previewMode: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
}

/**
 * Preview container widths for each mode
 * Simulates common device widths
 */
const previewWidths = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
};

export function PreviewFrame({
  store,
  sections,
  previewMode,
  zoom,
  selectedSectionId,
  onSelectSection,
}: PreviewFrameProps) {
  return (
    <div className="flex-1 overflow-auto p-4 flex justify-center">
      {/* Preview container - width and zoom controlled by props */}
      <div
        className="bg-background rounded-lg shadow-lg overflow-hidden transition-all"
        style={{
          width: previewWidths[previewMode],
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'top center',
        }}
      >
        {/* ============================================================
         * PREVIEW HEADER: Store logo/name
         * Simulates the actual store header
         * ============================================================ */}
        <div className="bg-card border-b p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold">
            {store.name.charAt(0)}
          </div>
          <span className="font-semibold">{store.name}</span>
        </div>

        {/* ============================================================
         * SECTIONS: Rendered in order, only visible ones
         * ============================================================ */}
        <div className="min-h-[60vh]">
          {sections.length === 0 ? (
            // Empty state
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              Add sections to see your store preview
            </div>
          ) : (
            // Render visible sections
            sections.filter(s => s.is_visible).map((section) => (
              <div
                key={section.id}
                onClick={() => onSelectSection(section.id)}
                className={cn(
                  'border-2 border-transparent cursor-pointer transition-colors',
                  // Highlight selected section
                  selectedSectionId === section.id && 'border-primary bg-primary/5'
                )}
              >
                <SectionPreview section={section} />
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

/**
 * Renders a preview for a single section based on its type
 * 
 * Each section type should have its own case in the switch statement.
 * The preview should closely resemble the actual storefront rendering.
 * 
 * @param section - The section to render
 */
function SectionPreview({ section }: { section: PageSection }) {
  // Cast config to access properties
  const config = section.config as Record<string, any>;

  switch (section.section_type) {
    // ============================================================
    // HERO BANNER: Full-width banner with title, subtitle, CTA
    // ============================================================
    case 'hero_banner':
      return (
        <div
          className="relative min-h-[40vh] flex items-center justify-center p-8"
          style={{
            backgroundImage: config.backgroundImage ? `url(${config.backgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Background overlay */}
          {config.backgroundImage && (
            <div className="absolute inset-0 bg-black" style={{ opacity: (config.backgroundOverlay || 0) / 100 }} />
          )}
          
          {/* Content */}
          <div className={cn('relative z-10 text-center', !config.backgroundImage && 'bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl p-12')}>
            <h1 className="text-3xl font-bold mb-2">{config.title || 'Hero Title'}</h1>
            {config.subtitle && <p className="text-muted-foreground mb-4">{config.subtitle}</p>}
            {config.buttonText && (
              <button className="bg-primary text-primary-foreground px-6 py-2 rounded-lg">
                {config.buttonText}
              </button>
            )}
          </div>
        </div>
      );

    // ============================================================
    // PRODUCT GRIDS: Featured, New Arrivals, Best Sellers
    // All share the same preview layout
    // ============================================================
    case 'featured_products':
    case 'new_arrivals':
    case 'best_sellers':
      return (
        <div className="p-8">
          <h2 className="text-2xl font-bold mb-4 text-center">{config.title || section.name}</h2>
          {/* Product grid placeholder */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${config.columns || 4}, 1fr)` }}>
            {Array.from({ length: config.productCount || 4 }).map((_, i) => (
              <div key={i} className="bg-muted rounded-lg aspect-square flex items-center justify-center text-muted-foreground">
                Product {i + 1}
              </div>
            ))}
          </div>
        </div>
      );

    // ============================================================
    // TEXT BLOCK: Rich text content area
    // ============================================================
    case 'text_block':
      return (
        <div className="p-8" style={{ textAlign: config.alignment || 'left' }}>
          {/* Render HTML content (sanitization should be done server-side) */}
          <div dangerouslySetInnerHTML={{ __html: config.content || '<p>Text content here...</p>' }} />
        </div>
      );

    // ============================================================
    // DEFAULT: Fallback for unsupported section types
    // Shows section name and type for identification
    // ============================================================
    default:
      return (
        <div className="p-8 bg-muted/30 text-center text-muted-foreground">
          {section.name} ({section.section_type})
        </div>
      );
  }
}
