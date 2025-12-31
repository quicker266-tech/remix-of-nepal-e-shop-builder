import { useEffect, useState } from 'react';
import { 
  BarChart3, MessageCircle, Bell, Package, Mail, 
  Puzzle, Loader2, Settings, Check, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

interface Extension {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  category: 'analytics' | 'communication' | 'marketing' | 'operations';
  configFields?: { key: string; label: string; placeholder?: string; type?: string }[];
}

interface StoreExtension {
  id: string;
  extension_id: string;
  is_enabled: boolean;
  config: Record<string, any>;
}

const AVAILABLE_EXTENSIONS: Extension[] = [
  {
    id: 'google_analytics',
    name: 'Google Analytics',
    description: 'Track visitor behavior and website traffic with Google Analytics 4.',
    icon: BarChart3,
    category: 'analytics',
    configFields: [
      { key: 'measurement_id', label: 'Measurement ID', placeholder: 'G-XXXXXXXXXX' }
    ]
  },
  {
    id: 'facebook_pixel',
    name: 'Facebook Pixel',
    description: 'Track conversions and optimize your Facebook ads.',
    icon: BarChart3,
    category: 'analytics',
    configFields: [
      { key: 'pixel_id', label: 'Pixel ID', placeholder: '1234567890' }
    ]
  },
  {
    id: 'whatsapp_chat',
    name: 'WhatsApp Chat',
    description: 'Add a WhatsApp chat button for instant customer support.',
    icon: MessageCircle,
    category: 'communication',
    configFields: [
      { key: 'phone_number', label: 'Phone Number', placeholder: '+9779812345678' },
      { key: 'default_message', label: 'Default Message', placeholder: 'Hello! I have a question.' }
    ]
  },
  {
    id: 'sms_notifications',
    name: 'SMS Notifications',
    description: 'Send SMS alerts to customers for order updates.',
    icon: Bell,
    category: 'communication',
    configFields: [
      { key: 'api_key', label: 'SMS API Key', type: 'password' }
    ]
  },
  {
    id: 'inventory_alerts',
    name: 'Inventory Alerts',
    description: 'Get notified when products are running low in stock.',
    icon: Package,
    category: 'operations',
    configFields: [
      { key: 'threshold', label: 'Low Stock Threshold', placeholder: '5', type: 'number' },
      { key: 'email', label: 'Alert Email', placeholder: 'alerts@store.com' }
    ]
  },
  {
    id: 'email_marketing',
    name: 'Email Marketing',
    description: 'Connect your email marketing service for newsletters.',
    icon: Mail,
    category: 'marketing',
    configFields: [
      { key: 'provider', label: 'Provider', placeholder: 'mailchimp' },
      { key: 'api_key', label: 'API Key', type: 'password' }
    ]
  },
];

const categoryLabels: Record<string, string> = {
  analytics: 'Analytics & Tracking',
  communication: 'Communication',
  marketing: 'Marketing',
  operations: 'Operations',
};

export default function ExtensionsList() {
  const { currentStore } = useStore();
  const [storeExtensions, setStoreExtensions] = useState<StoreExtension[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingExtension, setSavingExtension] = useState<string | null>(null);
  const [configDialogOpen, setConfigDialogOpen] = useState<string | null>(null);
  const [configValues, setConfigValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (currentStore?.id) {
      fetchExtensions();
    }
  }, [currentStore?.id]);

  const fetchExtensions = async () => {
    if (!currentStore) return;

    try {
      const { data, error } = await supabase
        .from('store_extensions')
        .select('*')
        .eq('store_id', currentStore.id);

      if (error) throw error;
      setStoreExtensions((data || []).map(d => ({
        id: d.id,
        extension_id: d.extension_id,
        is_enabled: d.is_enabled,
        config: (d.config as Record<string, any>) || {},
      })));
    } catch (error: any) {
      console.error('Error fetching extensions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getExtensionStatus = (extensionId: string): StoreExtension | undefined => {
    return storeExtensions.find(e => e.extension_id === extensionId);
  };

  const toggleExtension = async (extensionId: string, enabled: boolean) => {
    if (!currentStore) return;

    setSavingExtension(extensionId);

    try {
      const existing = getExtensionStatus(extensionId);

      if (existing) {
        const { error } = await supabase
          .from('store_extensions')
          .update({ is_enabled: enabled })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_extensions')
          .insert({
            store_id: currentStore.id,
            extension_id: extensionId,
            is_enabled: enabled,
            config: {},
          });

        if (error) throw error;
      }

      await fetchExtensions();
      toast.success(enabled ? 'Extension enabled' : 'Extension disabled');
    } catch (error: any) {
      console.error('Error toggling extension:', error);
      toast.error('Failed to update extension');
    } finally {
      setSavingExtension(null);
    }
  };

  const openConfigDialog = (extension: Extension) => {
    const existing = getExtensionStatus(extension.id);
    setConfigValues(existing?.config || {});
    setConfigDialogOpen(extension.id);
  };

  const saveConfig = async (extensionId: string) => {
    if (!currentStore) return;

    setSavingExtension(extensionId);

    try {
      const existing = getExtensionStatus(extensionId);

      if (existing) {
        const { error } = await supabase
          .from('store_extensions')
          .update({ config: configValues })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('store_extensions')
          .insert({
            store_id: currentStore.id,
            extension_id: extensionId,
            is_enabled: true,
            config: configValues,
          });

        if (error) throw error;
      }

      await fetchExtensions();
      setConfigDialogOpen(null);
      toast.success('Configuration saved');
    } catch (error: any) {
      console.error('Error saving config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSavingExtension(null);
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedExtensions = AVAILABLE_EXTENSIONS.reduce((acc, ext) => {
    if (!acc[ext.category]) acc[ext.category] = [];
    acc[ext.category].push(ext);
    return acc;
  }, {} as Record<string, Extension[]>);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Puzzle className="w-6 h-6" />
          Extensions
        </h1>
        <p className="text-muted-foreground">
          Extend your store's functionality with integrations
        </p>
      </div>

      {Object.entries(groupedExtensions).map(([category, extensions]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground">
            {categoryLabels[category]}
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {extensions.map((extension) => {
              const status = getExtensionStatus(extension.id);
              const isEnabled = status?.is_enabled || false;
              const Icon = extension.icon;

              return (
                <Card key={extension.id} className={isEnabled ? 'border-primary/50' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isEnabled ? 'bg-primary text-primary-foreground' : 'bg-muted'
                        }`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{extension.name}</CardTitle>
                          {isEnabled && (
                            <Badge variant="secondary" className="mt-1">
                              <Check className="w-3 h-3 mr-1" /> Active
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={(checked) => toggleExtension(extension.id, checked)}
                        disabled={savingExtension === extension.id}
                      />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="mb-4">
                      {extension.description}
                    </CardDescription>
                    {extension.configFields && extension.configFields.length > 0 && (
                      <Dialog 
                        open={configDialogOpen === extension.id} 
                        onOpenChange={(open) => !open && setConfigDialogOpen(null)}
                      >
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => openConfigDialog(extension)}
                          >
                            <Settings className="w-4 h-4 mr-2" />
                            Configure
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Configure {extension.name}</DialogTitle>
                            <DialogDescription>
                              Enter your configuration details below
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            {extension.configFields.map((field) => (
                              <div key={field.key} className="space-y-2">
                                <Label htmlFor={field.key}>{field.label}</Label>
                                <Input
                                  id={field.key}
                                  type={field.type || 'text'}
                                  placeholder={field.placeholder}
                                  value={configValues[field.key] || ''}
                                  onChange={(e) => setConfigValues(prev => ({
                                    ...prev,
                                    [field.key]: e.target.value
                                  }))}
                                />
                              </div>
                            ))}
                            <Button 
                              className="w-full" 
                              onClick={() => saveConfig(extension.id)}
                              disabled={savingExtension === extension.id}
                            >
                              {savingExtension === extension.id && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              )}
                              Save Configuration
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}