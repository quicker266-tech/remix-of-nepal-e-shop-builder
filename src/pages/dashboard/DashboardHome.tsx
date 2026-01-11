import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Package, ShoppingCart, Users, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useStore } from '@/contexts/StoreContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type Customer = {
  full_name: string | null;
  email: string;
};

type OrderWithCustomer = Order & {
  customer: Customer | null;
};

export default function DashboardHome() {
  const { currentStore, stores } = useStore();
  
  // State for metrics
  const [metrics, setMetrics] = useState({
    products: 0,
    orders: 0,
    customers: 0,
    revenue: 0,
  });
  
  // State for recent orders
  const [recentOrders, setRecentOrders] = useState<OrderWithCustomer[]>([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);

  // Fetch metrics when store changes
  useEffect(() => {
    if (currentStore?.id) {
      console.log('📊 [DASHBOARD] Fetching metrics for store:', currentStore.id);
      fetchDashboardMetrics();
    } else {
      console.log('⚠️ [DASHBOARD] No current store selected');
      setLoading(false);
    }
  }, [currentStore?.id]);

  const fetchDashboardMetrics = async () => {
    if (!currentStore?.id) {
      console.log('⚠️ [DASHBOARD] Cannot fetch - no store ID');
      return;
    }

    try {
      setLoading(true);
      
      console.log('📦 [DASHBOARD] Fetching product count...');
      // Fetch product count
      const { count: productCount, error: productError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', currentStore.id);

      if (productError) {
        console.error('❌ [DASHBOARD] Product count error:', productError);
      } else {
        console.log('✅ [DASHBOARD] Product count:', productCount);
      }

      console.log('📋 [DASHBOARD] Fetching orders and revenue...');
      // Fetch orders and calculate revenue
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total')
        .eq('store_id', currentStore.id);

      if (ordersError) {
        console.error('❌ [DASHBOARD] Orders error:', ordersError);
      } else {
        console.log('✅ [DASHBOARD] Orders fetched:', orders?.length || 0);
      }

      console.log('👥 [DASHBOARD] Fetching customer count...');
      // Fetch customer count
      const { count: customerCount, error: customerError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', currentStore.id);

      if (customerError) {
        console.error('❌ [DASHBOARD] Customer count error:', customerError);
      } else {
        console.log('✅ [DASHBOARD] Customer count:', customerCount);
      }

      console.log('📊 [DASHBOARD] Fetching recent orders...');
      // Fetch recent orders with customer info
      const { data: recent, error: recentError } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(full_name, email)
        `)
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (recentError) {
        console.error('❌ [DASHBOARD] Recent orders error:', recentError);
      } else {
        console.log('✅ [DASHBOARD] Recent orders fetched:', recent?.length || 0);
      }

      // Calculate total revenue
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total || 0), 0) || 0;

      console.log('📊 [DASHBOARD] Final metrics:', {
        products: productCount || 0,
        orders: orders?.length || 0,
        customers: customerCount || 0,
        revenue: totalRevenue,
      });

      // Update state with fetched metrics
      setMetrics({
        products: productCount || 0,
        orders: orders?.length || 0,
        customers: customerCount || 0,
        revenue: totalRevenue,
      });
      
      setRecentOrders((recent as OrderWithCustomer[]) || []);
    } catch (error) {
      console.error('❌ [DASHBOARD] Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Show message if no stores exist
  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <h2 className="text-2xl font-bold">Welcome to PasalHub!</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You'll be selling in minutes!
        </p>
        <Link to="/dashboard/create-store">
          <Button variant="hero" size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create Store
          </Button>
        </Link>
      </div>
    );
  }

  // Create stats array using fetched metrics
  const stats = [
    { 
      label: 'Total Products', 
      value: loading ? '...' : metrics.products.toString(), 
      icon: Package, 
      change: '+0%' 
    },
    { 
      label: 'Total Orders', 
      value: loading ? '...' : metrics.orders.toString(), 
      icon: ShoppingCart, 
      change: '+0%' 
    },
    { 
      label: 'Customers', 
      value: loading ? '...' : metrics.customers.toString(), 
      icon: Users, 
      change: '+0%' 
    },
    { 
      label: 'Revenue', 
      value: loading ? '...' : `रु ${metrics.revenue.toLocaleString()}`, 
      icon: TrendingUp, 
      change: '+0%' 
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge className="bg-blue-500">Confirmed</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-500">Processing</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-500">Shipped</Badge>;
      case 'delivered':
        return <Badge className="bg-success text-success-foreground">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">{currentStore?.name || 'Select a store'}</p>
        </div>
        <Link to="/dashboard/products/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className="w-5 h-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className="text-xs text-success">{stat.change} from last month</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link to="/dashboard/orders" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {recentOrders.map((order) => (
                  <Link 
                    key={order.id} 
                    to={`/dashboard/orders/${order.id}`}
                    className="block hover:bg-muted/50 rounded-lg p-3 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.customer?.full_name || order.customer?.email || 'Guest'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-sm">रु {Number(order.total).toLocaleString()}</p>
                        {getStatusBadge(order.status)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Products - Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">
              {loading ? 'Loading...' : 'No products yet'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
