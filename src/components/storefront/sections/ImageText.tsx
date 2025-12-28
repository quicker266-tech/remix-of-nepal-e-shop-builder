import { Button } from "@/components/ui/button";

interface ImageTextConfig {
  title?: string;
  content?: string;
  imageUrl?: string;
  imagePosition?: string;
  buttonText?: string;
  buttonUrl?: string;
}

interface ImageTextProps {
  config: ImageTextConfig;
}

export function ImageText({ config }: ImageTextProps) {
  const {
    title = "About Us",
    content = "Share your story with your customers.",
    imageUrl,
    imagePosition = "left",
    buttonText,
    buttonUrl,
  } = config;

  const isImageLeft = imagePosition === "left";

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className={`grid md:grid-cols-2 gap-12 items-center ${!isImageLeft ? "md:flex-row-reverse" : ""}`}>
          {/* Image */}
          <div className={`${!isImageLeft ? "md:order-2" : ""}`}>
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={title}
                className="w-full h-auto rounded-lg shadow-lg"
              />
            ) : (
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">Add an image</span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className={`${!isImageLeft ? "md:order-1" : ""}`}>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {title}
            </h2>
            <p className="text-lg text-muted-foreground mb-6 whitespace-pre-wrap">
              {content}
            </p>
            {buttonText && (
              <Button
                onClick={() => buttonUrl && (window.location.href = buttonUrl)}
              >
                {buttonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
