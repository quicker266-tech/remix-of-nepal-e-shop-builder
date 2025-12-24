import { useEffect, useState } from 'react';
import { Store, Users, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface StoreData {
  id: string;
  name: string;
  status: string;
  created_at: string;
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalStores: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [recentStores, setRecentStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [storesResult, profilesResult, ordersResult] = await Promise.all([
        supabase.from('stores').select('id, name, status, created_at', { count: 'exact' }),
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('orders').select('id, total', { count: 'exact' }),
      ]);

      const storesCount = storesResult.count || 0;
      const usersCount = profilesResult.count || 0;
      const ordersCount = ordersResult.count || 0;
      const totalRevenue = ordersResult.data?.reduce((sum, order) => sum + Number(order.total || 0), 0) || 0;

      setStats({
        totalStores: storesCount,
        totalUsers: usersCount,
        totalOrders: ordersCount,
        totalRevenue,
      });

      // Get recent stores
      if (storesResult.data) {
        setRecentStores(storesResult.data.slice(0, 5));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success text-success-foreground">Active</Badge>;
      case 'pending':
        return <Badge className="bg-warning text-warning-foreground">Pending</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const statCards = [
    { label: 'Total Stores', value: stats.totalStores.toString(), icon: Store },
    { label: 'Total Users', value: stats.totalUsers.toString(), icon: Users },
    { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingCart },
    { label: 'Platform Revenue', value: `रु ${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform Overview</h1>
        <p className="text-muted-foreground">Monitor all stores and platform metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
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
                <div className="text-2xl font-bold">{stat.value}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Stores</CardTitle>
            <Link to="/admin/stores" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                ))}
              </div>
            ) : recentStores.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No stores yet</p>
            ) : (
              <div className="space-y-3">
                {recentStores.map((store) => (
                  <div key={store.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium">{store.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(store.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(store.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link 
              to="/admin/stores" 
              className="block p-4 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Stores</p>
                  <p className="text-sm text-muted-foreground">Approve, suspend, or view stores</p>
                </div>
              </div>
            </Link>
            <Link 
              to="/admin/users" 
              className="block p-4 rounded-lg border hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Manage Users</p>
                  <p className="text-sm text-muted-foreground">View users and manage roles</p>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
