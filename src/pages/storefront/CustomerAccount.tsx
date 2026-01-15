/**
 * ============================================================================
 * CUSTOMER ACCOUNT DASHBOARD
 * ============================================================================
 * 
 * Main account page showing orders, profile, and quick actions.
 * Uses store-specific customer authentication.
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Package, User, LogOut, ShoppingBag, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { useStoreLinksWithFallback } from '@/hooks/useStoreLinks';
import { useStoreCustomerAuth } from '@/contexts/StoreCustomerAuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

const EDGE_FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-customer-auth`;

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
}

export default function CustomerAccount() {
  const storefrontContext = useStorefrontOptional();
  const { storeSlug: urlStoreSlug } = useParams();
  const navigate = useNavigate();
  
  const storeSlug = storefrontContext?.storeSlug || urlStoreSlug;
  const store = storefrontContext?.store;
  const links = useStoreLinksWithFallback(storeSlug || '');
  
  const { customer, isAuthenticated, loading: authLoading, logout } = useStoreCustomerAuth();
  
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate(links.auth() + '?returnTo=account');
      return;
    }
    
    if (isAuthenticated && store?.id) {
      fetchOrders();
    }
  }, [authLoading, isAuthenticated, store?.id]);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem(`store_customer_token_${store?.id}`);
      if (!token || !store?.id) {
        setLoading(false);
        return;
      }

      const response = await fetch(`${EDGE_FUNCTION_URL}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: store.id, token }),
      });

      const data = await response.json();

      if (data.success) {
        // Get only the first 5 orders
        setRecentOrders((data.orders || []).slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate(links.home());
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  if (authLoading || loading) {
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
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to={links.home()}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="font-semibold">My Account</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <CardTitle>
              Welcome, {customer?.full_name || customer?.email?.split('@')[0] || 'Customer'}!
            </CardTitle>
            <CardDescription>
              Manage your orders and account settings
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Link to={links.orders()}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">My Orders</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={links.profile()}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <User className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Profile</p>
              </CardContent>
            </Card>
          </Link>
          <Link to={links.home()}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
              <CardContent className="pt-6 text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <p className="font-medium">Continue Shopping</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Orders</CardTitle>
              <Link to={links.orders()}>
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No orders yet</p>
                <Link to={links.home()}>
                  <Button variant="link" className="mt-2">Start Shopping</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div>
                      <p className="font-medium">{order.order_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(order.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">रु {order.total.toLocaleString()}</p>
                      <span className={`inline-block px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
