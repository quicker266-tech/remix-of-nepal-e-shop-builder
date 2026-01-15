import { cn } from '@/lib/utils';

interface BeeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
  xl: 'w-24 h-24',
};

const textSizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-4xl',
};

export default function BeeLogo({ size = 'md', showText = false, className }: BeeLogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'relative flex items-center justify-center',
        sizeClasses[size]
      )}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Wings - Hexagonal shape */}
          <path
            d="M25 35 L15 50 L25 65 L40 65 L40 35 Z"
            className="fill-primary/30"
          />
          <path
            d="M75 35 L85 50 L75 65 L60 65 L60 35 Z"
            className="fill-primary/30"
          />
          
          {/* Body - Main oval */}
          <ellipse
            cx="50"
            cy="55"
            rx="22"
            ry="28"
            className="fill-amber-400"
          />
          
          {/* Stripes */}
          <ellipse
            cx="50"
            cy="45"
            rx="18"
            ry="6"
            className="fill-amber-900/80"
          />
          <ellipse
            cx="50"
            cy="60"
            rx="20"
            ry="6"
            className="fill-amber-900/80"
          />
          <ellipse
            cx="50"
            cy="75"
            rx="16"
            ry="5"
            className="fill-amber-900/80"
          />
          
          {/* Head */}
          <circle
            cx="50"
            cy="25"
            r="14"
            className="fill-amber-500"
          />
          
          {/* Eyes */}
          <circle cx="44" cy="23" r="4" className="fill-white" />
          <circle cx="56" cy="23" r="4" className="fill-white" />
          <circle cx="45" cy="24" r="2" className="fill-amber-900" />
          <circle cx="57" cy="24" r="2" className="fill-amber-900" />
          
          {/* Antennae */}
          <path
            d="M42 14 Q38 5 35 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-amber-700"
            fill="none"
          />
          <path
            d="M58 14 Q62 5 65 8"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-amber-700"
            fill="none"
          />
          <circle cx="35" cy="8" r="3" className="fill-primary" />
          <circle cx="65" cy="8" r="3" className="fill-primary" />
          
          {/* Smile */}
          <path
            d="M44 30 Q50 35 56 30"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-amber-800"
            fill="none"
          />
        </svg>
      </div>
      
      {showText && (
        <span className={cn(
          'font-bold text-foreground',
          textSizeClasses[size]
        )}>
          ExtendBee
        </span>
      )}
    </div>
  );
}
