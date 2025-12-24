import { useEffect, useState } from 'react';
import { Search, Users as UsersIcon, Shield, ShieldCheck, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  created_at: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

interface UserWithRoles extends UserProfile {
  roles: UserRole[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    user: UserWithRoles | null;
    action: 'add_admin' | 'remove_admin';
  }>({ open: false, user: null, action: 'add_admin' });

  const fetchUsers = async () => {
    try {
      const [profilesResult, rolesResult] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('user_roles').select('*'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (rolesResult.error) throw rolesResult.error;

      const profiles = profilesResult.data || [];
      const roles = rolesResult.data || [];

      const usersWithRoles: UserWithRoles[] = profiles.map(profile => ({
        ...profile,
        roles: roles.filter(r => r.user_id === profile.user_id),
      }));

      setUsers(usersWithRoles);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const addSuperAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'super_admin',
      });

      if (error) throw error;

      toast.success('Super admin role added');
      fetchUsers();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast.error('Failed to add super admin role');
    } finally {
      setConfirmDialog({ open: false, user: null, action: 'add_admin' });
    }
  };

  const removeSuperAdminRole = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'super_admin');

      if (error) throw error;

      toast.success('Super admin role removed');
      fetchUsers();
    } catch (error: any) {
      console.error('Error removing role:', error);
      toast.error('Failed to remove super admin role');
    } finally {
      setConfirmDialog({ open: false, user: null, action: 'remove_admin' });
    }
  };

  const confirmAction = () => {
    if (!confirmDialog.user) return;
    
    if (confirmDialog.action === 'add_admin') {
      addSuperAdminRole(confirmDialog.user.user_id);
    } else {
      removeSuperAdminRole(confirmDialog.user.user_id);
    }
  };

  const getRoleBadges = (roles: UserRole[]) => {
    if (roles.length === 0) {
      return <Badge variant="outline">Customer</Badge>;
    }

    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => {
          switch (role.role) {
            case 'super_admin':
              return (
                <Badge key={index} className="bg-gradient-accent text-accent-foreground">
                  <Shield className="w-3 h-3 mr-1" />
                  Super Admin
                </Badge>
              );
            case 'store_owner':
              return (
                <Badge key={index} className="bg-primary text-primary-foreground">
                  Store Owner
                </Badge>
              );
            case 'staff':
              return (
                <Badge key={index} variant="secondary">
                  Staff
                </Badge>
              );
            default:
              return (
                <Badge key={index} variant="outline">
                  {role.role}
                </Badge>
              );
          }
        })}
      </div>
    );
  };

  const isSuperAdmin = (user: UserWithRoles) => {
    return user.roles.some(r => r.role === 'super_admin');
  };

  const filteredUsers = users.filter(user =>
    user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const superAdminCount = users.filter(isSuperAdmin).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">
            Manage platform users ({superAdminCount} super admin{superAdminCount !== 1 ? 's' : ''})
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found matching your search.' : 'No users registered yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead className="w-[120px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium">{user.full_name || 'Unnamed User'}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.phone || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getRoleBadges(user.roles)}</TableCell>
                    <TableCell>
                      {isSuperAdmin(user) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, user, action: 'remove_admin' })}
                          className="text-destructive hover:text-destructive"
                        >
                          <ShieldX className="w-4 h-4 mr-1" />
                          Remove
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmDialog({ open: true, user, action: 'add_admin' })}
                        >
                          <ShieldCheck className="w-4 h-4 mr-1" />
                          Make Admin
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog({ ...confirmDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'add_admin' ? 'Add Super Admin Role' : 'Remove Super Admin Role'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'add_admin' 
                ? `Are you sure you want to make "${confirmDialog.user?.full_name || 'this user'}" a super admin? They will have full access to all platform features.`
                : `Are you sure you want to remove super admin access from "${confirmDialog.user?.full_name || 'this user'}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={confirmDialog.action === 'remove_admin' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'add_admin' ? 'Add Role' : 'Remove Role'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
