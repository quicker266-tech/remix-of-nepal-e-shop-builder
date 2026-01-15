/**
 * ============================================================================
 * STORE CUSTOMER AUTHENTICATION CONTEXT
 * ============================================================================
 * 
 * Manages store-specific customer authentication, completely separate from
 * the platform's AuthContext. Each store has its own independent customer
 * accounts and sessions.
 * 
 * Session tokens are stored in localStorage with store-specific keys.
 * 
 * USAGE:
 * ```tsx
 * const { customer, isAuthenticated, login, logout } = useStoreCustomerAuth();
 * 
 * if (isAuthenticated) {
 *   // Show customer account features
 * }
 * ```
 * 
 * ============================================================================
 */

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';

interface StoreCustomer {
  customer_id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
}

interface StoreCustomerAuthContextType {
  customer: StoreCustomer | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { full_name?: string; phone?: string; address?: string; city?: string }) => Promise<{ success: boolean; error?: string }>;
  refreshCustomer: () => Promise<void>;
}

const StoreCustomerAuthContext = createContext<StoreCustomerAuthContextType | undefined>(undefined);

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-customer-auth`;

function getTokenKey(storeId: string): string {
  return `store_customer_token_${storeId}`;
}

export function StoreCustomerAuthProvider({ children }: { children: ReactNode }) {
  const storefrontContext = useStorefrontOptional();
  const storeId = storefrontContext?.store?.id;
  
  const [customer, setCustomer] = useState<StoreCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  const getToken = useCallback((): string | null => {
    if (!storeId) return null;
    return localStorage.getItem(getTokenKey(storeId));
  }, [storeId]);

  const setToken = useCallback((token: string | null) => {
    if (!storeId) return;
    const key = getTokenKey(storeId);
    if (token) {
      localStorage.setItem(key, token);
    } else {
      localStorage.removeItem(key);
    }
  }, [storeId]);

  const validateSession = useCallback(async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const token = getToken();
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, token }),
      });

      const data = await response.json();

      if (data.success) {
        setCustomer({
          customer_id: data.customer_id,
          email: data.email,
          full_name: data.full_name,
          phone: data.phone,
          address: data.address,
          city: data.city,
        });
      } else {
        // Invalid session, clear token
        setToken(null);
        setCustomer(null);
      }
    } catch (error) {
      console.error('Session validation error:', error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, [storeId, getToken, setToken]);

  // Validate session on mount and when storeId changes
  useEffect(() => {
    setLoading(true);
    validateSession();
  }, [storeId, validateSession]);

  const login = useCallback(async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    if (!storeId) {
      return { success: false, error: 'Store not found' };
    }

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, email, password }),
      });

      const data = await response.json();

      if (data.success && data.token) {
        setToken(data.token);
        setCustomer({
          customer_id: data.customer_id,
          email: data.email,
          full_name: data.full_name,
          phone: null,
          address: null,
          city: null,
        });
        return { success: true };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [storeId, setToken]);

  const register = useCallback(async (
    email: string, 
    password: string, 
    fullName?: string, 
    phone?: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!storeId) {
      return { success: false, error: 'Store not found' };
    }

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          store_id: storeId, 
          email, 
          password,
          full_name: fullName,
          phone,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Auto-login after registration
        return await login(email, password);
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [storeId, login]);

  const logout = useCallback(async () => {
    if (!storeId) return;

    const token = getToken();
    if (token) {
      try {
        await fetch(`${EDGE_FUNCTION_URL}/logout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: storeId, token }),
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    setToken(null);
    setCustomer(null);
  }, [storeId, getToken, setToken]);

  const updateProfile = useCallback(async (data: { 
    full_name?: string; 
    phone?: string; 
    address?: string; 
    city?: string 
  }): Promise<{ success: boolean; error?: string }> => {
    if (!storeId) {
      return { success: false, error: 'Store not found' };
    }

    const token = getToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const response = await fetch(`${EDGE_FUNCTION_URL}/update-profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: storeId, token, ...data }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh customer data
        await validateSession();
        return { success: true };
      }

      return { success: false, error: result.error || 'Update failed' };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Network error' };
    }
  }, [storeId, getToken, validateSession]);

  const refreshCustomer = useCallback(async () => {
    await validateSession();
  }, [validateSession]);

  return (
    <StoreCustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        loading,
        login,
        register,
        logout,
        updateProfile,
        refreshCustomer,
      }}
    >
      {children}
    </StoreCustomerAuthContext.Provider>
  );
}

/**
 * Hook to access store customer authentication context
 * Must be used within a StoreCustomerAuthProvider
 */
export function useStoreCustomerAuth() {
  const context = useContext(StoreCustomerAuthContext);
  if (context === undefined) {
    throw new Error('useStoreCustomerAuth must be used within a StoreCustomerAuthProvider');
  }
  return context;
}

/**
 * Optional hook that returns null if not within provider
 * Useful for components that may or may not be in storefront context
 */
export function useStoreCustomerAuthOptional() {
  return useContext(StoreCustomerAuthContext);
}
