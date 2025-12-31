import { Button } from "@/components/ui/button";

/**
 * HeroBanner component for storefront
 * 
 * Config keys are now aligned with SectionEditor (flat structure):
 * - buttonText, buttonLink (primary)
 * - secondaryButtonText, secondaryButtonLink (secondary)
 * - backgroundImage, backgroundOverlay
 * - textAlignment, height
 */
interface HeroBannerConfig {
  title?: string;
  subtitle?: string;
  // Flat config keys matching SectionEditor
  buttonText?: string;
  buttonLink?: string;
  secondaryButtonText?: string;
  secondaryButtonLink?: string;
  backgroundImage?: string;
  backgroundOverlay?: number; // 0-100
  textAlignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
  // Legacy support for old config format
  primaryButton?: { text?: string; url?: string };
  secondaryButton?: { text?: string; url?: string };
  overlayOpacity?: number;
  alignment?: string;
}

interface HeroBannerProps {
  config: HeroBannerConfig;
}

export function HeroBanner({ config }: HeroBannerProps) {
  // Support both flat keys (new) and nested keys (legacy)
  const title = config.title || "Welcome to Our Store";
  const subtitle = config.subtitle || "Discover amazing products";
  const backgroundImage = config.backgroundImage;
  const overlayOpacity = (config.backgroundOverlay ?? config.overlayOpacity ?? 50) / 100;
  const height = config.height || "large";
  const alignment = config.textAlignment || config.alignment || "center";
  
  // Button config - prefer flat keys, fallback to nested
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
