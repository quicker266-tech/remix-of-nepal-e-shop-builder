/**
 * ============================================================================
 * SECTION LIST COMPONENT
 * ============================================================================
 * 
 * Displays the current sections on the page.
 * Supports drag-and-drop reordering, visibility toggle, and section actions.
 * 
 * ARCHITECTURE:
 * - Uses native HTML5 drag-and-drop API for reordering
 * - Each section can be selected, hidden, duplicated, or deleted
 * - Actions are in a dropdown menu to save space
 * - Visual feedback for selected and hidden sections
 * 
 * DRAG AND DROP FLOW:
 * 1. User drags a section (handleDragStart)
 * 2. Drags over another section (handleDragOver) - reorders in real-time
 * 3. Drops the section (handleDragEnd) - cleanup
 * 4. Parent component persists the new order to database
 * 
 * HOW TO EXTEND:
 * - Add new actions: Add items to the DropdownMenuContent
 * - Change drag behavior: Modify handleDragOver logic
 * - Add keyboard reordering: Already supported via move up/down buttons
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  GripVertical,
  Eye,
  EyeOff,
  MoreHorizontal,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { PageSection } from '../types';
import { SECTION_DEFINITIONS } from '../constants';
import { cn } from '@/lib/utils';

/**
 * Props for the SectionList component
 * 
 * @property sections - Array of page sections to display
 * @property selectedSectionId - ID of currently selected section (null if none)
 * @property onSelectSection - Callback when section is clicked
 * @property onReorder - Callback with reordered sections array
 * @property onDelete - Callback when delete action is triggered
 * @property onDuplicate - Callback when duplicate action is triggered
 * @property onToggleVisibility - Callback when visibility toggle is clicked
 */
interface SectionListProps {
  sections: PageSection[];
  selectedSectionId: string | null;
  onSelectSection: (id: string | null) => void;
  onReorder: (sections: PageSection[]) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

export function SectionList({
  sections,
  selectedSectionId,
  onSelectSection,
  onReorder,
  onDelete,
  onDuplicate,
  onToggleVisibility,
}: SectionListProps) {
  // Track which section is being dragged (by index)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  /**
   * Called when user starts dragging a section
   * Stores the index of the dragged section
   */
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  /**
   * Called when dragging over another section
   * Performs real-time reordering for visual feedback
   */
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    // Reorder sections array
    const newSections = [...sections];
    const [draggedSection] = newSections.splice(draggedIndex, 1);
    newSections.splice(index, 0, draggedSection);
    
    // Update dragged index to new position
    setDraggedIndex(index);
    // Notify parent of new order
    onReorder(newSections);
  };

  /**
   * Called when drag operation ends
   * Cleans up drag state
   */
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  /**
   * Move a section up or down using buttons (keyboard-accessible alternative to drag)
   */
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;

    const newSections = [...sections];
    // Swap adjacent sections
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    onReorder(newSections);
  };

  // Empty state when no sections exist
  if (sections.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No sections yet. Add sections from the palette above.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="p-3 space-y-1">
        {/* Section count header */}
        <h3 className="text-sm font-medium text-foreground mb-3">
          Page Sections ({sections.length})
        </h3>
        
        {/* Render each section as a draggable item */}
        {sections.map((section, index) => {
          // Get section definition for display label
          const definition = SECTION_DEFINITIONS[section.section_type];
          
          return (
            <div
              key={section.id}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => onSelectSection(section.id)}
              className={cn(
                'flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors',
                'border border-transparent hover:border-border',
                // Highlight selected section
                selectedSectionId === section.id
                  ? 'bg-primary/10 border-primary/30'
                  : 'hover:bg-muted/50',
                // Dim hidden sections
                !section.is_visible && 'opacity-50'
              )}
            >
              {/* Drag handle - grab icon */}
              <div
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Section name and type */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {section.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {definition?.label || section.section_type}
                </p>
              </div>

              {/* Action buttons - visibility toggle and dropdown menu */}
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {/* Visibility toggle button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => onToggleVisibility(section.id)}
                >
                  {section.is_visible ? (
                    <Eye className="w-3.5 h-3.5" />
                  ) : (
                    <EyeOff className="w-3.5 h-3.5" />
                  )}
                </Button>

                {/* More actions dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {/* Move up (disabled if first) */}
                    <DropdownMenuItem
                      onClick={() => moveSection(index, 'up')}
                      disabled={index === 0}
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Move Up
                    </DropdownMenuItem>
                    {/* Move down (disabled if last) */}
                    <DropdownMenuItem
                      onClick={() => moveSection(index, 'down')}
                      disabled={index === sections.length - 1}
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Move Down
                    </DropdownMenuItem>
                    {/* Duplicate section */}
                    <DropdownMenuItem onClick={() => onDuplicate(section.id)}>
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    {/* Delete section (destructive styling) */}
                    <DropdownMenuItem
                      onClick={() => onDelete(section.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
