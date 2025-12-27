/**
 * ============================================================================
 * STORE CONTEXT
 * ============================================================================
 * 
 * Manages store selection and access for multi-tenant functionality.
 * Provides the current store to dashboard components.
 * 
 * ARCHITECTURE:
 * - Fetches stores the user owns OR is staff member of
 * - Removes duplicates (in case user owns a store they're also staff of)
 * - Auto-selects first store if none is selected
 * - Persists current store selection during session
 * 
 * MULTI-TENANT ACCESS:
 * - Store owners: Full access to their stores
 * - Store staff: Access granted via store_staff table
 * - Super admins: Can access all stores (handled at RLS level)
 * 
 * USAGE:
 * ```tsx
 * const { currentStore, stores, setCurrentStore } = useStore();
 * 
 * // Switch stores
 * setCurrentStore(stores[1]);
 * 
 * // Access current store data
 * console.log(currentStore?.name);
 * ```
 * 
 * ============================================================================
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

/**
 * Store data structure
 * Matches the stores table columns we need for the UI
 */
interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  status: string;
}

/**
 * Shape of the store context
 * 
 * @property stores - All stores the user has access to
 * @property currentStore - Currently selected store (null if none)
 * @property setCurrentStore - Function to change the current store
 * @property loading - True while fetching stores
 * @property refreshStores - Function to refetch stores (e.g., after creating new one)
 */
interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

/**
 * Store Provider Component
 * Wraps dashboard pages and provides store selection state
 */
export function StoreProvider({ children }: { children: ReactNode }) {
  // Get current user from auth context
  const { user } = useAuth();
  
  // Store state
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Fetch all stores the user has access to
   * Combines owned stores and staff stores, removes duplicates
   */
  const fetchStores = async () => {
    // No user = no stores
    if (!user) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    try {
      // ================================================================
      // QUERY 1: Fetch stores owned by the user
      // Uses owner_id column in stores table
      // ================================================================
      const { data: ownedStores, error: ownedError } = await supabase
        .from('stores')
        .select('id, name, slug, description, logo_url, status')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // ================================================================
      // QUERY 2: Fetch stores where user is staff member
      // Uses store_staff junction table with nested select
      // ================================================================
      const { data: staffStores, error: staffError } = await supabase
        .from('store_staff')
        .select('store:stores(id, name, slug, description, logo_url, status)')
        .eq('user_id', user.id);

      if (staffError) throw staffError;

      // Combine both arrays
      const allStores = [
        ...(ownedStores || []),
        // Extract store object from nested response, filter nulls
        ...(staffStores || []).map((s: any) => s.store).filter(Boolean),
      ];

      // ================================================================
      // Remove duplicates using Map (keyed by store ID)
      // This handles edge case where user owns a store they're also staff of
      // ================================================================
      const uniqueStores = Array.from(
        new Map(allStores.map(s => [s.id, s])).values()
      );

      setStores(uniqueStores);
      
      // Auto-select first store if none is currently selected
      if (!currentStore && uniqueStores.length > 0) {
        setCurrentStore(uniqueStores[0]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Refetch stores when user changes (login/logout)
  useEffect(() => {
    fetchStores();
  }, [user]);

  return (
    <StoreContext.Provider
      value={{
        stores,
        currentStore,
        setCurrentStore,
        loading,
        refreshStores: fetchStores,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to access store context
 * Must be used within a StoreProvider (typically inside dashboard layout)
 * 
 * @throws Error if used outside of StoreProvider
 * 
 * @example
 * ```tsx
 * function ProductsList() {
 *   const { currentStore } = useStore();
 *   
 *   // Fetch products for current store
 *   useEffect(() => {
 *     if (currentStore) {
 *       fetchProducts(currentStore.id);
 *     }
 *   }, [currentStore]);
 * }
 * ```
 */
export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
