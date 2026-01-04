/**
 * ============================================================================
 * STORE BUILDER - MAIN EDITOR COMPONENT
 * ============================================================================
 * 
 * This is the primary entry point for the Store Builder visual editor.
 * It provides a full-featured page editor with:
 * - Live preview
 * - Drag-and-drop section reordering
 * - Section configuration panels
 * - Theme customization
 * - Responsive preview modes
 * 
 * ARCHITECTURE:
 * - StoreBuilder: Main container with sidebar and preview
 * - SectionPalette: Draggable section types to add
 * - SectionList: Current page sections with drag reorder
 * - SectionEditor: Configuration panel for selected section
 * - PreviewFrame: Live preview of the storefront
 * 
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { useStorePages, usePageSections, useStoreTheme } from '@/hooks/useStoreBuilder';
import { StorePage, PageSection, EditorState } from './types';
import { SectionPalette } from './editor/SectionPalette';
import { SectionList } from './editor/SectionList';
import { SectionEditor } from './editor/SectionEditor';
import { PageSelector } from './editor/PageSelector';
import { PageSettings } from './editor/PageSettings';
import { ThemeEditor } from './editor/ThemeEditor';
import { PreviewFrame } from './editor/PreviewFrame';
import { EditorHeader } from './editor/EditorHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

export function StoreBuilder() {
  // ==========================================================================
  // CONTEXT & DATA HOOKS
  // ==========================================================================
  // currentStore: The currently selected store from StoreContext
  // pages: All pages for this store (homepage, about, etc.)
  // theme: The active theme configuration (colors, fonts, layout)
  const { currentStore } = useStore();
  const { pages, loading: pagesLoading, createPage, updatePage, deletePage } = useStorePages(currentStore?.id);
  const { theme, loading: themeLoading, updateTheme } = useStoreTheme(currentStore?.id);
  
  // ==========================================================================
  // LOCAL EDITOR STATE
  // ==========================================================================
  // activePage: Which page is currently being edited
  // editorState: UI state (selected section, preview mode, zoom level)
  // activeTab: Which sidebar tab is active (sections/theme/pages)
  const [activePage, setActivePage] = useState<StorePage | null>(null);
  const [editorState, setEditorState] = useState<EditorState>({
    selectedSectionId: null,  // ID of section being configured in right sidebar
    isDragging: false,        // True while dragging a section
    previewMode: 'desktop',   // 'desktop' | 'tablet' | 'mobile'
    showGrid: false,          // Show alignment grid overlay
    zoom: 100,                // Preview zoom percentage (50-150)
  });
  const [activeTab, setActiveTab] = useState<'sections' | 'theme' | 'settings'>('sections');

  // ==========================================================================
  // SECTIONS HOOK
  // ==========================================================================
  // Fetches and manages sections for the currently active page
  // Each section has a type, config (JSONB), and sort_order
  const {
    sections,
    loading: sectionsLoading,
    addSection,           // (sectionType, insertIndex?) => Add new section
    updateSection,        // (id, updates) => Update section properties
    updateSectionConfig,  // (id, config) => Update section's config JSON
    deleteSection,        // (id) => Remove section from page
    reorderSections,      // (sections[]) => Update sort order
    duplicateSection,     // (id) => Clone a section
  } = usePageSections(activePage?.id, currentStore?.id);

  // ==========================================================================
  // EFFECTS: Store Change Detection
  // ==========================================================================
  
  // Reset editor state when store changes to prevent cross-store data leakage
  useEffect(() => {
    setActivePage(null);
    setEditorState({
      selectedSectionId: null,
      isDragging: false,
      previewMode: 'desktop',
      showGrid: false,
      zoom: 100,
    });
    setActiveTab('sections');
  }, [currentStore?.id]);

  // ==========================================================================
  // EFFECTS: Page Initialization
  // ==========================================================================
  
  // Auto-select homepage (or first page) when pages load
  useEffect(() => {
    if (pages.length > 0 && !activePage) {
      const homepage = pages.find(p => p.page_type === 'homepage');
      const selectedPage = homepage || pages[0];
      console.log('[Step 1B.3] Auto-selecting page:', { 
        title: selectedPage.title, 
        type: selectedPage.page_type 
      });
      setActivePage(selectedPage);
    }
  }, [pages, activePage]);

  // Handler for page selection with logging
  const handlePageSelect = (page: StorePage) => {
    console.log('[Step 1B.3] Active page changed:', page.id, ', loading sections...');
    setActivePage(page);
    setEditorState({ ...editorState, selectedSectionId: null });
  };

  // Auto-create homepage if store has no pages yet
  // This ensures every store has at least a homepage to edit
  useEffect(() => {
    if (!pagesLoading && pages.length === 0 && currentStore?.id) {
      createPage({
        title: 'Homepage',
        slug: 'home',
        page_type: 'homepage',
        is_published: true,
      });
    }
  }, [pagesLoading, pages.length, currentStore?.id, createPage]);

  const selectedSection = sections.find(s => s.id === editorState.selectedSectionId);

  if (pagesLoading || themeLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Please select a store to edit.</p>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-muted/30">
      {/* Editor Header */}
      <EditorHeader
        store={currentStore}
        activePage={activePage}
        editorState={editorState}
        setEditorState={setEditorState}
        onPublish={() => activePage && updatePage(activePage.id, { is_published: true })}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Section Management */}
        <aside className="w-80 bg-background border-r border-border flex flex-col">
          {/* Page Selector - Always visible at top */}
          <PageSelector
            pages={pages}
            activePage={activePage}
            onSelectPage={handlePageSelect}
          />

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col flex-1 overflow-hidden">
            <TabsList className="grid w-full grid-cols-3 mx-2 mt-2 mb-0 w-[calc(100%-16px)]">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="sections" className="flex-1 overflow-hidden m-0 flex flex-col">
              {/* Section Palette - Add new sections (filtered by page type) */}
              <SectionPalette 
                onAddSection={addSection} 
                pageType={activePage?.page_type}
              />
              
              {/* Section List - Current page sections */}
              <div className="flex-1 overflow-auto border-t">
                <SectionList
                  sections={sections}
                  selectedSectionId={editorState.selectedSectionId}
                  onSelectSection={(id) => setEditorState({ ...editorState, selectedSectionId: id })}
                  onReorder={reorderSections}
                  onDelete={deleteSection}
                  onDuplicate={duplicateSection}
                  onToggleVisibility={(id) => {
                    const section = sections.find(s => s.id === id);
                    if (section) {
                      updateSection(id, { is_visible: !section.is_visible });
                    }
                  }}
                />
              </div>
            </TabsContent>

            <TabsContent value="theme" className="flex-1 overflow-auto m-0">
              {theme && (
                <ThemeEditor
                  theme={theme}
                  onUpdate={updateTheme}
                />
              )}
            </TabsContent>

            <TabsContent value="settings" className="flex-1 overflow-auto m-0">
              {activePage ? (
                <PageSettings
                  page={activePage}
                  onUpdate={updatePage}
                />
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p className="text-sm">Select a page to edit settings</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </aside>

        {/* Main Preview Area */}
        <main className="flex-1 bg-muted/50 overflow-auto flex flex-col">
          <PreviewFrame
            store={currentStore}
            theme={theme}
            sections={sections}
            previewMode={editorState.previewMode}
            zoom={editorState.zoom}
            selectedSectionId={editorState.selectedSectionId}
            onSelectSection={(id) => setEditorState({ ...editorState, selectedSectionId: id })}
          />
        </main>

        {/* Right Sidebar - Section Configuration */}
        {selectedSection && (
          <aside className="w-80 bg-background border-l border-border overflow-auto">
            <SectionEditor
              section={selectedSection}
              onUpdate={(updates) => updateSectionConfig(selectedSection.id, updates)}
              onClose={() => setEditorState({ ...editorState, selectedSectionId: null })}
            />
          </aside>
        )}
      </div>
    </div>
  );
}

export default StoreBuilder;
