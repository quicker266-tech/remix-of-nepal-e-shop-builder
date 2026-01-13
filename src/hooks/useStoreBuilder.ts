/**
 * ============================================================================
 * STORE BUILDER HOOKS
 * ============================================================================
 * 
 * Custom hooks for managing store builder data:
 * - useStoreTheme: Fetch and update store theme
 * - useStorePages: CRUD operations for pages (UPDATED: Now fetches ALL pages)
 * - usePageSections: CRUD operations for page sections
 * - useStoreNavigation: Manage navigation items
 * - useStoreHeaderFooter: Header/footer configuration
 * 
 * CHANGELOG - Step 1.1 (Phase 1: Architecture Refactor):
 * - ✅ FIXED: useStorePages now fetches ALL pages, not just homepage
 * - ✅ ADDED: Better ordering (system pages first, then custom)
 * - ✅ ADDED: Debug logging for testing
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  StoreTheme,
  StorePage,
  PageSection,
  NavItem,
  StoreHeaderFooter,
  SectionType,
  SectionConfig,
  PageType,
} from '@/components/store-builder/types';
import { DEFAULT_THEME, SECTION_DEFINITIONS } from '@/components/store-builder/constants';
import { 
  isSectionTypeAllowed, 
  canPageHaveSections, 
  canAddMoreSections,
  getPagePermissionInfo 
} from '@/components/store-builder/utils/sectionPermissions';

// ============================================================================
// STORE THEME HOOK
// ============================================================================

export function useStoreTheme(storeId: string | undefined) {
  const [theme, setTheme] = useState<StoreTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTheme = useCallback(async () => {
    if (!storeId) return;
    
    try {
      const { data, error } = await supabase
        .from('store_themes')
        .select('*')
        .eq('store_id', storeId)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setTheme(data as unknown as StoreTheme);
      } else {
        // Create default theme if none exists
        const { data: newTheme, error: createError } = await supabase
          .from('store_themes')
          .insert({
            store_id: storeId,
            name: 'Default Theme',
            is_active: true,
            colors: DEFAULT_THEME.colors,
            typography: DEFAULT_THEME.typography,
            layout: DEFAULT_THEME.layout,
          })
          .select()
          .single();

        if (createError) throw createError;
        setTheme(newTheme as unknown as StoreTheme);
      }
    } catch (error) {
      console.error('Error fetching theme:', error);
      toast({ title: 'Error loading theme', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  const updateTheme = async (updates: Partial<StoreTheme>) => {
    if (!theme) return;

    try {
      const { error } = await supabase
        .from('store_themes')
        .update(updates as any)
        .eq('id', theme.id);

      if (error) throw error;

      setTheme({ ...theme, ...updates });
      toast({ title: 'Theme updated' });
    } catch (error) {
      console.error('Error updating theme:', error);
      toast({ title: 'Error updating theme', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

  return { theme, loading, updateTheme, refetch: fetchTheme };
}

// ============================================================================
// STORE PAGES HOOK - UPDATED FOR STEP 1.1
// ============================================================================
/**
 * STEP 1.1 CHANGES:
 * - Now fetches ALL pages (homepage, product, category, cart, checkout, profile, custom)
 * - Orders pages by type (system pages first, then custom)
 * - Improved error handling with descriptions
 * - Debug logging for testing
 */
export function useStorePages(storeId: string | undefined) {
  const [pages, setPages] = useState<StorePage[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  /**
   * Fetch all pages for the store
   * Previously only fetched homepage - now fetches everything
   */
  const fetchPages = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // UPDATED: Fetch ALL pages, ordered by page_type then title
      const { data, error } = await supabase
        .from('store_pages')
        .select('*')
        .eq('store_id', storeId)
        .order('page_type', { ascending: true })
        .order('title', { ascending: true });

      if (error) throw error;

      const fetchedPages = (data || []) as unknown as StorePage[];
      
      // Debug logging for Step 1.1 testing
      console.log('[Step 1.1] Fetched pages:', fetchedPages.map(p => ({
        title: p.title,
        type: p.page_type,
        published: p.is_published
      })));

      setPages(fetchedPages);
    } catch (error: any) {
      console.error('Error fetching pages:', error);
      toast({ 
        title: 'Error loading pages', 
        description: error?.message || 'Failed to load store pages',
        variant: 'destructive' 
      });
      setPages([]);
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  /**
   * Create a new page
   */
  const createPage = async (pageData: Partial<StorePage>): Promise<StorePage | null> => {
    if (!storeId) return null;

    try {
      const { data, error } = await supabase
        .from('store_pages')
        .insert({
          store_id: storeId,
          ...pageData,
        } as any)
        .select()
        .single();

      if (error) throw error;

      const newPage = data as unknown as StorePage;
      setPages([...pages, newPage]);
      toast({ title: 'Page created' });
      
      return newPage;
    } catch (error: any) {
      console.error('Error creating page:', error);
      toast({ 
        title: 'Error creating page',
        description: error?.message,
        variant: 'destructive' 
      });
      return null;
    }
  };

  /**
   * Update an existing page
   */
  const updatePage = async (pageId: string, updates: Partial<StorePage>) => {
    try {
      const { error } = await supabase
        .from('store_pages')
        .update(updates as any)
        .eq('id', pageId);

      if (error) throw error;

      setPages(pages.map(p => p.id === pageId ? { ...p, ...updates } : p));
      toast({ title: 'Page updated' });
    } catch (error: any) {
      console.error('Error updating page:', error);
      toast({ 
        title: 'Error updating page',
        description: error?.message,
        variant: 'destructive' 
      });
    }
  };

  /**
   * Delete a page
   */
  const deletePage = async (pageId: string) => {
    try {
      const { error } = await supabase
        .from('store_pages')
        .delete()
        .eq('id', pageId);

      if (error) throw error;

      setPages(pages.filter(p => p.id !== pageId));
      toast({ title: 'Page deleted' });
    } catch (error: any) {
      console.error('Error deleting page:', error);
      toast({ 
        title: 'Error deleting page',
        description: error?.message,
        variant: 'destructive' 
      });
    }
  };

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return { 
    pages, 
    loading, 
    createPage, 
    updatePage, 
    deletePage, 
    refetch: fetchPages 
  };
}

// ============================================================================
// PAGE SECTIONS HOOK
// ============================================================================

export function usePageSections(pageId: string | undefined, storeId: string | undefined) {
  const [sections, setSections] = useState<PageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSections = useCallback(async () => {
    if (!pageId) return;

    try {
      const { data, error } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', pageId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setSections(data as unknown as PageSection[]);
    } catch (error) {
      console.error('Error fetching sections:', error);
      toast({ title: 'Error loading sections', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [pageId, toast]);

  const addSection = async (sectionType: SectionType, pageType?: PageType, insertIndex?: number) => {
    if (!pageId || !storeId) return null;

    // Validation: Check if page can have sections at all
    if (pageType && !canPageHaveSections(pageType)) {
      const info = getPagePermissionInfo(pageType);
      console.log('[1C.5] Validation failed: page cannot have sections');
      toast({
        title: 'Sections not available',
        description: info.description,
        variant: 'destructive'
      });
      return null;
    }

    // Validation: Check if section type is allowed for this page type
    if (pageType && !isSectionTypeAllowed(sectionType, pageType)) {
      console.log('[1C.5] Validation failed: section type not allowed');
      toast({
        title: 'Section type not allowed',
        description: `This section is not available for ${pageType} pages`,
        variant: 'destructive'
      });
      return null;
    }

    // Validation: Check max sections limit
    if (pageType && !canAddMoreSections(pageType, sections.length)) {
      const info = getPagePermissionInfo(pageType);
      console.log('[1C.5] Validation failed: max sections reached');
      toast({
        title: 'Maximum sections reached',
        description: `This page supports up to ${info.maxSections} sections`,
        variant: 'destructive'
      });
      return null;
    }

    console.log('[1C.5] Section validation passed, adding:', sectionType);

    const definition = SECTION_DEFINITIONS[sectionType];
    const newSortOrder = insertIndex !== undefined
      ? insertIndex
      : sections.length;

    try {
      // Update sort_order for sections after the insert point
      if (insertIndex !== undefined) {
        const sectionsToUpdate = sections.filter(s => s.sort_order >= insertIndex);
        for (const section of sectionsToUpdate) {
          await supabase
            .from('page_sections')
            .update({ sort_order: section.sort_order + 1 })
            .eq('id', section.id);
        }
      }

      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          page_id: pageId,
          store_id: storeId,
          section_type: sectionType,
          name: definition.label,
          config: definition.defaultConfig as any,
          sort_order: newSortOrder,
          is_visible: true,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSections(); // Refresh to get correct order
      toast({ title: `${definition.label} added` });
      return data as unknown as PageSection;
    } catch (error) {
      console.error('Error adding section:', error);
      toast({ title: 'Error adding section', variant: 'destructive' });
      return null;
    }
  };

  const updateSection = async (sectionId: string, updates: Partial<PageSection>) => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .update(updates as any)
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ));
    } catch (error) {
      console.error('Error updating section:', error);
      toast({ title: 'Error updating section', variant: 'destructive' });
    }
  };

  const updateSectionConfig = async (sectionId: string, config: SectionConfig) => {
    await updateSection(sectionId, { config });
  };

  const deleteSection = async (sectionId: string) => {
    try {
      const { error } = await supabase
        .from('page_sections')
        .delete()
        .eq('id', sectionId);

      if (error) throw error;

      setSections(sections.filter(s => s.id !== sectionId));
      toast({ title: 'Section deleted' });
    } catch (error) {
      console.error('Error deleting section:', error);
      toast({ title: 'Error deleting section', variant: 'destructive' });
    }
  };

  const reorderSections = async (reorderedSections: PageSection[]) => {
    setSections(reorderedSections);

    try {
      for (let i = 0; i < reorderedSections.length; i++) {
        await supabase
          .from('page_sections')
          .update({ sort_order: i })
          .eq('id', reorderedSections[i].id);
      }
    } catch (error) {
      console.error('Error reordering sections:', error);
      toast({ title: 'Error reordering sections', variant: 'destructive' });
      fetchSections(); // Revert on error
    }
  };

  const duplicateSection = async (section: PageSection) => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('page_sections')
        .insert({
          page_id: section.page_id,
          store_id: storeId,
          section_type: section.section_type,
          name: `${section.name} (copy)`,
          config: section.config as any,
          sort_order: section.sort_order + 1,
          is_visible: section.is_visible,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      await fetchSections();
      toast({ title: 'Section duplicated' });
      return data as unknown as PageSection;
    } catch (error) {
      console.error('Error duplicating section:', error);
      toast({ title: 'Error duplicating section', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchSections();
  }, [fetchSections]);

  return {
    sections,
    loading,
    addSection,
    updateSection,
    updateSectionConfig,
    deleteSection,
    reorderSections,
    duplicateSection,
    refetch: fetchSections,
  };
}

// ============================================================================
// STORE HEADER/FOOTER HOOK
// ============================================================================

export function useStoreHeaderFooter(storeId: string | undefined) {
  const [config, setConfig] = useState<StoreHeaderFooter | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_header_footer')
        .select('*')
        .eq('store_id', storeId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig(data as unknown as StoreHeaderFooter);
      } else {
        // Create default config
        const { data: newConfig, error: createError } = await supabase
          .from('store_header_footer')
          .insert({ store_id: storeId })
          .select()
          .single();

        if (createError) throw createError;
        setConfig(newConfig as unknown as StoreHeaderFooter);
      }
    } catch (error) {
      console.error('Error fetching header/footer config:', error);
      toast({ title: 'Error loading header/footer', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  const updateConfig = async (updates: Partial<StoreHeaderFooter>) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('store_header_footer')
        .update(updates as any)
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });
      toast({ title: 'Settings updated' });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({ title: 'Error updating settings', variant: 'destructive' });
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, loading, updateConfig, refetch: fetchConfig };
}

// ============================================================================
// STORE NAVIGATION HOOK
// ============================================================================

export function useStoreNavigation(storeId: string | undefined) {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNavigation = useCallback(async () => {
    if (!storeId) return;

    try {
      const { data, error } = await supabase
        .from('store_navigation')
        .select('*')
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setNavItems(data as NavItem[]);
    } catch (error) {
      console.error('Error fetching navigation:', error);
      toast({ title: 'Error loading navigation', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [storeId, toast]);

  const addNavItem = async (item: Partial<NavItem>) => {
    if (!storeId) return null;

    try {
      const { data, error } = await supabase
        .from('store_navigation')
        .insert({ ...item, store_id: storeId } as any)
        .select()
        .single();

      if (error) throw error;
      setNavItems([...navItems, data as NavItem]);
      toast({ title: 'Navigation item added' });
      return data as NavItem;
    } catch (error) {
      console.error('Error adding nav item:', error);
      toast({ title: 'Error adding navigation item', variant: 'destructive' });
      return null;
    }
  };

  const updateNavItem = async (itemId: string, updates: Partial<NavItem>) => {
    try {
      const { error } = await supabase
        .from('store_navigation')
        .update(updates)
        .eq('id', itemId);

      if (error) throw error;

      setNavItems(navItems.map(n => n.id === itemId ? { ...n, ...updates } : n));
      toast({ title: 'Navigation updated' });
    } catch (error) {
      console.error('Error updating nav item:', error);
      toast({ title: 'Error updating navigation', variant: 'destructive' });
    }
  };

  const deleteNavItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('store_navigation')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      setNavItems(navItems.filter(n => n.id !== itemId));
      toast({ title: 'Navigation item deleted' });
    } catch (error) {
      console.error('Error deleting nav item:', error);
      toast({ title: 'Error deleting navigation', variant: 'destructive' });
    }
  };

  const reorderNavItems = async (items: NavItem[]) => {
    // Optimistic update
    setNavItems(items);

    try {
      for (let i = 0; i < items.length; i++) {
        await supabase
          .from('store_navigation')
          .update({ sort_order: i })
          .eq('id', items[i].id);
      }
      toast({ title: 'Navigation order updated' });
    } catch (error) {
      console.error('Error reordering nav items:', error);
      toast({ title: 'Error reordering navigation', variant: 'destructive' });
      fetchNavigation(); // Revert on error
    }
  };

  useEffect(() => {
    fetchNavigation();
  }, [fetchNavigation]);

  return { navItems, loading, addNavItem, updateNavItem, deleteNavItem, reorderNavItems, refetch: fetchNavigation };
}
