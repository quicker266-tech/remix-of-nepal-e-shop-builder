/**
 * ============================================================================
 * HEADER & FOOTER EDITOR
 * ============================================================================
 * 
 * Combined editor for header and footer configuration.
 * Uses tabs to switch between settings for each.
 * 
 * Features:
 * - Header: Layout, sticky, show/hide icons, colors
 * - Footer: Layout, social links, newsletter toggle, copyright
 * 
 * ============================================================================
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { StoreHeaderFooter, HeaderConfig, FooterConfig, SocialLinks } from '../types';
import { Layout, Menu } from 'lucide-react';

interface HeaderFooterEditorProps {
  storeId: string;
  config: StoreHeaderFooter | null;
  onUpdate: (updates: Partial<StoreHeaderFooter>) => void;
}

export function HeaderFooterEditor({ storeId, config, onUpdate }: HeaderFooterEditorProps) {
  if (!config) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        <p className="text-sm">Loading configuration...</p>
      </div>
    );
  }

  const headerConfig = config.header_config || {
    layout: 'logo-center',
    sticky: true,
    showSearch: true,
    showCart: true,
    showAccount: false,
  };

  const footerConfig = config.footer_config || {
    layout: 'multi-column',
    showNewsletter: true,
    showSocialLinks: true,
    showPaymentIcons: true,
    columns: [],
  };

  const socialLinks = config.social_links || {};

  const updateHeader = (updates: Partial<HeaderConfig>) => {
    onUpdate({
      header_config: { ...headerConfig, ...updates },
    });
  };

  const updateFooter = (updates: Partial<FooterConfig>) => {
    onUpdate({
      footer_config: { ...footerConfig, ...updates },
    });
  };

  const updateSocial = (updates: Partial<SocialLinks>) => {
    onUpdate({
      social_links: { ...socialLinks, ...updates },
    });
  };

  return (
    <div className="p-4">
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="header" className="flex items-center gap-2">
            <Menu className="h-4 w-4" />
            Header
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Footer
          </TabsTrigger>
        </TabsList>

        {/* Header Configuration */}
        <TabsContent value="header" className="space-y-6">
          <HeaderConfigForm config={headerConfig} onUpdate={updateHeader} />
        </TabsContent>

        {/* Footer Configuration */}
        <TabsContent value="footer" className="space-y-6">
          <FooterConfigForm
            config={footerConfig}
            socialLinks={socialLinks}
            onUpdateConfig={updateFooter}
            onUpdateSocial={updateSocial}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =============================================================================
// HEADER CONFIG FORM
// =============================================================================

interface HeaderConfigFormProps {
  config: HeaderConfig;
  onUpdate: (updates: Partial<HeaderConfig>) => void;
}

function HeaderConfigForm({ config, onUpdate }: HeaderConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Layout Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Logo Position</Label>
        <RadioGroup
          value={config.layout}
          onValueChange={(value) => onUpdate({ layout: value as HeaderConfig['layout'] })}
          className="flex gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="logo-left" id="logo-left" />
            <Label htmlFor="logo-left" className="cursor-pointer text-sm">Left</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="logo-center" id="logo-center" />
            <Label htmlFor="logo-center" className="cursor-pointer text-sm">Center</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="logo-right" id="logo-right" />
            <Label htmlFor="logo-right" className="cursor-pointer text-sm">Right</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Feature Toggles */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Features</Label>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="sticky" className="text-sm cursor-pointer">Sticky Header</Label>
          <Switch
            id="sticky"
            checked={config.sticky}
            onCheckedChange={(checked) => onUpdate({ sticky: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showSearch" className="text-sm cursor-pointer">Show Search</Label>
          <Switch
            id="showSearch"
            checked={config.showSearch}
            onCheckedChange={(checked) => onUpdate({ showSearch: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showCart" className="text-sm cursor-pointer">Show Cart Icon</Label>
          <Switch
            id="showCart"
            checked={config.showCart}
            onCheckedChange={(checked) => onUpdate({ showCart: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showAccount" className="text-sm cursor-pointer">Show Account Icon</Label>
          <Switch
            id="showAccount"
            checked={config.showAccount}
            onCheckedChange={(checked) => onUpdate({ showAccount: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Colors */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Colors (Optional)</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="headerBg" className="text-xs text-muted-foreground">Background</Label>
            <Input
              id="headerBg"
              type="text"
              placeholder="#ffffff"
              value={config.backgroundColor || ''}
              onChange={(e) => onUpdate({ backgroundColor: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="headerText" className="text-xs text-muted-foreground">Text Color</Label>
            <Input
              id="headerText"
              type="text"
              placeholder="#000000"
              value={config.textColor || ''}
              onChange={(e) => onUpdate({ textColor: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// FOOTER CONFIG FORM
// =============================================================================

interface FooterConfigFormProps {
  config: FooterConfig;
  socialLinks: SocialLinks;
  onUpdateConfig: (updates: Partial<FooterConfig>) => void;
  onUpdateSocial: (updates: Partial<SocialLinks>) => void;
}

function FooterConfigForm({ config, socialLinks, onUpdateConfig, onUpdateSocial }: FooterConfigFormProps) {
  return (
    <div className="space-y-6">
      {/* Layout Selection */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Footer Layout</Label>
        <RadioGroup
          value={config.layout}
          onValueChange={(value) => onUpdateConfig({ layout: value as FooterConfig['layout'] })}
          className="flex gap-2"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="simple" id="footer-simple" />
            <Label htmlFor="footer-simple" className="cursor-pointer text-sm">Simple</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="minimal" id="footer-minimal" />
            <Label htmlFor="footer-minimal" className="cursor-pointer text-sm">Minimal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="multi-column" id="footer-multi" />
            <Label htmlFor="footer-multi" className="cursor-pointer text-sm">Multi-column</Label>
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Feature Toggles */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Features</Label>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="showSocialLinks" className="text-sm cursor-pointer">Show Social Links</Label>
          <Switch
            id="showSocialLinks"
            checked={config.showSocialLinks}
            onCheckedChange={(checked) => onUpdateConfig({ showSocialLinks: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showNewsletter" className="text-sm cursor-pointer">Show Newsletter</Label>
          <Switch
            id="showNewsletter"
            checked={config.showNewsletter}
            onCheckedChange={(checked) => onUpdateConfig({ showNewsletter: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="showPaymentIcons" className="text-sm cursor-pointer">Show Payment Icons</Label>
          <Switch
            id="showPaymentIcons"
            checked={config.showPaymentIcons}
            onCheckedChange={(checked) => onUpdateConfig({ showPaymentIcons: checked })}
          />
        </div>
      </div>

      <Separator />

      {/* Social Media Links */}
      {config.showSocialLinks && (
        <>
          <div className="space-y-4">
            <Label className="text-sm font-medium">Social Media URLs</Label>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook</Label>
                <Input
                  id="facebook"
                  type="url"
                  placeholder="https://facebook.com/yourpage"
                  value={socialLinks.facebook || ''}
                  onChange={(e) => onUpdateSocial({ facebook: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                <Input
                  id="instagram"
                  type="url"
                  placeholder="https://instagram.com/yourpage"
                  value={socialLinks.instagram || ''}
                  onChange={(e) => onUpdateSocial({ instagram: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter / X</Label>
                <Input
                  id="twitter"
                  type="url"
                  placeholder="https://twitter.com/yourhandle"
                  value={socialLinks.twitter || ''}
                  onChange={(e) => onUpdateSocial({ twitter: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tiktok" className="text-xs text-muted-foreground">TikTok</Label>
                <Input
                  id="tiktok"
                  type="url"
                  placeholder="https://tiktok.com/@yourhandle"
                  value={socialLinks.tiktok || ''}
                  onChange={(e) => onUpdateSocial({ tiktok: e.target.value || undefined })}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="youtube" className="text-xs text-muted-foreground">YouTube</Label>
                <Input
                  id="youtube"
                  type="url"
                  placeholder="https://youtube.com/@yourchannel"
                  value={socialLinks.youtube || ''}
                  onChange={(e) => onUpdateSocial({ youtube: e.target.value || undefined })}
                />
              </div>
            </div>
          </div>

          <Separator />
        </>
      )}

      {/* Copyright Text */}
      <div className="space-y-2">
        <Label htmlFor="copyright" className="text-sm font-medium">Copyright Text</Label>
        <Input
          id="copyright"
          type="text"
          placeholder="© 2026 Your Store. All rights reserved."
          value={config.copyrightText || ''}
          onChange={(e) => onUpdateConfig({ copyrightText: e.target.value || undefined })}
        />
      </div>

      {/* Colors */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Colors (Optional)</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="footerBg" className="text-xs text-muted-foreground">Background</Label>
            <Input
              id="footerBg"
              type="text"
              placeholder="#1f2937"
              value={config.backgroundColor || ''}
              onChange={(e) => onUpdateConfig({ backgroundColor: e.target.value || undefined })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="footerText" className="text-xs text-muted-foreground">Text Color</Label>
            <Input
              id="footerText"
              type="text"
              placeholder="#ffffff"
              value={config.textColor || ''}
              onChange={(e) => onUpdateConfig({ textColor: e.target.value || undefined })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeaderFooterEditor;
