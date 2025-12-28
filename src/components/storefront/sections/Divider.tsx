interface DividerConfig {
  style?: string;
  width?: string;
}

interface DividerProps {
  config: DividerConfig;
}

export function Divider({ config }: DividerProps) {
  const { style = "solid", width = "full" } = config;

  const widthClass = {
    full: "w-full",
    medium: "w-2/3 mx-auto",
    short: "w-1/3 mx-auto",
  }[width] || "w-full";

  const styleClass = {
    solid: "border-solid",
    dashed: "border-dashed",
    dotted: "border-dotted",
  }[style] || "border-solid";

  return (
    <div className="py-4 px-6">
      <hr className={`${widthClass} ${styleClass} border-t border-border`} />
    </div>
  );
}
