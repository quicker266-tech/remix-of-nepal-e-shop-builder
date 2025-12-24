import { useEffect, useState } from 'react';
import { Search, MoreHorizontal, Store as StoreIcon, CheckCircle, XCircle, Eye } from 'lucide-react';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Store {
  id: string;
  name: string;
  slug: string;
  status: string;
  owner_id: string;
  created_at: string;
  email: string | null;
  city: string | null;
}

export default function AdminStores() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    store: Store | null;
    action: 'approve' | 'suspend' | 'reactivate';
  }>({ open: false, store: null, action: 'approve' });

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStores(data || []);
    } catch (error: any) {
      console.error('Error fetching stores:', error);
      toast.error('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const updateStoreStatus = async (storeId: string, newStatus: 'active' | 'suspended') => {
    try {
      const { error } = await supabase
        .from('stores')
        .update({ status: newStatus })
        .eq('id', storeId);

      if (error) throw error;

      setStores(stores.map(s => s.id === storeId ? { ...s, status: newStatus } : s));
      toast.success(`Store ${newStatus === 'active' ? 'approved' : 'suspended'} successfully`);
    } catch (error: any) {
      console.error('Error updating store:', error);
      toast.error('Failed to update store status');
    } finally {
      setConfirmDialog({ open: false, store: null, action: 'approve' });
    }
  };

  const handleAction = (store: Store, action: 'approve' | 'suspend' | 'reactivate') => {
    setConfirmDialog({ open: true, store, action });
  };

  const confirmAction = () => {
    if (!confirmDialog.store) return;
    
    const newStatus = confirmDialog.action === 'suspend' ? 'suspended' : 'active';
    updateStoreStatus(confirmDialog.store.id, newStatus);
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

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.slug.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || store.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = stores.filter(s => s.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Stores</h1>
          <p className="text-muted-foreground">
            Manage all platform stores
            {pendingCount > 0 && (
              <span className="ml-2 text-warning">({pendingCount} pending approval)</span>
            )}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search stores..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredStores.length === 0 ? (
            <div className="text-center py-12">
              <StoreIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No stores found matching your filters.' 
                  : 'No stores registered yet.'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Store</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStores.map((store) => (
                  <TableRow key={store.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{store.name}</p>
                        {store.email && (
                          <p className="text-sm text-muted-foreground">{store.email}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {store.slug}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{store.city || '-'}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(store.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(store.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {store.status === 'pending' && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(store, 'approve')}
                              className="text-success"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {store.status === 'active' && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(store, 'suspend')}
                              className="text-destructive"
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                          )}
                          {store.status === 'suspended' && (
                            <DropdownMenuItem 
                              onClick={() => handleAction(store, 'reactivate')}
                              className="text-success"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
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
              {confirmDialog.action === 'approve' && 'Approve Store'}
              {confirmDialog.action === 'suspend' && 'Suspend Store'}
              {confirmDialog.action === 'reactivate' && 'Reactivate Store'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'approve' && 
                `Are you sure you want to approve "${confirmDialog.store?.name}"? This will make the store visible to customers.`}
              {confirmDialog.action === 'suspend' && 
                `Are you sure you want to suspend "${confirmDialog.store?.name}"? This will hide the store from customers.`}
              {confirmDialog.action === 'reactivate' && 
                `Are you sure you want to reactivate "${confirmDialog.store?.name}"? This will make the store visible again.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmAction}
              className={confirmDialog.action === 'suspend' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmDialog.action === 'approve' && 'Approve'}
              {confirmDialog.action === 'suspend' && 'Suspend'}
              {confirmDialog.action === 'reactivate' && 'Reactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
