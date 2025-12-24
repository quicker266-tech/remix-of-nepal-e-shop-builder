import { useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import SuperAdminSidebar from '@/components/admin/SuperAdminSidebar';
import SuperAdminHeader from '@/components/admin/SuperAdminHeader';
import { Loader2 } from 'lucide-react';

export default function SuperAdminLayout() {
  const { user, loading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate('/auth');
      } else if (!isSuperAdmin) {
        navigate('/dashboard');
      }
    }
  }, [user, loading, isSuperAdmin, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isSuperAdmin) return null;

  return (
    <div className="min-h-screen flex bg-muted/30">
      <SuperAdminSidebar />
      <div className="flex-1 flex flex-col ml-64">
        <SuperAdminHeader />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
