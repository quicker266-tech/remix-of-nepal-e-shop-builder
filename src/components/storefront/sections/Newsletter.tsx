import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface NewsletterConfig {
  title?: string;
  subtitle?: string;
  buttonText?: string;
  backgroundColor?: string;
  textColor?: string;
}

interface NewsletterProps {
  config: NewsletterConfig;
}

export function Newsletter({ config }: NewsletterProps) {
  const {
    title = "Subscribe to Our Newsletter",
    subtitle = "Get the latest updates and exclusive offers delivered to your inbox.",
    buttonText = "Subscribe",
  } = config;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast.success("Thank you for subscribing!");
    setEmail("");
    setLoading(false);
  };

  return (
    <section className="py-16 px-6 bg-primary">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
          {title}
        </h2>
        {subtitle && (
          <p className="text-lg text-primary-foreground/80 mb-8">
            {subtitle}
          </p>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-white/10 border-white/20 text-primary-foreground placeholder:text-primary-foreground/60"
            required
          />
          <Button
            type="submit"
            disabled={loading}
            className="bg-white text-primary hover:bg-white/90"
          >
            {loading ? "..." : buttonText}
          </Button>
        </form>
      </div>
    </section>
  );
}
