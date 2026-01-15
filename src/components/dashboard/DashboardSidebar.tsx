import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, Tag, Settings, FolderTree, Palette, Puzzle, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import StoreSwitcher from './StoreSwitcher';
import BeeLogo from '@/components/brand/BeeLogo';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Palette, label: 'Store Builder', path: '/dashboard/store-builder' },
  { icon: FolderTree, label: 'Categories', path: '/dashboard/categories' },
  { icon: Package, label: 'Products', path: '/dashboard/products' },
  { icon: ShoppingCart, label: 'Orders', path: '/dashboard/orders' },
  { icon: Users, label: 'Customers', path: '/dashboard/customers' },
  { icon: Tag, label: 'Discounts', path: '/dashboard/discounts' },
  { icon: Truck, label: 'Shipping', path: '/dashboard/shipping' },
  { icon: Puzzle, label: 'Extensions', path: '/dashboard/extensions' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export default function DashboardSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2">
          <BeeLogo size="md" showText />
        </Link>
      </div>

      <StoreSwitcher />

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
              location.pathname === item.path
                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
