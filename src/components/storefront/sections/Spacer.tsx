interface SpacerConfig {
  height?: string;
}

interface SpacerProps {
  config: SpacerConfig;
}

export function Spacer({ config }: SpacerProps) {
  const { height = "medium" } = config;

  const heightClass = {
    small: "h-8",
    medium: "h-16",
    large: "h-24",
    xlarge: "h-32",
  }[height] || "h-16";

  return <div className={heightClass} />;
}
