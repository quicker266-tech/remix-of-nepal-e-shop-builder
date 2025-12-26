import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface AttributeDefinition {
  name: string;
  type: 'select' | 'text' | 'number';
  options?: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number | null;
  store_id: string;
  attribute_template: Json;
  created_at: string;
}

export default function CategoriesList() {
  const { currentStore } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    attributes: [] as AttributeDefinition[],
  });
  const [newAttribute, setNewAttribute] = useState<{ 
    name: string; 
    type: 'select' | 'text' | 'number'; 
    options: string 
  }>({ name: '', type: 'select', options: '' });

  useEffect(() => {
    if (currentStore) {
      fetchCategories();
    }
  }, [currentStore]);

  const fetchCategories = async () => {
    if (!currentStore) return;
    
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
  };

  const addAttribute = () => {
    if (!newAttribute.name) return;
    
    const attr: AttributeDefinition = {
      name: newAttribute.name,
      type: newAttribute.type,
    };
    
    if (newAttribute.type === 'select' && newAttribute.options) {
      attr.options = newAttribute.options.split(',').map(o => o.trim()).filter(Boolean);
    }
    
    setFormData(prev => ({
      ...prev,
      attributes: [...prev.attributes, attr],
    }));
    setNewAttribute({ name: '', type: 'select', options: '' });
  };

  const removeAttribute = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attributes: prev.attributes.filter((_, i) => i !== index),
    }));
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', description: '', attributes: [] });
    setIsDialogOpen(true);
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    const attrs = Array.isArray(category.attribute_template) 
      ? (category.attribute_template as unknown as AttributeDefinition[])
      : [];
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      attributes: attrs,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!currentStore || !formData.name || !formData.slug) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const categoryData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description || null,
        store_id: currentStore.id,
        attribute_template: formData.attributes as unknown as Json,
      };

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success('Category updated successfully');
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData);

        if (error) throw error;
        toast.success('Category created successfully');
      }

      setIsDialogOpen(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      toast.error(error.message || 'Failed to save category');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Category deleted successfully');
      fetchCategories();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error(error.message || 'Failed to delete category');
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
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-muted-foreground">Manage your product categories and their attributes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-background">
            <DialogHeader>
              <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
              <DialogDescription>
                Define category details and attribute templates for products
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Category Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., T-Shirts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">URL Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="t-shirts"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Category description..."
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Attribute Templates</Label>
                <p className="text-sm text-muted-foreground">
                  Define attributes that products in this category should have (e.g., Size, Color)
                </p>
                
                {formData.attributes.length > 0 && (
                  <div className="space-y-2">
                    {formData.attributes.map((attr, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                        <span className="font-medium">{attr.name}</span>
                        <Badge variant="secondary">{attr.type}</Badge>
                        {attr.options && (
                          <span className="text-sm text-muted-foreground">
                            ({attr.options.join(', ')})
                          </span>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-auto"
                          onClick={() => removeAttribute(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label className="text-xs">Attribute Name</Label>
                    <Input
                      value={newAttribute.name}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Size"
                    />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Type</Label>
                    <select
                      value={newAttribute.type}
                      onChange={(e) => setNewAttribute(prev => ({ ...prev, type: e.target.value as 'select' | 'text' | 'number' }))}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="select">Select</option>
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                    </select>
                  </div>
                  {newAttribute.type === 'select' && (
                    <div className="flex-1">
                      <Label className="text-xs">Options (comma-separated)</Label>
                      <Input
                        value={newAttribute.options}
                        onChange={(e) => setNewAttribute(prev => ({ ...prev, options: e.target.value }))}
                        placeholder="S, M, L, XL"
                      />
                    </div>
                  )}
                  <Button type="button" variant="outline" onClick={addAttribute}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingCategory ? 'Update' : 'Create'} Category
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No categories yet</p>
              <Button onClick={openCreateDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Create your first category
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Attributes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map((category) => {
                  const attrs = Array.isArray(category.attribute_template) 
                    ? (category.attribute_template as unknown as AttributeDefinition[])
                    : [];
                  return (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {attrs.map((attr, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {attr.name}
                            </Badge>
                          ))}
                          {attrs.length === 0 && (
                            <span className="text-muted-foreground text-sm">No attributes</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
