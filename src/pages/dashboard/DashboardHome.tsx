import { Package, ShoppingCart, Users, TrendingUp, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useStore } from '@/contexts/StoreContext';
import { Link } from 'react-router-dom';

export default function DashboardHome() {
  const { currentStore, stores } = useStore();

  if (stores.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Create Your First Store</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Get started by creating your online store. You'll be selling in minutes!
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

  const stats = [
    { label: 'Total Products', value: '0', icon: Package, change: '+0%' },
    { label: 'Total Orders', value: '0', icon: ShoppingCart, change: '+0%' },
    { label: 'Customers', value: '0', icon: Users, change: '+0%' },
    { label: 'Revenue', value: 'रु 0', icon: TrendingUp, change: '+0%' },
  ];

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
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-success">{stat.change} from last month</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">No orders yet</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-center py-8">No products yet</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
