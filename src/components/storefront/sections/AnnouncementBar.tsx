import { X } from "lucide-react";
import { useState } from "react";

interface AnnouncementBarConfig {
  text?: string;
  link?: string;
  linkText?: string;
  dismissible?: boolean;
  backgroundColor?: string;
  textColor?: string;
}

interface AnnouncementBarProps {
  config: AnnouncementBarConfig;
}

export function AnnouncementBar({ config }: AnnouncementBarProps) {
  const {
    text = "Free shipping on orders over $50!",
    link,
    linkText = "Shop Now",
    dismissible = true,
  } = config;

  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="bg-primary text-primary-foreground py-2 px-4 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <span>{text}</span>
        {link && (
          <a
            href={link}
            className="underline hover:no-underline font-medium"
          >
            {linkText}
          </a>
        )}
      </div>
      {dismissible && (
        <button
          onClick={() => setVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
