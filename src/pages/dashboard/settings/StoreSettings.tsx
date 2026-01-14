/**
 * ============================================================================
 * STORE SETTINGS PAGE
 * ============================================================================
 * 
 * Manage store information, branding, contact details, and domain settings.
 * 
 * ============================================================================
 */

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Store, Loader2, ExternalLink, Globe, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

const settingsSchema = z.object({
  name: z.string().min(2, 'Store name must be at least 2 characters').max(50),
  description: z.string().max(500).optional(),
  logo_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  banner_url: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  email: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  address: z.string().max(200).optional(),
  city: z.string().max(50).optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

interface StoreWithDomain {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  status: string;
  subdomain: string | null;
  custom_domain: string | null;
  domain_type: string | null;
  domain_verified: boolean | null;
}

export default function StoreSettings() {
  const { currentStore, refreshStores, setCurrentStore } = useStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [storeDetails, setStoreDetails] = useState<StoreWithDomain | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      description: '',
      logo_url: '',
      banner_url: '',
      email: '',
      phone: '',
      address: '',
      city: '',
    },
  });

  useEffect(() => {
    if (currentStore) {
      form.reset({
        name: currentStore.name,
        description: currentStore.description || '',
        logo_url: currentStore.logo_url || '',
        banner_url: '',
        email: '',
        phone: '',
        address: '',
        city: '',
      });
      fetchFullStoreDetails();
    }
  }, [currentStore]);

  const fetchFullStoreDetails = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('id', currentStore.id)
        .single();

      if (error) throw error;

      if (data) {
        setStoreDetails(data as unknown as StoreWithDomain);
        form.reset({
          name: data.name,
          description: data.description || '',
          logo_url: data.logo_url || '',
          banner_url: data.banner_url || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
        });
      }
    } catch (error: any) {
      console.error('Error fetching store details:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: SettingsFormValues) => {
    if (!currentStore) {
      toast.error('No store selected');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: values.name,
          description: values.description || null,
          logo_url: values.logo_url || null,
          banner_url: values.banner_url || null,
          email: values.email || null,
          phone: values.phone || null,
          address: values.address || null,
          city: values.city || null,
        })
        .eq('id', currentStore.id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Settings saved successfully');
      await refreshStores();
      if (data) {
        setCurrentStore(data);
      }
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(label);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending Approval</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Please select or create a store first.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Generate URLs
  const pathBasedUrl = `https://extendbee.com/store/${storeDetails?.slug || currentStore.slug}`;
  const subdomainUrl = `https://${storeDetails?.subdomain || storeDetails?.slug || currentStore.slug}.extendbee.com`;
  const isSubdomainActive = storeDetails?.domain_verified === true;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Store Settings</h1>
          <p className="text-muted-foreground">Manage your store information</p>
        </div>
        {getStatusBadge(currentStore.status)}
      </div>

      {/* Domain Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Store Domain
          </CardTitle>
          <CardDescription>Your store's web addresses and domain settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Default Path-based URL */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Default URL</label>
            <div className="flex items-center gap-2">
              <Input 
                value={pathBasedUrl}
                readOnly 
                className="bg-muted font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(pathBasedUrl, 'default')}
              >
                {copiedUrl === 'default' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              <a href={pathBasedUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              This URL always works and requires no additional setup.
            </p>
          </div>

          <Separator />

          {/* Subdomain URL */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Subdomain URL</label>
              {isSubdomainActive ? (
                <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">Not Configured</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input 
                value={subdomainUrl}
                readOnly 
                className="bg-muted font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(subdomainUrl, 'subdomain')}
              >
                {copiedUrl === 'subdomain' ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
              {isSubdomainActive && (
                <a href={subdomainUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="icon">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
            {!isSubdomainActive && (
              <p className="text-xs text-muted-foreground">
                Contact support to activate your custom subdomain for a cleaner URL.
              </p>
            )}
          </div>

          <Separator />

          {/* Custom Domain (Coming Soon) */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Custom Domain</label>
              <Badge variant="outline">Coming Soon</Badge>
            </div>
            <Input 
              placeholder="yourdomain.com" 
              disabled 
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">
              Connect your own domain in a future update.
            </p>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update your store's basic details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My Store" {...field} />
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
                        placeholder="Tell customers about your store..."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="logo_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="banner_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Banner URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/banner.png" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
              <CardDescription>How customers can reach you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="store@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+977 98XXXXXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="Kathmandu" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="123 Main Street" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
