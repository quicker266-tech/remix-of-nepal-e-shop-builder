/**
 * ============================================================================
 * EDITOR HEADER COMPONENT
 * ============================================================================
 * 
 * Top navigation bar for the store builder editor.
 * Contains: page title, preview mode toggles, zoom controls, publish button.
 * 
 * ARCHITECTURE:
 * - Left section: Navigation back + page info with publication status
 * - Center section: Responsive preview mode switcher (desktop/tablet/mobile)
 * - Right section: Zoom controls, preview link, and publish action
 * 
 * HOW TO EXTEND:
 * - Add new preview modes: Update previewMode type and add button in center section
 * - Add new actions: Add buttons to the right section
 * - Customize header styling: Modify the header className
 * 
 * ============================================================================
 */

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Tablet,
  Smartphone,
  ZoomIn,
  ZoomOut,
  Eye,
  ArrowLeft,
  Check,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EditorState, StorePage } from '../types';

/**
 * Props for the EditorHeader component
 * 
 * @property store - Basic store info for display and linking
 * @property activePage - Currently selected page (can be null if no page selected)
 * @property editorState - Current editor state (preview mode, zoom level, etc.)
 * @property setEditorState - Function to update editor state
 * @property onPublish - Callback when publish/update button is clicked
 */
interface EditorHeaderProps {
  store: {
    id: string;
    name: string;
    slug: string;
  };
  activePage: StorePage | null;
  editorState: EditorState;
  setEditorState: (state: EditorState) => void;
  onPublish: () => void;
}

export function EditorHeader({
  store,
  activePage,
  editorState,
  setEditorState,
  onPublish,
}: EditorHeaderProps) {
  /**
   * Handles zoom level changes
   * Clamps zoom between 50% and 150% for usability
   * 
   * @param delta - Amount to change zoom (positive = zoom in, negative = zoom out)
   */
  const handleZoom = (delta: number) => {
    const newZoom = Math.max(50, Math.min(150, editorState.zoom + delta));
    setEditorState({ ...editorState, zoom: newZoom });
  };

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-4">
      {/* ============================================================
       * LEFT SECTION: Back button and page info
       * Shows store name, current page, and publication status
       * ============================================================ */}
      <div className="flex items-center gap-4">
        {/* Back to dashboard settings */}
        <Link to="/dashboard/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        
        {/* Breadcrumb: Store name / Page title + status badge */}
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">{store.name}</span>
          <span className="text-muted-foreground">/</span>
          <span className="text-muted-foreground">
            {activePage?.title || 'No page selected'}
          </span>
          {/* Publication status badge */}
          {activePage?.is_published ? (
            <Badge variant="secondary" className="ml-2 bg-success/10 text-success border-success/20">
              <Check className="w-3 h-3 mr-1" />
              Published
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-2">
              Draft
            </Badge>
          )}
        </div>
      </div>

      {/* ============================================================
       * CENTER SECTION: Preview mode toggles
       * Switch between desktop, tablet, and mobile preview widths
       * ============================================================ */}
      <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
        <Button
          variant={editorState.previewMode === 'desktop' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setEditorState({ ...editorState, previewMode: 'desktop' })}
          className="gap-1.5"
        >
          <Monitor className="w-4 h-4" />
          <span className="hidden sm:inline">Desktop</span>
        </Button>
        <Button
          variant={editorState.previewMode === 'tablet' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setEditorState({ ...editorState, previewMode: 'tablet' })}
          className="gap-1.5"
        >
          <Tablet className="w-4 h-4" />
          <span className="hidden sm:inline">Tablet</span>
        </Button>
        <Button
          variant={editorState.previewMode === 'mobile' ? 'secondary' : 'ghost'}
          size="sm"
          onClick={() => setEditorState({ ...editorState, previewMode: 'mobile' })}
          className="gap-1.5"
        >
          <Smartphone className="w-4 h-4" />
          <span className="hidden sm:inline">Mobile</span>
        </Button>
      </div>

      {/* ============================================================
       * RIGHT SECTION: Zoom controls and actions
       * Zoom in/out, preview link, publish/update button
       * ============================================================ */}
      <div className="flex items-center gap-2">
        {/* Zoom controls: Zoom out / percentage display / Zoom in */}
        <div className="flex items-center gap-1 border rounded-lg px-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleZoom(-10)}
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12 text-center">
            {editorState.zoom}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleZoom(10)}
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
        </div>

        {/* Preview button - opens live store in new tab */}
        <a
          href={`/store/${store.slug}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="outline" className="gap-2">
            <Eye className="w-4 h-4" />
            Preview
            <ExternalLink className="w-3 h-3" />
          </Button>
        </a>

        {/* Publish/Update button - changes label based on publication status */}
        <Button onClick={onPublish} className="gap-2">
          {activePage?.is_published ? (
            <>
              <Check className="w-4 h-4" />
              Update
            </>
          ) : (
            'Publish'
          )}
        </Button>
      </div>
    </header>
  );
}
