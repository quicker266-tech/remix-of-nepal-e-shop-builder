/**
 * ============================================================================
 * THEME EDITOR COMPONENT
 * ============================================================================
 * 
 * Edit store colors, fonts, and layout settings.
 * Changes are applied in real-time to the preview.
 * 
 * ARCHITECTURE:
 * - Colors: HSL values for primary, secondary, accent, background, foreground
 * - Typography: Heading and body font selection from AVAILABLE_FONTS
 * - Layout: Border radius and section padding values
 * 
 * COLOR FORMAT:
 * Colors use HSL format without the hsl() wrapper for CSS variable compatibility
 * Example: "222 47% 31%" (hue saturation% lightness%)
 * 
 * HOW TO EXTEND:
 * - Add new colors: Add to colorFields array and ThemeColors interface
 * - Add new fonts: Add to AVAILABLE_FONTS in constants.ts
 * - Add new layout options: Add fields in Layout section
 * 
 * ============================================================================
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Palette, Type, Layout } from 'lucide-react';
import { StoreTheme, ThemeColors } from '../types';
import { AVAILABLE_FONTS } from '../constants';

/**
 * Props for the ThemeEditor component
 * 
 * @property theme - Current theme configuration
 * @property onUpdate - Callback when theme properties change
 */
interface ThemeEditorProps {
  theme: StoreTheme;
  onUpdate: (updates: Partial<StoreTheme>) => void;
}

export function ThemeEditor({ theme, onUpdate }: ThemeEditorProps) {
  /**
   * Update a single color in the theme
   * Merges with existing colors object
   */
  const updateColor = (key: keyof ThemeColors, value: string) => {
    onUpdate({ colors: { ...theme.colors, [key]: value } });
  };

  /**
   * Color field definitions
   * Maps color keys to human-readable labels
   */
  const colorFields: { key: keyof ThemeColors; label: string }[] = [
    { key: 'primary', label: 'Primary' },
    { key: 'secondary', label: 'Secondary' },
    { key: 'accent', label: 'Accent' },
    { key: 'background', label: 'Background' },
    { key: 'foreground', label: 'Text' },
  ];

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* ============================================================
         * COLORS SECTION
         * HSL color values for theme customization
         * ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Palette className="w-4 h-4" /> Colors
          </div>
          <div className="grid grid-cols-2 gap-3">
            {colorFields.map(({ key, label }) => (
              <div key={key}>
                <Label className="text-xs">{label}</Label>
                <Input
                  value={theme.colors[key]}
                  onChange={(e) => updateColor(key, e.target.value)}
                  placeholder="222 47% 31%"
                  className="text-xs"
                />
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* ============================================================
         * TYPOGRAPHY SECTION
         * Font selection for headings and body text
         * ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Type className="w-4 h-4" /> Typography
          </div>
          <div className="space-y-3">
            {/* Heading font selector */}
            <div>
              <Label className="text-xs">Heading Font</Label>
              <Select
                value={theme.typography.headingFont}
                onValueChange={(v) => onUpdate({ typography: { ...theme.typography, headingFont: v } })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map(f => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Body font selector */}
            <div>
              <Label className="text-xs">Body Font</Label>
              <Select
                value={theme.typography.bodyFont}
                onValueChange={(v) => onUpdate({ typography: { ...theme.typography, bodyFont: v } })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {AVAILABLE_FONTS.map(f => (
                    <SelectItem key={f.name} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <Separator />

        {/* ============================================================
         * LAYOUT SECTION
         * Spacing and border radius settings
         * ============================================================ */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Layout className="w-4 h-4" /> Layout
          </div>
          <div className="space-y-3">
            {/* Border radius for buttons, cards, etc. */}
            <div>
              <Label className="text-xs">Border Radius</Label>
              <Select
                value={theme.layout.borderRadius}
                onValueChange={(v) => onUpdate({ layout: { ...theme.layout, borderRadius: v } })}
              >
                <SelectTrigger><SelectValue placeholder="Select radius" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None (Square)</SelectItem>
                  <SelectItem value="0.25rem">Small</SelectItem>
                  <SelectItem value="0.5rem">Medium</SelectItem>
                  <SelectItem value="0.75rem">Large</SelectItem>
                  <SelectItem value="1rem">Extra Large</SelectItem>
                  <SelectItem value="9999px">Pill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Vertical padding between sections */}
            <div>
              <Label className="text-xs">Section Padding</Label>
              <Select
                value={theme.layout.sectionPadding}
                onValueChange={(v) => onUpdate({ layout: { ...theme.layout, sectionPadding: v } })}
              >
                <SelectTrigger><SelectValue placeholder="Select padding" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1rem">Compact</SelectItem>
                  <SelectItem value="2rem">Normal</SelectItem>
                  <SelectItem value="3rem">Comfortable</SelectItem>
                  <SelectItem value="4rem">Spacious (Default)</SelectItem>
                  <SelectItem value="6rem">Extra Spacious</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
