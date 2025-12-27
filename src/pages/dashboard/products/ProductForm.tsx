/**
 * ============================================================================
 * PRODUCT FORM PAGE
 * ============================================================================
 * 
 * Create and edit products for the store.
 * Handles all product properties including images, pricing, inventory, and SEO.
 * 
 * ARCHITECTURE:
 * - Uses react-hook-form with Zod validation
 * - Fetches categories for organization
 * - Supports product variants via ProductVariantsSection
 * - Auto-generates URL slug from product name
 * - Inherits category attributes for variant options
 * 
 * FORM SECTIONS:
 * 1. Basic Information: Name, slug, description
 * 2. Images: Upload via ImageUpload component
 * 3. Pricing: Price, compare-at price, cost price
 * 4. Inventory: SKU, barcode, stock quantity, tracking toggle
 * 5. Variants: Via ProductVariantsSection component
 * 6. SEO: Title and meta description
 * 7. Sidebar: Status, featured toggle, category
 * 
 * USAGE:
 * - New product: /dashboard/products/new
 * - Edit product: /dashboard/products/:id
 * 
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';
import type { Tables } from '@/integrations/supabase/types';
import ProductVariantsSection from '@/components/products/ProductVariantsSection';
import QuickCategoryModal from '@/components/products/QuickCategoryModal';
import ImageUpload from '@/components/products/ImageUpload';

type Category = Tables<'categories'>;

/**
 * Category attribute definition
 * Used for product variants based on category settings
 */
interface CategoryAttribute {
  name: string;
  type: 'text' | 'select';
  options?: string[];
  required?: boolean;
}

/**
 * Zod validation schema for product form
 * Validates all product fields with appropriate constraints
 */
const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(100),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(2000).optional(),
  sku: z.string().max(50).optional(),
  barcode: z.string().max(50).optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  compare_at_price: z.coerce.number().min(0).optional().nullable(),
  cost_price: z.coerce.number().min(0).optional().nullable(),
  stock_quantity: z.coerce.number().int().min(0, 'Stock must be positive'),
  track_inventory: z.boolean().default(true),
  category_id: z.string().optional().nullable(),
  status: z.enum(['draft', 'active', 'archived']),
  featured: z.boolean().default(false),
  seo_title: z.string().max(70).optional(),
  seo_description: z.string().max(160).optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

export default function ProductForm() {
  const navigate = useNavigate();
  const { id } = useParams(); // Product ID from URL (undefined for new products)
  const { currentStore } = useStore();
  
  // Form and loading state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(!!id); // Only show loading for edit mode
  const [categories, setCategories] = useState<Category[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [savedProductId, setSavedProductId] = useState<string | undefined>(id);
  const [categoryAttributes, setCategoryAttributes] = useState<CategoryAttribute[]>([]);

  const isEditing = !!id;

  // Initialize form with react-hook-form and Zod validation
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      sku: '',
      barcode: '',
      price: 0,
      compare_at_price: null,
      cost_price: null,
      stock_quantity: 0,
      track_inventory: true,
      category_id: null,
      status: 'draft',
      featured: false,
      seo_title: '',
      seo_description: '',
    },
  });

  // ================================================================
  // DATA FETCHING
  // ================================================================

  useEffect(() => {
    if (currentStore) {
      fetchCategories();
      if (id) {
        fetchProduct();
        setSavedProductId(id);
      }
    }
  }, [currentStore, id]);

  /**
   * Update category attributes when category changes
   * These attributes are used for variant options (e.g., Size, Color)
   */
  useEffect(() => {
    const categoryId = form.watch('category_id');
    if (categoryId && categories.length > 0) {
      const category = categories.find(c => c.id === categoryId);
      if (category?.attribute_template && Array.isArray(category.attribute_template)) {
        setCategoryAttributes(category.attribute_template as unknown as CategoryAttribute[]);
      } else {
        setCategoryAttributes([]);
      }
    } else {
      setCategoryAttributes([]);
    }
  }, [form.watch('category_id'), categories]);

  /**
   * Fetch categories for the current store
   * Used in the category selector dropdown
   */
  const fetchCategories = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('store_id', currentStore.id)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
    }
  };

  /**
   * Fetch existing product data for edit mode
   * Populates form with current product values
   */
  const fetchProduct = async () => {
    if (!currentStore || !id) return;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('store_id', currentStore.id)
        .single();

      if (error) throw error;

      if (data) {
        // Reset form with fetched data
        form.reset({
          name: data.name,
          slug: data.slug,
          description: data.description || '',
          sku: data.sku || '',
          barcode: data.barcode || '',
          price: Number(data.price),
          compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : null,
          cost_price: data.cost_price ? Number(data.cost_price) : null,
          stock_quantity: data.stock_quantity,
          track_inventory: data.track_inventory ?? true,
          category_id: data.category_id,
          status: data.status as 'draft' | 'active' | 'archived',
          featured: data.featured ?? false,
          seo_title: data.seo_title || '',
          seo_description: data.seo_description || '',
        });
        setImageUrls((data.images as string[]) || []);
      }
    } catch (error: any) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/dashboard/products');
    } finally {
      setLoading(false);
    }
  };

  // ================================================================
  // FORM HELPERS
  // ================================================================

  /**
   * Generate URL-friendly slug from product name
   * Converts to lowercase, removes special chars, replaces spaces with hyphens
   */
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100);
  };

  /**
   * Handle name input change
   * Auto-generates slug for new products
   */
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    
    // Only auto-generate slug for new products
    if (!isEditing) {
      form.setValue('slug', generateSlug(name));
    }
  };

  // ================================================================
  // FORM SUBMISSION
  // ================================================================

  /**
   * Handle form submission
   * Creates new product or updates existing one
   */
  const onSubmit = async (values: ProductFormValues) => {
    if (!currentStore) {
      toast.error('Please select a store first');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build product data object
      const productData = {
        name: values.name,
        slug: values.slug,
        description: values.description || null,
        sku: values.sku || null,
        barcode: values.barcode || null,
        price: values.price,
        compare_at_price: values.compare_at_price || null,
        cost_price: values.cost_price || null,
        stock_quantity: values.stock_quantity,
        track_inventory: values.track_inventory,
        category_id: values.category_id || null,
        status: values.status,
        featured: values.featured,
        seo_title: values.seo_title || null,
        seo_description: values.seo_description || null,
        store_id: currentStore.id,
        images: imageUrls,
      };

      if (isEditing) {
        // Update existing product
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id);

        if (error) throw error;
        toast.success('Product updated successfully');
      } else {
        // Create new product
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Product created successfully');
      }

      navigate('/dashboard/products');
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================================================================
  // LOADING AND ERROR STATES
  // ================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please select or create a store first.</p>
      </div>
    );
  }

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="space-y-6">
      {/* Page header with back button */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/products')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? 'Edit Product' : 'Add Product'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update your product details' : 'Create a new product for your store'}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ============================================================
             * MAIN CONTENT COLUMN (2/3 width)
             * ============================================================ */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Product name" 
                            {...field}
                            onChange={handleNameChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>URL Slug</FormLabel>
                        <FormControl>
                          <Input placeholder="product-url-slug" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your product..."
                            className="resize-none"
                            rows={5}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Images Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Images</CardTitle>
                  <CardDescription>Upload product images or add via URL</CardDescription>
                </CardHeader>
                <CardContent>
                  <ImageUpload
                    images={imageUrls}
                    onImagesChange={setImageUrls}
                    storeId={currentStore.id}
                    productSlug={form.watch('slug')}
                  />
                </CardContent>
              </Card>

              {/* Pricing Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Pricing</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (रु)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="compare_at_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Compare at Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>Original price for showing discounts</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cost_price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cost Price</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01" 
                              placeholder="0.00" 
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormDescription>Your cost (not visible to customers)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Inventory Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Inventory</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="sku"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SKU</FormLabel>
                          <FormControl>
                            <Input placeholder="SKU-001" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="barcode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Barcode</FormLabel>
                          <FormControl>
                            <Input placeholder="1234567890" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="stock_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stock Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="track_inventory"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-4">
                          <div>
                            <FormLabel>Track Inventory</FormLabel>
                            <FormDescription>
                              Update stock automatically on orders
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Product Variants Section */}
              <ProductVariantsSection
                productId={savedProductId}
                categoryId={form.watch('category_id')}
                categoryAttributes={categoryAttributes}
                basePrice={form.watch('price')}
              />

              {/* SEO Card */}
              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                  <CardDescription>Optimize for search engines</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="seo_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SEO Title</FormLabel>
                        <FormControl>
                          <Input placeholder="SEO optimized title" {...field} />
                        </FormControl>
                        <FormDescription>Max 70 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="seo_description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meta Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description for search engines"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Max 160 characters</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* ============================================================
             * SIDEBAR COLUMN (1/3 width)
             * ============================================================ */}
            <div className="space-y-6">
              {/* Status Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Product Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="featured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel>Featured</FormLabel>
                          <FormDescription>
                            Show in featured section
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Organization Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="category_id"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Category</FormLabel>
                          {/* Quick category creation modal */}
                          <QuickCategoryModal
                            storeId={currentStore.id}
                            onCategoryCreated={(categoryId, categoryName) => {
                              fetchCategories();
                              field.onChange(categoryId);
                            }}
                          />
                        </div>
                        <Select 
                          onValueChange={field.onChange} 
                          value={field.value || undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard/products')}
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}
