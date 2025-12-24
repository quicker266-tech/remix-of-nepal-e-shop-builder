import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  status: string;
}

interface StoreContextType {
  stores: Store[];
  currentStore: Store | null;
  setCurrentStore: (store: Store | null) => void;
  loading: boolean;
  refreshStores: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [currentStore, setCurrentStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStores = async () => {
    if (!user) {
      setStores([]);
      setCurrentStore(null);
      setLoading(false);
      return;
    }

    try {
      // Fetch stores owned by user
      const { data: ownedStores, error: ownedError } = await supabase
        .from('stores')
        .select('id, name, slug, description, logo_url, status')
        .eq('owner_id', user.id);

      if (ownedError) throw ownedError;

      // Fetch stores where user is staff
      const { data: staffStores, error: staffError } = await supabase
        .from('store_staff')
        .select('store:stores(id, name, slug, description, logo_url, status)')
        .eq('user_id', user.id);

      if (staffError) throw staffError;

      const allStores = [
        ...(ownedStores || []),
        ...(staffStores || []).map((s: any) => s.store).filter(Boolean),
      ];

      // Remove duplicates
      const uniqueStores = Array.from(
        new Map(allStores.map(s => [s.id, s])).values()
      );

      setStores(uniqueStores);
      
      // Set first store as current if none selected
      if (!currentStore && uniqueStores.length > 0) {
        setCurrentStore(uniqueStores[0]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

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

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
