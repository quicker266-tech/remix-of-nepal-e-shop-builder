/**
 * ============================================================================
 * AUTHENTICATION CONTEXT
 * ============================================================================
 * 
 * Manages user authentication state, roles, and auth operations.
 * Provides authentication state to the entire application.
 * 
 * ARCHITECTURE:
 * - Uses Supabase Auth for authentication
 * - Roles are stored in a separate user_roles table (not in auth metadata)
 * - Auth state listener updates state on login/logout
 * - Role fetching is deferred with setTimeout to avoid Supabase race conditions
 * 
 * ROLE SYSTEM:
 * - super_admin: Full platform access
 * - store_admin: Store owner with full store access
 * - store_staff: Limited store access (assigned by store owner)
 * - customer: Default role for all new users
 * 
 * USAGE:
 * ```tsx
 * const { user, isSuperAdmin, signIn, signOut } = useAuth();
 * 
 * if (isSuperAdmin) {
 *   // Show admin features
 * }
 * ```
 * 
 * ============================================================================
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

/**
 * Available user roles in the application
 * Stored in the user_roles table, not in Supabase auth metadata
 */
type UserRole = 'super_admin' | 'store_admin' | 'store_staff' | 'customer';

/**
 * Shape of the authentication context
 * 
 * @property user - Current authenticated user (null if not logged in)
 * @property session - Current Supabase session
 * @property loading - True while initial auth state is being determined
 * @property roles - Array of roles assigned to the current user
 * @property isSuperAdmin - Convenience boolean for super admin check
 * @property signIn - Sign in with email and password
 * @property signUp - Create new account with optional full name
 * @property signOut - Sign out current user
 */
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  roles: UserRole[];
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * Wraps the application and provides auth state to all children
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  // Core auth state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRole[]>([]);

  useEffect(() => {
    // ================================================================
    // STEP 1: Set up auth state listener FIRST
    // This ensures we catch any auth changes that happen during initial load
    // ================================================================
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer role fetching to avoid Supabase internal race conditions
        // Using setTimeout(fn, 0) pushes the fetch to the next event loop tick
        if (session?.user) {
          setTimeout(() => {
            fetchUserRoles(session.user.id);
          }, 0);
        } else {
          setRoles([]);
        }
      }
    );

    // ================================================================
    // STEP 2: Check for existing session
    // This handles the case where user is already logged in (page refresh)
    // ================================================================
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    // Cleanup: unsubscribe from auth listener on unmount
    return () => subscription.unsubscribe();
  }, []);

  /**
   * Fetch user roles from the database
   * Roles are stored in a separate table for security (not in JWT)
   * 
   * @param userId - The user's UUID from auth.users
   */
  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user roles:', error);
        return;
      }

      // Map the response to an array of role strings
      setRoles((data || []).map(r => r.role as UserRole));
    } catch (err) {
      console.error('Error fetching user roles:', err);
    }
  };

  /**
   * Sign in with email and password
   * Uses Supabase's built-in email/password authentication
   */
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  /**
   * Create a new user account
   * Optionally stores full_name in user metadata
   * The handle_new_user() trigger creates profile and assigns 'customer' role
   */
  const signUp = async (email: string, password: string, fullName?: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error };
  };

  /**
   * Sign out the current user
   * Clears local role state as well
   */
  const signOut = async () => {
    await supabase.auth.signOut();
    setRoles([]);
  };

  // Convenience computed value for super admin checks
  const isSuperAdmin = roles.includes('super_admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        roles,
        isSuperAdmin,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access authentication context
 * Must be used within an AuthProvider
 * 
 * @throws Error if used outside of AuthProvider
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signOut } = useAuth();
 *   return <button onClick={signOut}>Logout {user?.email}</button>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
