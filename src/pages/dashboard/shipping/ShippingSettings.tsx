import { useEffect, useState } from 'react';
import { Truck, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

interface ShippingZone {
  id: string;
  name: string;
  rate: number;
  cities: string[];
}

interface ShippingSettings {
  enable_shipping: boolean;
  free_shipping_threshold: number | null;
  default_shipping_rate: number;
  shipping_zones: ShippingZone[];
}

export default function ShippingSettingsPage() {
  const { currentStore } = useStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<ShippingSettings>({
    enable_shipping: true,
    free_shipping_threshold: null,
    default_shipping_rate: 100,
    shipping_zones: [],
  });

  useEffect(() => {
    if (currentStore?.id) {
      fetchSettings();
    }
  }, [currentStore?.id]);

  const fetchSettings = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('store_shipping_settings')
        .select('*')
        .eq('store_id', currentStore.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          enable_shipping: data.enable_shipping ?? true,
          free_shipping_threshold: data.free_shipping_threshold,
          default_shipping_rate: data.default_shipping_rate ?? 100,
          shipping_zones: (data.shipping_zones as unknown as ShippingZone[]) || [],
        });
      }
    } catch (error: any) {
      console.error('Error fetching shipping settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!currentStore) return;

    setSaving(true);

    try {
      const { data: existing } = await supabase
        .from('store_shipping_settings')
        .select('id')
        .eq('store_id', currentStore.id)
        .maybeSingle();

      const payload = {
        store_id: currentStore.id,
        enable_shipping: settings.enable_shipping,
        free_shipping_threshold: settings.free_shipping_threshold,
        default_shipping_rate: settings.default_shipping_rate,
        shipping_zones: settings.shipping_zones as unknown as import('@/integrations/supabase/types').Json,
      };

      if (existing) {
        const { error } = await supabase
          .from('store_shipping_settings')
          .update({
            enable_shipping: payload.enable_shipping,
            free_shipping_threshold: payload.free_shipping_threshold,
            default_shipping_rate: payload.default_shipping_rate,
            shipping_zones: payload.shipping_zones,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_shipping_settings')
          .insert({
            store_id: payload.store_id,
            enable_shipping: payload.enable_shipping,
            free_shipping_threshold: payload.free_shipping_threshold,
            default_shipping_rate: payload.default_shipping_rate,
            shipping_zones: payload.shipping_zones,
          });

        if (error) throw error;
      }

      toast.success('Shipping settings saved');
    } catch (error: any) {
      console.error('Error saving shipping settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const addZone = () => {
    setSettings(prev => ({
      ...prev,
      shipping_zones: [
        ...prev.shipping_zones,
        { id: crypto.randomUUID(), name: '', rate: 0, cities: [] }
      ]
    }));
  };

  const updateZone = (id: string, updates: Partial<ShippingZone>) => {
    setSettings(prev => ({
      ...prev,
      shipping_zones: prev.shipping_zones.map(zone =>
        zone.id === id ? { ...zone, ...updates } : zone
      )
    }));
  };

  const removeZone = (id: string) => {
    setSettings(prev => ({
      ...prev,
      shipping_zones: prev.shipping_zones.filter(zone => zone.id !== id)
    }));
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Truck className="w-6 h-6" />
          Shipping Settings
        </h1>
        <p className="text-muted-foreground">
          Configure delivery charges for your store
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Shipping</CardTitle>
          <CardDescription>Enable and configure basic shipping options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Shipping</Label>
              <p className="text-sm text-muted-foreground">
                Charge customers for delivery
              </p>
            </div>
            <Switch
              checked={settings.enable_shipping}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enable_shipping: checked }))}
            />
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="default_rate">Default Shipping Rate (रु)</Label>
              <Input
                id="default_rate"
                type="number"
                min="0"
                value={settings.default_shipping_rate}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  default_shipping_rate: parseFloat(e.target.value) || 0 
                }))}
                placeholder="100"
              />
              <p className="text-xs text-muted-foreground">
                Applied when no zone matches
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_threshold">Free Shipping Threshold (रु)</Label>
              <Input
                id="free_threshold"
                type="number"
                min="0"
                value={settings.free_shipping_threshold || ''}
                onChange={(e) => setSettings(prev => ({ 
                  ...prev, 
                  free_shipping_threshold: e.target.value ? parseFloat(e.target.value) : null 
                }))}
                placeholder="1000"
              />
              <p className="text-xs text-muted-foreground">
                Free shipping for orders above this amount
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Shipping Zones</CardTitle>
              <CardDescription>Set different rates for different areas</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={addZone}>
              <Plus className="w-4 h-4 mr-2" />
              Add Zone
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings.shipping_zones.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No shipping zones configured</p>
              <p className="text-sm">Default rate will be applied to all orders</p>
            </div>
          ) : (
            settings.shipping_zones.map((zone, index) => (
              <div key={zone.id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Zone {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeZone(zone.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Zone Name</Label>
                    <Input
                      value={zone.name}
                      onChange={(e) => updateZone(zone.id, { name: e.target.value })}
                      placeholder="e.g., Kathmandu Valley"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Shipping Rate (रु)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={zone.rate}
                      onChange={(e) => updateZone(zone.id, { rate: parseFloat(e.target.value) || 0 })}
                      placeholder="100"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Cities (comma separated)</Label>
                  <Input
                    value={zone.cities.join(', ')}
                    onChange={(e) => updateZone(zone.id, { 
                      cities: e.target.value.split(',').map(c => c.trim()).filter(Boolean) 
                    })}
                    placeholder="Kathmandu, Lalitpur, Bhaktapur"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </div>
  );
}