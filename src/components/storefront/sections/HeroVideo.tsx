/**
 * ============================================================================
 * HERO VIDEO COMPONENT
 * ============================================================================
 * 
 * CONFIG FORMAT COMPATIBILITY (Option B Implementation):
 * This component accepts both field names for backward compatibility:
 *   - buttonUrl (original) OR buttonLink (SectionEditor)
 * 
 * See: docs/STORE_BUILDER_CONFIG.md for full documentation.
 * ============================================================================
 */

import { Button } from "@/components/ui/button";

interface HeroVideoConfig {
  videoUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonLink?: string; // SectionEditor uses this name
  overlayOpacity?: number;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
}

interface HeroVideoProps {
  config: HeroVideoConfig;
}

export function HeroVideo({ config }: HeroVideoProps) {
  const {
    videoUrl,
    title = "Welcome",
    subtitle,
    buttonText,
    overlayOpacity = 0.5,
    autoplay = true,
    loop = true,
    muted = true,
  } = config;

  // CONFIG COMPATIBILITY: Support both buttonUrl and buttonLink
  const buttonUrl = config.buttonLink || config.buttonUrl;

  return (
    <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      {videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={videoUrl}
          autoPlay={autoplay}
          loop={loop}
          muted={muted}
          playsInline
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      )}
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black"
        style={{ opacity: overlayOpacity }}
      />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
          {title}
        </h1>
        {subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-8">
            {subtitle}
          </p>
        )}
        {buttonText && (
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => buttonUrl && (window.location.href = buttonUrl)}
          >
            {buttonText}
          </Button>
        )}
      </div>
    </section>
  );
}
