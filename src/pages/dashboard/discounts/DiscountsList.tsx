import { useEffect, useState } from 'react';
import { Plus, Tag, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';

type DiscountCode = Tables<'discount_codes'>;

export default function DiscountsList() {
  const { currentStore } = useStore();
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState<DiscountCode | null>(null);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    minimum_amount: '',
    max_uses: '',
    is_active: true,
  });

  const fetchDiscounts = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscounts(data || []);
    } catch (error: any) {
      console.error('Error fetching discounts:', error);
      toast.error('Failed to load discounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, [currentStore]);

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      minimum_amount: '',
      max_uses: '',
      is_active: true,
    });
    setEditingDiscount(null);
  };

  const openEditDialog = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      description: discount.description || '',
      discount_type: discount.discount_type,
      discount_value: String(discount.discount_value),
      minimum_amount: discount.minimum_amount ? String(discount.minimum_amount) : '',
      max_uses: discount.max_uses ? String(discount.max_uses) : '',
      is_active: discount.is_active ?? true,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentStore) return;
    if (!formData.code.trim() || !formData.discount_value) {
      toast.error('Code and discount value are required');
      return;
    }

    setIsSubmitting(true);

    try {
      const discountData = {
        store_id: currentStore.id,
        code: formData.code.toUpperCase(),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        minimum_amount: formData.minimum_amount ? parseFloat(formData.minimum_amount) : null,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        is_active: formData.is_active,
      };

      if (editingDiscount) {
        const { error } = await supabase
          .from('discount_codes')
          .update(discountData)
          .eq('id', editingDiscount.id);

        if (error) throw error;
        toast.success('Discount updated successfully');
      } else {
        const { error } = await supabase.from('discount_codes').insert(discountData);

        if (error) throw error;
        toast.success('Discount created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchDiscounts();
    } catch (error: any) {
      console.error('Error saving discount:', error);
      toast.error(error.message || 'Failed to save discount');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!discountToDelete) return;

    try {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', discountToDelete.id);

      if (error) throw error;

      toast.success('Discount deleted successfully');
      setDiscounts(discounts.filter(d => d.id !== discountToDelete.id));
    } catch (error: any) {
      console.error('Error deleting discount:', error);
      toast.error('Failed to delete discount');
    } finally {
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    }
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please select or create a store first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discounts</h1>
          <p className="text-muted-foreground">Manage your discount codes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Discount
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDiscount ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
              <DialogDescription>
                {editingDiscount ? 'Update your discount code details.' : 'Create a new discount code for your customers.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="code">Discount Code *</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="SAVE20"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="20% off on all products"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Discount Type</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (रु)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="value">Discount Value *</Label>
                  <Input
                    id="value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    placeholder={formData.discount_type === 'percentage' ? '20' : '500'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="minimum">Minimum Order Amount</Label>
                  <Input
                    id="minimum"
                    type="number"
                    value={formData.minimum_amount}
                    onChange={(e) => setFormData({ ...formData, minimum_amount: e.target.value })}
                    placeholder="1000"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">Enable this discount code</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingDiscount ? 'Update' : 'Create')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : discounts.length === 0 ? (
            <div className="text-center py-12">
              <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No discount codes yet.</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Discount
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {discounts.map((discount) => (
                  <TableRow key={discount.id}>
                    <TableCell>
                      <div>
                        <p className="font-mono font-bold">{discount.code}</p>
                        {discount.description && (
                          <p className="text-sm text-muted-foreground">{discount.description}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{discount.discount_type}</TableCell>
                    <TableCell>
                      {discount.discount_type === 'percentage' 
                        ? `${discount.discount_value}%` 
                        : `रु ${Number(discount.discount_value).toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      {discount.used_count || 0}
                      {discount.max_uses && ` / ${discount.max_uses}`}
                    </TableCell>
                    <TableCell>
                      {discount.is_active ? (
                        <Badge className="bg-success text-success-foreground">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(discount)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDiscountToDelete(discount);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
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

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Discount</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{discountToDelete?.code}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
