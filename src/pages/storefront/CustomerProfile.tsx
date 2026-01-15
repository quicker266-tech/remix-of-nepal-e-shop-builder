/**
 * ============================================================================
 * CUSTOMER PROFILE PAGE
 * ============================================================================
 * 
 * Allows customers to view and edit their profile information.
 * 
 * ============================================================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useStorefrontOptional } from '@/contexts/StorefrontContext';
import { useStoreLinksWithFallback } from '@/hooks/useStoreLinks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerProfile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
}

export default function CustomerProfile() {
  const storefrontContext = useStorefrontOptional();
  const { storeSlug: urlStoreSlug } = useParams();
  const navigate = useNavigate();
  
  const storeSlug = storefrontContext?.storeSlug || urlStoreSlug;
  const store = storefrontContext?.store;
  const links = useStoreLinksWithFallback(storeSlug || '');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CustomerProfile>({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  });

  useEffect(() => {
    fetchProfile();
  }, [store?.id]);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate(links.auth() + '?returnTo=account');
        return;
      }
      
      // Get base profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('full_name, phone')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Get customer data for this store
      let customerData = null;
      if (store?.id) {
        const { data } = await supabase
          .from('customers')
          .select('full_name, phone, address, city')
          .eq('store_id', store.id)
          .eq('user_id', user.id)
          .maybeSingle();
        customerData = data;
      }
      
      setProfile({
        full_name: customerData?.full_name || profileData?.full_name || '',
        email: user.email || '',
        phone: customerData?.phone || profileData?.phone || '',
        address: customerData?.address || '',
        city: customerData?.city || '',
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      // Update profile
      await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq('user_id', user.id);
      
      // Update customer data for this store
      if (store?.id) {
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('store_id', store.id)
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (customer) {
          await supabase
            .from('customers')
            .update({
              full_name: profile.full_name,
              phone: profile.phone,
              address: profile.address,
              city: profile.city,
            })
            .eq('id', customer.id);
        }
      }
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to={links.account()}>
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <h1 className="font-semibold">My Profile</h1>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and shipping address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Personal Info */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={profile.full_name}
                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    placeholder="+977 98XXXXXXXX"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="border-t pt-6 space-y-4">
              <h3 className="font-medium">Default Shipping Address</h3>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  placeholder="Thamel, Kathmandu"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profile.city}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="Kathmandu"
                />
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
