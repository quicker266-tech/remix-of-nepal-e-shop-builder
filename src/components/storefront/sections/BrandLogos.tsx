interface BrandLogosConfig {
  title?: string;
  logos?: string[];
}

interface BrandLogosProps {
  config: BrandLogosConfig;
}

export function BrandLogos({ config }: BrandLogosProps) {
  const { title, logos = [] } = config;

  if (logos.length === 0) {
    return (
      <section className="py-12 px-6 bg-muted/30 border-y">
        <div className="max-w-7xl mx-auto text-center">
          {title && <h2 className="text-xl font-semibold text-foreground mb-4">{title}</h2>}
          <p className="text-muted-foreground">No brand logos added</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-muted/30 border-y">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className="text-xl font-semibold text-foreground text-center mb-8">
            {title}
          </h2>
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.map((logo, index) => (
            <img
              key={index}
              src={logo}
              alt={`Brand ${index + 1}`}
              className="h-12 md:h-16 object-contain opacity-60 hover:opacity-100 transition-opacity grayscale hover:grayscale-0"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
