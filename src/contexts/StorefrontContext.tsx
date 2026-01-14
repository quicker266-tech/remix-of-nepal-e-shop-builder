/**
 * ============================================================================
 * STOREFRONT CONTEXT
 * ============================================================================
 * 
 * Provides unified store data to all storefront pages.
 * Handles store detection from both subdomain and URL path modes.
 * 
 * FEATURES:
 * - Automatic store detection (subdomain or path-based)
 * - Single data fetch for store, theme, header/footer, navigation
 * - Reduces duplicate API calls across storefront pages
 * - Provides routing mode awareness (isSubdomainMode)
 * 
 * USAGE:
 * Wrap storefront routes with <StorefrontProvider>
 * Access data with useStorefront() hook
 * 
 * ============================================================================
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { getStoreSlugFromSubdomain, isStorefrontSubdomain } from '@/lib/subdomain';

// ============================================================================
// TYPES
// ============================================================================

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  status: string;
  settings: Record<string, unknown> | null;
  subdomain: string | null;
  custom_domain: string | null;
  domain_type: string | null;
  domain_verified: boolean | null;
}

interface Theme {
  id: string;
  colors: Record<string, string>;
  typography: Record<string, string>;
  layout: Record<string, string>;
}

interface HeaderFooterConfig {
  header_config: Record<string, unknown>;
  footer_config: Record<string, unknown>;
  social_links: Record<string, string>;
}

interface NavItem {
  id: string;
  label: string;
  url: string | null;
  page_id: string | null;
  location: 'header' | 'footer' | 'mobile';
  sort_order: number;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
}

interface StorefrontContextType {
  // Store data
  store: Store | null;
  storeSlug: string | null;
  storeId: string | null;
  
  // Theme and config
  theme: Theme | null;
  headerFooter: HeaderFooterConfig | null;
  navItems: NavItem[];
  
  // State
  loading: boolean;
  error: string | null;
  
  // Routing mode
  isSubdomainMode: boolean;
  
  // Actions
  refetch: () => Promise<void>;
}

// ============================================================================
// CONTEXT
// ============================================================================

const StorefrontContext = createContext<StorefrontContextType | null>(null);

// ============================================================================
// PROVIDER PROPS
// ============================================================================

interface StorefrontProviderProps {
  children: ReactNode;
  /** Override store slug (used in subdomain mode) */
  storeSlugOverride?: string;
  /** Force subdomain mode (used when detected externally) */
  forceSubdomainMode?: boolean;
}

// ============================================================================
// PROVIDER
// ============================================================================

export function StorefrontProvider({ 
  children, 
  storeSlugOverride,
  forceSubdomainMode = false 
}: StorefrontProviderProps) {
  // Get store slug from URL params (path mode)
  const params = useParams<{ storeSlug?: string }>();
  
  // Determine store slug and routing mode
  const subdomainSlug = getStoreSlugFromSubdomain();
  const isSubdomainMode = forceSubdomainMode || subdomainSlug !== null;
  const storeSlug = storeSlugOverride || subdomainSlug || params.storeSlug || null;
  
  // State
  const [store, setStore] = useState<Store | null>(null);
  const [theme, setTheme] = useState<Theme | null>(null);
  const [headerFooter, setHeaderFooter] = useState<HeaderFooterConfig | null>(null);
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch all store data
  const fetchStoreData = async () => {
    if (!storeSlug) {
      setError('No store specified');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch store by slug or subdomain
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .or(`slug.eq.${storeSlug},subdomain.eq.${storeSlug}`)
        .eq('status', 'active')
        .maybeSingle();
      
      if (storeError) throw storeError;
      
      if (!storeData) {
        setError('Store not found');
        setLoading(false);
        return;
      }
      
      setStore(storeData as Store);
      
      // Fetch theme, header/footer, and nav items in parallel
      const [themeResult, headerFooterResult, navResult] = await Promise.all([
        supabase
          .from('store_themes')
          .select('id, colors, typography, layout')
          .eq('store_id', storeData.id)
          .eq('is_active', true)
          .maybeSingle(),
        
        supabase
          .from('store_header_footer')
          .select('header_config, footer_config, social_links')
          .eq('store_id', storeData.id)
          .maybeSingle(),
        
        supabase
          .from('store_navigation')
          .select('*')
          .eq('store_id', storeData.id)
          .order('sort_order', { ascending: true }),
      ]);
      
      if (themeResult.data) {
        setTheme(themeResult.data as Theme);
      }
      
      if (headerFooterResult.data) {
        setHeaderFooter(headerFooterResult.data as HeaderFooterConfig);
      }
      
      if (navResult.data) {
        setNavItems(navResult.data as NavItem[]);
      }
      
    } catch (err) {
      console.error('Error fetching store data:', err);
      setError('Failed to load store');
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch on mount and when store slug changes
  useEffect(() => {
    fetchStoreData();
  }, [storeSlug]);
  
  // Context value
  const value: StorefrontContextType = {
    store,
    storeSlug,
    storeId: store?.id || null,
    theme,
    headerFooter,
    navItems,
    loading,
    error,
    isSubdomainMode,
    refetch: fetchStoreData,
  };
  
  return (
    <StorefrontContext.Provider value={value}>
      {children}
    </StorefrontContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Access storefront data from context
 * Must be used within a StorefrontProvider
 */
export function useStorefront(): StorefrontContextType {
  const context = useContext(StorefrontContext);
  
  if (!context) {
    throw new Error('useStorefront must be used within a StorefrontProvider');
  }
  
  return context;
}

// ============================================================================
// OPTIONAL HOOK (for components that may or may not be in storefront)
// ============================================================================

/**
 * Access storefront data if available
 * Returns null if not within a StorefrontProvider
 */
export function useStorefrontOptional(): StorefrontContextType | null {
  return useContext(StorefrontContext);
}
