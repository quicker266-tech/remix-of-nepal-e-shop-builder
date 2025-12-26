import { useState, useEffect } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, Json } from '@/integrations/supabase/types';

type ProductVariant = Tables<'product_variants'>;

interface CategoryAttribute {
  name: string;
  type: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

interface ProductVariantsSectionProps {
  productId?: string;
  categoryId?: string | null;
  categoryAttributes?: CategoryAttribute[];
  basePrice: number;
  onVariantsChange?: (hasVariants: boolean) => void;
}

interface NewVariant {
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  attributes: Record<string, string>;
}

export default function ProductVariantsSection({
  productId,
  categoryId,
  categoryAttributes = [],
  basePrice,
  onVariantsChange,
}: ProductVariantsSectionProps) {
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>({
    name: '',
    sku: '',
    price: basePrice,
    stock_quantity: 0,
    attributes: {},
  });

  useEffect(() => {
    if (productId) {
      fetchVariants();
    }
  }, [productId]);

  useEffect(() => {
    setNewVariant(prev => ({ ...prev, price: basePrice }));
  }, [basePrice]);

  useEffect(() => {
    onVariantsChange?.(variants.length > 0);
  }, [variants, onVariantsChange]);

  const fetchVariants = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      setVariants(data || []);
    } catch (error: any) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVariant = async () => {
    if (!productId) {
      toast.error('Please save the product first before adding variants');
      return;
    }

    if (!newVariant.name.trim()) {
      toast.error('Variant name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('product_variants')
        .insert({
          product_id: productId,
          name: newVariant.name,
          sku: newVariant.sku || null,
          price: newVariant.price,
          stock_quantity: newVariant.stock_quantity,
          attributes: newVariant.attributes as Json,
        })
        .select()
        .single();

      if (error) throw error;

      setVariants([...variants, data]);
      setNewVariant({
        name: '',
        sku: '',
        price: basePrice,
        stock_quantity: 0,
        attributes: {},
      });
      setIsAddingVariant(false);
      toast.success('Variant added');
    } catch (error: any) {
      console.error('Error adding variant:', error);
      toast.error(error.message || 'Failed to add variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', variantId);

      if (error) throw error;

      setVariants(variants.filter(v => v.id !== variantId));
      toast.success('Variant deleted');
    } catch (error: any) {
      console.error('Error deleting variant:', error);
      toast.error(error.message || 'Failed to delete variant');
    }
  };

  const handleUpdateVariant = async (variantId: string, field: string, value: any) => {
    try {
      const { error } = await supabase
        .from('product_variants')
        .update({ [field]: value })
        .eq('id', variantId);

      if (error) throw error;

      setVariants(variants.map(v => 
        v.id === variantId ? { ...v, [field]: value } : v
      ));
    } catch (error: any) {
      console.error('Error updating variant:', error);
      toast.error(error.message || 'Failed to update variant');
    }
  };

  const generateVariantName = () => {
    const attrValues = Object.values(newVariant.attributes).filter(Boolean);
    if (attrValues.length > 0) {
      return attrValues.join(' / ');
    }
    return '';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Product Variants</CardTitle>
          <CardDescription>
            Add size, color, or other variations
          </CardDescription>
        </div>
        {!isAddingVariant && productId && (
          <Button variant="outline" size="sm" onClick={() => setIsAddingVariant(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Variant
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {!productId && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Save the product first to add variants
          </p>
        )}

        {productId && isAddingVariant && (
          <div className="border rounded-lg p-4 mb-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">New Variant</h4>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsAddingVariant(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {categoryAttributes.length > 0 && (
              <div className="grid grid-cols-2 gap-3">
                {categoryAttributes.map((attr) => (
                  <div key={attr.name}>
                    <label className="text-sm font-medium mb-1 block">
                      {attr.name}
                      {attr.required && <span className="text-destructive">*</span>}
                    </label>
                    {attr.type === 'select' && attr.options ? (
                      <select
                        className="w-full h-10 px-3 py-2 rounded-md border border-input bg-background text-sm"
                        value={newVariant.attributes[attr.name] || ''}
                        onChange={(e) => {
                          const attrs = { ...newVariant.attributes, [attr.name]: e.target.value };
                          setNewVariant({ 
                            ...newVariant, 
                            attributes: attrs,
                            name: Object.values(attrs).filter(Boolean).join(' / '),
                          });
                        }}
                      >
                        <option value="">Select {attr.name}</option>
                        {attr.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <Input
                        placeholder={attr.name}
                        value={newVariant.attributes[attr.name] || ''}
                        onChange={(e) => {
                          const attrs = { ...newVariant.attributes, [attr.name]: e.target.value };
                          setNewVariant({ 
                            ...newVariant, 
                            attributes: attrs,
                            name: Object.values(attrs).filter(Boolean).join(' / '),
                          });
                        }}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Name</label>
                <Input
                  placeholder="e.g., Small / Red"
                  value={newVariant.name}
                  onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">SKU</label>
                <Input
                  placeholder="SKU-001-S"
                  value={newVariant.sku}
                  onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Price (रु)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newVariant.price}
                  onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Stock</label>
                <Input
                  type="number"
                  value={newVariant.stock_quantity}
                  onChange={(e) => setNewVariant({ ...newVariant, stock_quantity: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddingVariant(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddVariant}>
                Add Variant
              </Button>
            </div>
          </div>
        )}

        {productId && variants.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {variants.map((variant) => (
                <TableRow key={variant.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{variant.name}</span>
                      {variant.attributes && Object.keys(variant.attributes as Record<string, string>).length > 0 && (
                        <div className="flex gap-1">
                          {Object.entries(variant.attributes as Record<string, string>).map(([key, value]) => (
                            <Badge key={key} variant="secondary" className="text-xs">
                              {value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      className="w-24 h-8"
                      value={variant.sku || ''}
                      onChange={(e) => handleUpdateVariant(variant.id, 'sku', e.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-24 h-8"
                      value={variant.price}
                      onChange={(e) => handleUpdateVariant(variant.id, 'price', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      className="w-20 h-8"
                      value={variant.stock_quantity}
                      onChange={(e) => handleUpdateVariant(variant.id, 'stock_quantity', Number(e.target.value))}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteVariant(variant.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {productId && variants.length === 0 && !isAddingVariant && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No variants added yet. Click "Add Variant" to create size/color options.
          </p>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
