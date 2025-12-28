interface GalleryConfig {
  title?: string;
  subtitle?: string;
  images?: string[];
  columns?: number;
}

interface GalleryProps {
  config: GalleryConfig;
}

export function Gallery({ config }: GalleryProps) {
  const {
    title,
    subtitle,
    images = [],
    columns = 4,
  } = config;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    5: "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  }[columns] || "grid-cols-2 md:grid-cols-4";

  if (images.length === 0) {
    return (
      <section className="py-16 px-6 bg-background">
        <div className="max-w-7xl mx-auto text-center">
          {title && <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>}
          <p className="text-muted-foreground">No images added yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {(title || subtitle) && (
          <div className="text-center mb-12">
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {subtitle}
              </p>
            )}
          </div>
        )}

        <div className={`grid ${gridCols} gap-4`}>
          {images.map((image, index) => (
            <div
              key={index}
              className="aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
            >
              <img
                src={image}
                alt={`Gallery image ${index + 1}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
