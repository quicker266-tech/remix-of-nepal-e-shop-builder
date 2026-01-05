/**
 * ============================================================================
 * SECTION PALETTE COMPONENT
 * ============================================================================
 * 
 * Displays available section types that can be added to the page.
 * Organized by category with icons and descriptions.
 * 
 * ARCHITECTURE:
 * - Categories are collapsible for better organization
 * - Each section type is defined in SECTION_DEFINITIONS (constants.ts)
 * - Icons are mapped from Lucide React icons
 * - Header/footer sections are excluded (managed separately)
 * - Sections are filtered based on page type permissions
 * 
 * HOW TO EXTEND (Adding a new section type):
 * 1. Add the section type to SectionType enum in types.ts
 * 2. Add the section definition in SECTION_DEFINITIONS (constants.ts)
 * 3. If using a new icon, add it to iconMap below
 * 4. Add the field renderer in SectionEditor.tsx
 * 5. Add the preview renderer in PreviewFrame.tsx
 * 
 * ============================================================================
 */

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Image,
  Layers,
  Video,
  Star,
  Grid3X3,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  ImagePlus,
  Type,
  Columns,
  Images,
  Quote,
  HelpCircle,
  Megaphone,
  Mail,
  Clock,
  BadgePercent,
  ShieldCheck,
  Building,
  Code,
  ArrowUpDown,
  Minus,
  ChevronDown,
  Plus,
  Package,
  FolderTree,
  Layout,
  Info,
} from 'lucide-react';
import { SECTION_DEFINITIONS, SECTION_CATEGORIES } from '../constants';
import { SectionType, StorePage } from '../types';
import { 
  getAllowedSectionTypes, 
  canPageHaveSections, 
  getPagePermissionInfo 
} from '../utils/sectionPermissions';

/**
 * Icon mapping from string names to Lucide React components
 * 
 * HOW TO ADD NEW ICONS:
 * 1. Import the icon from lucide-react at the top of this file
 * 2. Add mapping below: 'IconName': IconComponent
 * 
 * Note: Icon names come from SECTION_DEFINITIONS in constants.ts
 */
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Image,
  Layers,
  Video,
  Star,
  Grid3x3: Grid3X3,
  ChevronLeftRight: Columns,
  Sparkles,
  TrendingUp,
  LayoutGrid,
  ImagePlus,
  Type,
  Columns,
  Images,
  Quote,
  HelpCircle,
  Megaphone,
  Mail,
  Clock,
  BadgePercent,
  Instagram: Image,
  ShieldCheck,
  Building,
  Code,
  ArrowUpDown,
  Minus,
  LayoutTop: Layout,
  LayoutBottom: Layout,
  Package,
  FolderTree,
  Layout,
};

/**
 * Props for the SectionPalette component
 * 
 * @property activePage - Current page to filter sections for
 * @property onAddSection - Callback when a section type is selected for addition
 */
interface SectionPaletteProps {
  activePage: StorePage | null;
  onAddSection: (type: SectionType) => void;
}

export function SectionPalette({ activePage, onAddSection }: SectionPaletteProps) {
  // Track which categories are expanded (hero and products open by default)
  const [openCategories, setOpenCategories] = useState<string[]>(['hero', 'products', 'content']);

  // Get allowed section types for current page
  const allowedSectionTypes = useMemo(() => {
    if (!activePage) {
      // Fallback: show all sections when no page selected
      return Object.keys(SECTION_DEFINITIONS).filter(
        type => type !== 'header' && type !== 'footer'
      ) as SectionType[];
    }
    
    const allowed = getAllowedSectionTypes(activePage.page_type);
    console.log(`[1C.3] Filtering sections for page type: ${activePage.page_type}, allowed: ${allowed.length}`);
    return allowed;
  }, [activePage]);

  // Check if page can have any sections
  const pageCanHaveSections = useMemo(() => {
    if (!activePage) return true;
    return canPageHaveSections(activePage.page_type);
  }, [activePage]);

  // Get permission info for display
  const permissionInfo = useMemo(() => {
    if (!activePage) return null;
    return getPagePermissionInfo(activePage.page_type);
  }, [activePage]);

  /**
   * Toggle a category's expanded/collapsed state
   */
  const toggleCategory = (categoryId: string) => {
    setOpenCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  /**
   * Get the icon component for a category
   * Used for category header display
   */
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'hero': return Image;
      case 'products': return Package;
      case 'categories': return FolderTree;
      case 'content': return Type;
      case 'marketing': return Megaphone;
      case 'layout': return Layout;
      default: return Layout;
    }
  };

  /**
   * Group sections by their category for organized display
   * Only includes allowed sections for current page type
   */
  const sectionsByCategory = useMemo(() => {
    return Object.entries(SECTION_DEFINITIONS).reduce((acc, [type, def]) => {
      // Skip header and footer (managed separately)
      if (type === 'header' || type === 'footer') return acc;
      
      // Only include if section type is allowed for this page
      if (!allowedSectionTypes.includes(type as SectionType)) return acc;
      
      if (!acc[def.category]) acc[def.category] = [];
      acc[def.category].push({ type: type as SectionType, ...def });
      
      return acc;
    }, {} as Record<string, Array<{ type: SectionType; label: string; icon: string; description: string }>>);
  }, [allowedSectionTypes]);

  // Show message if page cannot have sections (functional pages like cart, checkout)
  if (!pageCanHaveSections && activePage) {
    return (
      <div className="p-3">
        <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Section
        </h3>
        
        <Alert className="border-muted bg-muted/50">
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">No Custom Sections</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            {permissionInfo?.description || 'This page type does not support custom sections.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-3">
      {/* Section header */}
      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <Plus className="w-4 h-4" />
        Add Section
        {activePage && allowedSectionTypes.length < 20 && (
          <span className="text-xs text-muted-foreground font-normal">
            ({allowedSectionTypes.length} available)
          </span>
        )}
      </h3>
      
      {/* Scrollable list of categories and sections */}
      <ScrollArea className="h-64">
        <div className="space-y-1">
          {/* Render each category as a collapsible group */}
          {SECTION_CATEGORIES.map(category => {
            const sections = sectionsByCategory[category.id] || [];
            if (sections.length === 0) return null;
            
            const CategoryIcon = getCategoryIcon(category.id);
            const isOpen = openCategories.includes(category.id);

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
              >
                {/* Category header - click to expand/collapse */}
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between h-9 px-2"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <CategoryIcon className="w-4 h-4 text-muted-foreground" />
                      {category.label}
                      <span className="text-xs text-muted-foreground">
                        ({sections.length})
                      </span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-muted-foreground transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                
                {/* Category contents - list of section types */}
                <CollapsibleContent className="pl-4 space-y-1 mt-1">
                  {sections.map(section => {
                    // Get icon from mapping, fallback to Layout
                    const Icon = iconMap[section.icon] || Layout;
                    return (
                      <Button
                        key={section.type}
                        variant="ghost"
                        className="w-full justify-start h-8 px-2 text-sm"
                        onClick={() => onAddSection(section.type)}
                      >
                        <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                        {section.label}
                      </Button>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
