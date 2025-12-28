import { useEffect, useState } from "react";

interface CountdownConfig {
  title?: string;
  subtitle?: string;
  endDate?: string;
  expiredMessage?: string;
}

interface CountdownProps {
  config: CountdownConfig;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function Countdown({ config }: CountdownProps) {
  const {
    title = "Sale Ends In",
    subtitle,
    endDate,
    expiredMessage = "Sale has ended!",
  } = config;

  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (!endDate) return;

    const calculateTimeLeft = () => {
      const difference = new Date(endDate).getTime() - new Date().getTime();

      if (difference <= 0) {
        setExpired(true);
        return null;
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  if (!endDate) {
    return (
      <section className="py-12 px-6 bg-primary">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-primary-foreground">{title}</h2>
          <p className="text-primary-foreground/80 mt-2">Set an end date to start the countdown</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 px-6 bg-primary">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
          {title}
        </h2>
        {subtitle && (
          <p className="text-primary-foreground/80 mb-6">{subtitle}</p>
        )}

        {expired ? (
          <p className="text-xl text-primary-foreground">{expiredMessage}</p>
        ) : timeLeft ? (
          <div className="flex justify-center gap-4 md:gap-8">
            {[
              { label: "Days", value: timeLeft.days },
              { label: "Hours", value: timeLeft.hours },
              { label: "Minutes", value: timeLeft.minutes },
              { label: "Seconds", value: timeLeft.seconds },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="bg-white/10 rounded-lg p-4 min-w-[70px]">
                  <span className="text-3xl md:text-4xl font-bold text-primary-foreground">
                    {String(item.value).padStart(2, "0")}
                  </span>
                </div>
                <span className="text-xs text-primary-foreground/80 mt-2 block">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
