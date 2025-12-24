import { Link, useLocation } from 'react-router-dom';
import { Shield, LayoutDashboard, Store, Users, BarChart3, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Store, label: 'Stores', path: '/admin/stores' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: BarChart3, label: 'Analytics', path: '/admin/analytics' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export default function SuperAdminSidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-sidebar border-r border-sidebar-border flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-gradient-accent rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-accent-foreground" />
          </div>
          <div>
            <span className="text-lg font-bold text-sidebar-foreground">Admin</span>
            <p className="text-xs text-sidebar-foreground/60">Super Admin Panel</p>
          </div>
        </div>
      </div>

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

      <div className="p-4 border-t border-sidebar-border">
        <Link to="/dashboard" className="text-sm text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors">
          ← Back to Dashboard
        </Link>
      </div>
    </aside>
  );
}
