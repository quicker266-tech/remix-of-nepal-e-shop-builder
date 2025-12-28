interface TextBlockConfig {
  title?: string;
  content?: string;
  alignment?: string;
  backgroundColor?: string;
}

interface TextBlockProps {
  config: TextBlockConfig;
}

export function TextBlock({ config }: TextBlockProps) {
  const {
    title,
    content = "",
    alignment = "center",
  } = config;

  const alignmentClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  }[alignment] || "text-center";

  return (
    <section className="py-16 px-6 bg-background">
      <div className={`max-w-4xl mx-auto ${alignmentClass}`}>
        {title && (
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {title}
          </h2>
        )}
        {content && (
          <div 
            className="prose prose-lg max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
          />
        )}
      </div>
    </section>
  );
}
