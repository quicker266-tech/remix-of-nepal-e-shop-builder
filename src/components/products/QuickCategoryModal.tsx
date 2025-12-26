import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

interface CategoryAttribute {
  name: string;
  type: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

interface QuickCategoryModalProps {
  storeId: string;
  onCategoryCreated: (categoryId: string, categoryName: string) => void;
}

export default function QuickCategoryModal({ storeId, onCategoryCreated }: QuickCategoryModalProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [attributes, setAttributes] = useState<CategoryAttribute[]>([]);
  const [newAttrName, setNewAttrName] = useState('');
  const [newAttrType, setNewAttrType] = useState<'text' | 'select'>('text');
  const [newAttrOptions, setNewAttrOptions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  };

  const addAttribute = () => {
    if (!newAttrName.trim()) return;

    const attr: CategoryAttribute = {
      name: newAttrName.trim(),
      type: newAttrType,
      required: false,
    };

    if (newAttrType === 'select' && newAttrOptions.trim()) {
      attr.options = newAttrOptions.split(',').map(o => o.trim()).filter(Boolean);
    }

    setAttributes([...attributes, attr]);
    setNewAttrName('');
    setNewAttrType('text');
    setNewAttrOptions('');
  };

  const removeAttribute = (index: number) => {
    setAttributes(attributes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('categories')
        .insert({
          store_id: storeId,
          name: name.trim(),
          slug: generateSlug(name),
          description: description || null,
          attribute_template: attributes as unknown as Json,
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Category created');
      onCategoryCreated(data.id, data.name);
      
      // Reset form
      setName('');
      setDescription('');
      setAttributes([]);
      setOpen(false);
    } catch (error: any) {
      console.error('Error creating category:', error);
      toast.error(error.message || 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" type="button">
          <Plus className="w-4 h-4 mr-1" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Category</DialogTitle>
          <DialogDescription>
            Quickly create a new category with optional attribute templates
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Category Name</Label>
            <Input
              id="name"
              placeholder="e.g., T-Shirts, Shoes, Electronics"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this category"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Attribute Templates</Label>
            <p className="text-sm text-muted-foreground">
              Define attributes like Size, Color that products in this category should have
            </p>

            {attributes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attributes.map((attr, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {attr.name}
                    {attr.type === 'select' && attr.options && (
                      <span className="text-xs opacity-70">
                        ({attr.options.length} options)
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttribute(index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Attribute Name</Label>
                  <Input
                    placeholder="e.g., Size"
                    value={newAttrName}
                    onChange={(e) => setNewAttrName(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">Type</Label>
                  <select
                    className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
                    value={newAttrType}
                    onChange={(e) => setNewAttrType(e.target.value as 'text' | 'select')}
                  >
                    <option value="text">Text Input</option>
                    <option value="select">Dropdown</option>
                  </select>
                </div>
              </div>

              {newAttrType === 'select' && (
                <div>
                  <Label className="text-xs">Options (comma-separated)</Label>
                  <Input
                    placeholder="S, M, L, XL"
                    value={newAttrOptions}
                    onChange={(e) => setNewAttrOptions(e.target.value)}
                    className="h-9"
                  />
                </div>
              )}

              <Button 
                type="button" 
                variant="secondary" 
                size="sm" 
                onClick={addAttribute}
                disabled={!newAttrName.trim()}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Attribute
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Category'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
