/**
 * ============================================================================
 * HERO BANNER COMPONENT
 * ============================================================================
 * 
 * CONFIG FORMAT COMPATIBILITY (Option B Implementation):
 * This component accepts BOTH config formats for backward compatibility:
 * 
 * Format A (SectionEditor saves this - flat structure):
 *   { buttonText: "Shop Now", buttonLink: "/products", secondaryButtonText: "...", secondaryButtonLink: "..." }
 * 
 * Format B (Original storefront format - nested structure):
 *   { primaryButton: { text: "Shop Now", url: "/products" }, secondaryButton: { text: "...", url: "..." } }
 * 
 * FUTURE MIGRATION (Option A):
 * To migrate to a single format, update SectionEditor.tsx HeroBannerFields to save
 * in nested format, then run a database migration to convert existing configs.
 * See: docs/STORE_BUILDER_CONFIG.md for full migration guide.
 * 
 * ============================================================================
 */

import { Button } from "@/components/ui/button";

interface HeroBannerConfig {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  backgroundOverlay?: number; // SectionEditor uses this name
  height?: string;
  alignment?: string;
  textAlignment?: string; // SectionEditor uses this name
  // Format B (nested)
  primaryButton?: { text?: string; url?: string };
  secondaryButton?: { text?: string; url?: string };
  // Format A (flat - from SectionEditor)
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
}

interface HeroBannerProps {
  config: HeroBannerConfig;
}

export function HeroBanner({ config }: HeroBannerProps) {
  const {
    title = "Welcome to Our Store",
    subtitle = "Discover amazing products",
    backgroundImage,
    height = "large",
  } = config;

  // CONFIG COMPATIBILITY: Support both flat (SectionEditor) and nested (original) formats
  const overlayOpacity = config.backgroundOverlay !== undefined 
    ? config.backgroundOverlay / 100 
    : config.overlayOpacity ?? 0.5;
  
  const alignment = config.textAlignment || config.alignment || "center";
  
  // Button config: prefer flat format (from SectionEditor), fallback to nested
  const primaryButtonText = config.buttonText || config.primaryButton?.text;
  const primaryButtonUrl = config.buttonLink || config.primaryButton?.url;
  const secondaryButtonText = config.secondaryButtonText || config.secondaryButton?.text;
  const secondaryButtonUrl = config.secondaryButtonLink || config.secondaryButton?.url;

  const heightClass = {
    small: "min-h-[300px]",
    medium: "min-h-[450px]",
    large: "min-h-[600px]",
    full: "min-h-screen",
  }[height] || "min-h-[600px]";

  const alignmentClass = {
    left: "items-start text-left",
    center: "items-center text-center",
    right: "items-end text-right",
  }[alignment] || "items-center text-center";

  return (
    <section
      className={`relative ${heightClass} flex flex-col justify-center px-6 py-16`}
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {backgroundImage && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      {!backgroundImage && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      )}
      
      <div className={`relative z-10 max-w-4xl mx-auto flex flex-col ${alignmentClass}`}>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
            {subtitle}
          </p>
        )}
        
        <div className="flex flex-wrap gap-4 justify-center">
          {primaryButtonText && (
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => primaryButtonUrl && (window.location.href = primaryButtonUrl)}
            >
              {primaryButtonText}
            </Button>
          )}
          {secondaryButtonText && (
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => secondaryButtonUrl && (window.location.href = secondaryButtonUrl)}
            >
              {secondaryButtonText}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}