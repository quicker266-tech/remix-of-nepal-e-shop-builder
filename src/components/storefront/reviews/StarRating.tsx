/**
 * ============================================================================
 * STAR RATING COMPONENT
 * ============================================================================
 *
 * Reusable star rating component for displaying and inputting ratings.
 *
 * USAGE:
 * - Display mode: <StarRating rating={4.5} />
 * - Interactive mode: <StarRating rating={value} interactive onChange={setValue} />
 *
 * ============================================================================
 */

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
  className?: string;
}

const sizeClasses = {
  sm: 'w-3 h-3',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
};

export function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
  className,
}: StarRatingProps) {
  const handleClick = (index: number) => {
    if (interactive && onChange) {
      onChange(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (interactive && onChange && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onChange(index + 1);
    }
  };

  return (
    <div className={cn('flex items-center gap-0.5', className)}>
      {Array.from({ length: max }, (_, index) => {
        const filled = index < Math.floor(rating);
        const halfFilled = !filled && index < rating && index >= rating - 1;

        return (
          <button
            key={index}
            type="button"
            onClick={() => handleClick(index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={!interactive}
            className={cn(
              'relative focus:outline-none transition-colors',
              interactive && 'cursor-pointer hover:scale-110',
              !interactive && 'cursor-default'
            )}
            aria-label={`${index + 1} star${index === 0 ? '' : 's'}`}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                'text-muted-foreground/30'
              )}
            />
            {/* Filled star overlay */}
            {(filled || halfFilled) && (
              <Star
                className={cn(
                  sizeClasses[size],
                  'absolute top-0 left-0 text-yellow-500 fill-yellow-500',
                  halfFilled && 'clip-half'
                )}
                style={halfFilled ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Display average rating with count
 */
interface RatingDisplayProps {
  rating: number;
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
}

export function RatingDisplay({
  rating,
  count,
  size = 'md',
  showCount = true,
}: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <StarRating rating={rating} size={size} />
      <span className="text-sm text-muted-foreground">
        {rating.toFixed(1)}
        {showCount && ` (${count} review${count === 1 ? '' : 's'})`}
      </span>
    </div>
  );
}
