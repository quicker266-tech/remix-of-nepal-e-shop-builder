/**
 * ============================================================================
 * POSITION TOGGLE COMPONENT (Module 1C.8f)
 * ============================================================================
 * 
 * Toggle control for section position (above/below built-in content).
 * Only shown for pages that have built-in content.
 * 
 * ============================================================================
 */

import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface PositionToggleProps {
  position: 'above' | 'below';
  onChange: (position: 'above' | 'below') => void;
}

export function PositionToggle({ position, onChange }: PositionToggleProps) {
  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Position relative to content</Label>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={position === 'above' ? 'default' : 'outline'}
          size="sm"
          className={cn('flex-1 gap-2')}
          onClick={() => onChange('above')}
        >
          <ArrowUp className="w-4 h-4" />
          Above
        </Button>
        <Button
          type="button"
          variant={position === 'below' ? 'default' : 'outline'}
          size="sm"
          className={cn('flex-1 gap-2')}
          onClick={() => onChange('below')}
        >
          <ArrowDown className="w-4 h-4" />
          Below
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {position === 'above' 
          ? 'Section appears before the main content'
          : 'Section appears after the main content'
        }
      </p>
    </div>
  );
}
