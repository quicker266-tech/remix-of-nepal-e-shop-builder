import { Button } from "@/components/ui/button";

interface HeroBannerConfig {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  overlayOpacity?: number;
  height?: string;
  alignment?: string;
  primaryButton?: { text?: string; url?: string };
  secondaryButton?: { text?: string; url?: string };
}

interface HeroBannerProps {
  config: HeroBannerConfig;
}

export function HeroBanner({ config }: HeroBannerProps) {
  const {
    title = "Welcome to Our Store",
    subtitle = "Discover amazing products",
    backgroundImage,
    overlayOpacity = 0.5,
    height = "large",
    alignment = "center",
    primaryButton,
    secondaryButton,
  } = config;

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
          {primaryButton?.text && (
            <Button
              size="lg"
              className="bg-white text-primary hover:bg-white/90"
              onClick={() => primaryButton.url && (window.location.href = primaryButton.url)}
            >
              {primaryButton.text}
            </Button>
          )}
          {secondaryButton?.text && (
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10"
              onClick={() => secondaryButton.url && (window.location.href = secondaryButton.url)}
            >
              {secondaryButton.text}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
