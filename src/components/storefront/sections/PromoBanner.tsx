import { Button } from "@/components/ui/button";

interface PromoBannerConfig {
  title?: string;
  subtitle?: string;
  badge?: string;
  buttonText?: string;
  buttonUrl?: string;
  backgroundImage?: string;
}

interface PromoBannerProps {
  config: PromoBannerConfig;
}

export function PromoBanner({ config }: PromoBannerProps) {
  const {
    title = "Special Offer",
    subtitle = "Limited time only",
    badge,
    buttonText = "Shop Now",
    buttonUrl,
    backgroundImage,
  } = config;

  return (
    <section
      className="relative py-16 px-6 overflow-hidden"
      style={{
        backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {backgroundImage ? (
        <div className="absolute inset-0 bg-black/60" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
      )}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {badge && (
          <span className="inline-block bg-white/20 text-white text-sm font-medium px-4 py-1 rounded-full mb-4">
            {badge}
          </span>
        )}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
          {title}
        </h2>
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
