/**
 * ============================================================================
 * CUSTOMER AUTHENTICATION PAGE
 * ============================================================================
 * 
 * Store-specific customer login/register page.
 * Customers can create accounts tied to a specific store.
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { useStoreLinksWithFallback } from '@/hooks/useStoreLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

// Validation schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const registerSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export default function CustomerAuth() {
  const storefrontContext = useStorefrontOptional();
  const { storeSlug: urlStoreSlug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const storeSlug = storefrontContext?.storeSlug || urlStoreSlug;
  const store = storefrontContext?.store;
  const links = useStoreLinksWithFallback(storeSlug || '');
  
  const returnTo = searchParams.get('returnTo') || 'home';
  
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  // Login form
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  
  // Register form
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [registerErrors, setRegisterErrors] = useState<Record<string, string>>({});

  // Check if user is already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // User is logged in, redirect to return destination
        handleRedirect();
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, []);

  const handleRedirect = () => {
    if (returnTo === 'checkout') {
      navigate(links.checkout());
    } else if (returnTo === 'account') {
      navigate(links.account());
    } else {
      navigate(links.home());
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setLoginErrors(errors);
      return;
    }
    
    setLoginErrors({});
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });
      
      if (error) throw error;
      
      // Link user to store if not already linked
      if (store?.id) {
        await linkUserToStore(store.id);
      }
      
      toast.success('Logged in successfully!');
      handleRedirect();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) errors[err.path[0] as string] = err.message;
      });
      setRegisterErrors(errors);
      return;
    }
    
    setRegisterErrors({});
    setLoading(true);
    
    try {
      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: registerData.email,
        password: registerData.password,
        options: {
          data: {
            full_name: registerData.fullName,
          },
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Create profile
        await supabase.from('profiles').upsert({
          user_id: authData.user.id,
          full_name: registerData.fullName,
        });
        
        // Link user to store as customer
        if (store?.id) {
          await linkUserToStore(store.id, registerData.fullName);
        }
        
        toast.success('Account created successfully!');
        handleRedirect();
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const linkUserToStore = async (storeId: string, fullName?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Use the secure backend function to create/get store customer
      await supabase.rpc('get_or_create_store_customer', {
        p_store_id: storeId,
        p_user_id: user.id,
        p_email: user.email || '',
        p_full_name: fullName || user.user_metadata?.full_name || null,
      });
    } catch (error) {
      console.error('Error linking user to store:', error);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={links.home()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">{store?.name || 'Account'}</h1>
          </div>
        </div>
      </header>

      {/* Auth Form */}
      <div className="max-w-md mx-auto px-4 py-8">
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Sign in to your account' 
                : 'Create an account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className={loginErrors.email ? 'border-destructive' : ''}
                    />
                    {loginErrors.email && (
                      <p className="text-sm text-destructive">{loginErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className={loginErrors.password ? 'border-destructive' : ''}
                    />
                    {loginErrors.password && (
                      <p className="text-sm text-destructive">{loginErrors.password}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Sign In
                  </Button>
                </form>
              </TabsContent>

              {/* Register Tab */}
              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name</Label>
                    <Input
                      id="register-name"
                      value={registerData.fullName}
                      onChange={(e) => setRegisterData({ ...registerData, fullName: e.target.value })}
                      placeholder="John Doe"
                      required
                      className={registerErrors.fullName ? 'border-destructive' : ''}
                    />
                    {registerErrors.fullName && (
                      <p className="text-sm text-destructive">{registerErrors.fullName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className={registerErrors.email ? 'border-destructive' : ''}
                    />
                    {registerErrors.email && (
                      <p className="text-sm text-destructive">{registerErrors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      className={registerErrors.password ? 'border-destructive' : ''}
                    />
                    {registerErrors.password && (
                      <p className="text-sm text-destructive">{registerErrors.password}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password</Label>
                    <Input
                      id="register-confirm"
                      type="password"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      required
                      className={registerErrors.confirmPassword ? 'border-destructive' : ''}
                    />
                    {registerErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{registerErrors.confirmPassword}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
