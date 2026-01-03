/**
 * ============================================================================
 * HERO SLIDER COMPONENT
 * ============================================================================
 * 
 * CONFIG FORMAT COMPATIBILITY (Option B Implementation):
 * Slide objects accept both field names for backward compatibility:
 *   - buttonUrl (original) OR buttonLink (SectionEditor)
 * 
 * See: docs/STORE_BUILDER_CONFIG.md for full documentation.
 * ============================================================================
 */

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  title?: string;
  subtitle?: string;
  backgroundImage?: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonLink?: string; // SectionEditor uses this name
}

interface HeroSliderConfig {
  slides?: Slide[];
  autoplay?: boolean;
  interval?: number;
  height?: string;
}

interface HeroSliderProps {
  config: HeroSliderConfig;
}

export function HeroSlider({ config }: HeroSliderProps) {
  const {
    slides = [],
    autoplay = true,
    interval = 5000,
    height = "large",
  } = config;

  const [currentSlide, setCurrentSlide] = useState(0);

  const heightClass = {
    small: "min-h-[300px]",
    medium: "min-h-[450px]",
    large: "min-h-[600px]",
    full: "min-h-screen",
  }[height] || "min-h-[600px]";

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  useEffect(() => {
    if (autoplay && slides.length > 1) {
      const timer = setInterval(nextSlide, interval);
      return () => clearInterval(timer);
    }
  }, [autoplay, interval, slides.length, nextSlide]);

  if (slides.length === 0) {
    return (
      <section className={`${heightClass} bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center`}>
        <p className="text-white text-xl">No slides configured</p>
      </section>
    );
  }

  const slide = slides[currentSlide];

  return (
    <section className={`relative ${heightClass} overflow-hidden`}>
      {/* Current Slide */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          backgroundImage: slide?.backgroundImage ? `url(${slide.backgroundImage})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {slide?.backgroundImage ? (
          <div className="absolute inset-0 bg-black/50" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
          {slide?.title || "Slide Title"}
        </h2>
        {slide?.subtitle && (
          <p className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl">
            {slide.subtitle}
          </p>
        )}
        {slide?.buttonText && (
          <Button
            size="lg"
            className="bg-white text-primary hover:bg-white/90"
            onClick={() => {
              // CONFIG COMPATIBILITY: Support both buttonUrl and buttonLink
              const url = slide.buttonLink || slide.buttonUrl;
              if (url) window.location.href = url;
            }}
          >
            {slide.buttonText}
          </Button>
        )}
      </div>

      {/* Navigation Arrows */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        </>
      )}

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentSlide ? "bg-white" : "bg-white/50"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
