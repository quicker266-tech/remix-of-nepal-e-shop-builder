import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

const storeSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters').max(50, 'Store name must be less than 50 characters'),
  slug: z.string().min(2, 'Slug must be at least 2 characters').max(30, 'Slug must be less than 30 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
});

type StoreFormValues = z.infer<typeof storeSchema>;

export default function CreateStore() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshStores, setCurrentStore } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<StoreFormValues>({
    resolver: zodResolver(storeSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      logo_url: '',
    },
  });

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 30);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue('name', name);
    
    // Auto-generate slug if slug field is empty or was auto-generated
    const currentSlug = form.getValues('slug');
    const expectedSlug = generateSlug(form.getValues('name').slice(0, -1) + name.slice(-1));
    if (!currentSlug || currentSlug === generateSlug(form.getValues('name'))) {
      form.setValue('slug', generateSlug(name));
    }
  };

  const onSubmit = async (values: StoreFormValues) => {
    if (!user) {
      toast.error('You must be logged in to create a store');
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if slug is unique
      const { data: existingStore } = await supabase
        .from('stores')
        .select('id')
        .eq('slug', values.slug)
        .single();

      if (existingStore) {
        form.setError('slug', { message: 'This slug is already taken. Please choose another.' });
        setIsSubmitting(false);
        return;
      }

      // Create the store
      const { data: newStore, error } = await supabase
        .from('stores')
        .insert({
          name: values.name,
          slug: values.slug,
          description: values.description || null,
          logo_url: values.logo_url || null,
          owner_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Store created successfully!');
      await refreshStores();
      setCurrentStore(newStore);
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast.error(error.message || 'Failed to create store');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Create Your Store</CardTitle>
          <CardDescription>
            Set up your online store in minutes. Fill in the details below to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="My Awesome Store" 
                        {...field}
                        onChange={handleNameChange}
                      />
                    </FormControl>
                    <FormDescription>
                      This is your store's display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store URL</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground mr-2">pasalhub.com/</span>
                        <Input placeholder="my-store" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This will be your store's unique URL. Only lowercase letters, numbers, and hyphens.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell customers what your store is all about..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A brief description of your store and what you sell.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="https://example.com/logo.png" 
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Enter a URL for your store's logo image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Store
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
