/**
 * ============================================================================
 * PAGE MANAGER COMPONENT
 * ============================================================================
 * 
 * Manages store pages (create, select, delete).
 * Displays list of pages with type icons and publication status.
 * 
 * ARCHITECTURE:
 * - Quick page creation via input field
 * - Page list with icons based on page type
 * - Homepage cannot be deleted (only one allowed)
 * - Each page can be selected for editing
 * 
 * PAGE TYPES:
 * - homepage: Main landing page (icon: Home)
 * - about: About us page (icon: Info)
 * - contact: Contact page (icon: Phone)
 * - policy: Policy pages like privacy, terms (icon: FileCheck)
 * - custom: Any other page (icon: FileText)
 * 
 * HOW TO EXTEND:
 * - Add new page types: Update PageType enum and add icon mapping
 * - Add page templates: Modify onCreatePage to include default sections
 * - Add inline editing: Implement onUpdatePage for title changes
 * 
 * ============================================================================
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Home, Info, Phone, FileCheck, Trash2 } from 'lucide-react';
import { StorePage, PageType } from '../types';
import { cn } from '@/lib/utils';
import { useState } from 'react';

/**
 * Props for the PageManager component
 * 
 * @property pages - Array of store pages
 * @property activePage - Currently selected page (null if none)
 * @property onSelectPage - Callback when page is clicked
 * @property onCreatePage - Async callback to create a page, returns the created page
 * @property onUpdatePage - Callback to update page properties
 * @property onDeletePage - Callback to delete a page by ID
 */
interface PageManagerProps {
  pages: StorePage[];
  activePage: StorePage | null;
  onSelectPage: (page: StorePage) => void;
  onCreatePage: (page: Partial<StorePage>) => Promise<StorePage | null>;
  onUpdatePage: (pageId: string, updates: Partial<StorePage>) => void;
  onDeletePage: (pageId: string) => void;
}

/**
 * Icon mapping for page types
 * Used to display appropriate icon next to each page in the list
 */
const pageTypeIcons: Record<PageType, React.ComponentType<{ className?: string }>> = {
  homepage: Home,
  about: Info,
  contact: Phone,
  policy: FileCheck,
  custom: FileText,
};

export function PageManager({
  pages,
  activePage,
  onSelectPage,
  onCreatePage,
  onDeletePage,
}: PageManagerProps) {
  // State for the new page creation input
  const [newPageTitle, setNewPageTitle] = useState('');

  /**
   * Handle creating a new page
   * Generates slug from title and creates as 'custom' type
   */
  const handleCreatePage = async () => {
    if (!newPageTitle.trim()) return;
    
    // Generate URL-friendly slug from title
    const slug = newPageTitle.toLowerCase().replace(/\s+/g, '-');
    
    const page = await onCreatePage({
      title: newPageTitle,
      slug,
      page_type: 'custom',
    });
    
    // Clear input and select the new page
    if (page) {
      setNewPageTitle('');
      onSelectPage(page);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* ============================================================
       * NEW PAGE CREATION: Input field + create button
       * ============================================================ */}
      <div className="flex gap-2">
        <Input
          placeholder="New page name..."
          value={newPageTitle}
          onChange={(e) => setNewPageTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreatePage()}
        />
        <Button size="icon" onClick={handleCreatePage}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* ============================================================
       * PAGE LIST: Scrollable list of existing pages
       * ============================================================ */}
      <ScrollArea className="h-[400px]">
        <div className="space-y-1">
          {pages.map((page) => {
            // Get appropriate icon based on page type
            const Icon = pageTypeIcons[page.page_type];
            
            return (
              <div
                key={page.id}
                onClick={() => onSelectPage(page)}
                className={cn(
                  'flex items-center gap-2 p-2 rounded-lg cursor-pointer',
                  // Highlight active page
                  activePage?.id === page.id ? 'bg-primary/10' : 'hover:bg-muted'
                )}
              >
                {/* Page type icon */}
                <Icon className="w-4 h-4 text-muted-foreground" />
                
                {/* Page title (truncated if long) */}
                <span className="flex-1 text-sm truncate">{page.title}</span>
                
                {/* Publication status badge */}
                {page.is_published && (
                  <Badge variant="secondary" className="text-xs">Live</Badge>
                )}
                
                {/* Delete button (not shown for homepage - can't delete homepage) */}
                {page.page_type !== 'homepage' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={(e) => { e.stopPropagation(); onDeletePage(page.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
