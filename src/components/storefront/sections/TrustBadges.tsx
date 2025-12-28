import { Shield, Truck, RefreshCw, CreditCard, Award, Clock } from "lucide-react";

interface Badge {
  icon?: string;
  title?: string;
  description?: string;
}

interface TrustBadgesConfig {
  title?: string;
  badges?: Badge[];
  columns?: number;
}

interface TrustBadgesProps {
  config: TrustBadgesConfig;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  shield: Shield,
  truck: Truck,
  refresh: RefreshCw,
  credit: CreditCard,
  award: Award,
  clock: Clock,
};

export function TrustBadges({ config }: TrustBadgesProps) {
  const {
    title,
    badges = [],
    columns = 4,
  } = config;

  const defaultBadges: Badge[] = [
    { icon: "truck", title: "Free Shipping", description: "On orders over $50" },
    { icon: "shield", title: "Secure Payment", description: "100% protected" },
    { icon: "refresh", title: "Easy Returns", description: "30-day returns" },
    { icon: "clock", title: "24/7 Support", description: "Always here to help" },
  ];

  const displayBadges = badges.length > 0 ? badges : defaultBadges;

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 md:grid-cols-3",
    4: "grid-cols-2 md:grid-cols-4",
    6: "grid-cols-2 md:grid-cols-3 lg:grid-cols-6",
  }[columns] || "grid-cols-2 md:grid-cols-4";

  return (
    <section className="py-12 px-6 bg-muted/30 border-y">
      <div className="max-w-7xl mx-auto">
        {title && (
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">
            {title}
          </h2>
        )}
        
        <div className={`grid ${gridCols} gap-8`}>
          {displayBadges.map((badge, index) => {
            const IconComponent = iconMap[badge.icon || "shield"] || Shield;
            
            return (
              <div key={index} className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <IconComponent className="w-7 h-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {badge.title || "Trust Badge"}
                </h3>
                {badge.description && (
                  <p className="text-sm text-muted-foreground">
                    {badge.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
