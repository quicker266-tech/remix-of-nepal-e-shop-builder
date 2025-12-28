import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FAQItem {
  question?: string;
  answer?: string;
}

interface FAQConfig {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
}

interface FAQProps {
  config: FAQConfig;
}

export function FAQ({ config }: FAQProps) {
  const {
    title = "Frequently Asked Questions",
    subtitle,
    items = [],
  } = config;

  if (items.length === 0) {
    return (
      <section className="py-16 px-6 bg-background">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">{title}</h2>
          <p className="text-muted-foreground">No FAQs added yet</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 px-6 bg-background">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          {items.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger className="text-left text-foreground hover:text-primary">
                {item.question || `Question ${index + 1}`}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                {item.answer || "Answer coming soon..."}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
