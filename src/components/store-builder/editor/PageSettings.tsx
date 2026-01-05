import { useState, useEffect, useMemo } from 'react';
import { StorePage } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Eye, 
  EyeOff, 
  Save,
  FileText,
  Image,
  Layout,
  Layers,
} from 'lucide-react';
import { SECTION_DEFINITIONS } from '../constants';
import { 
  getAllowedSectionTypes, 
  canPageHaveSections, 
  getPagePermissionInfo 
} from '../utils/sectionPermissions';

interface PageSettingsProps {
  page: StorePage;
  sectionCount: number;
  onUpdate: (pageId: string, updates: Partial<StorePage>) => void;
}

// System pages that cannot have their slug changed
const SYSTEM_PAGE_TYPES = [
  'homepage', 'cart', 'checkout', 'profile', 'order_tracking', 'search', 'product', 'category'
];

export function PageSettings({ page, sectionCount, onUpdate }: PageSettingsProps) {
  // Local state for form fields
  const [formData, setFormData] = useState({
    title: page.title,
    slug: page.slug,
    seo_title: page.seo_title || '',
    seo_description: page.seo_description || '',
    og_image_url: page.og_image_url || '',
    show_header: page.show_header,
    show_footer: page.show_footer,
    is_published: page.is_published,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Check if this is a system page (slug cannot be changed)
  const isSystemPage = SYSTEM_PAGE_TYPES.includes(page.page_type);

  // Get permission info for this page type
  const permissionInfo = useMemo(() => getPagePermissionInfo(page.page_type), [page.page_type]);
  const allowedSections = useMemo(() => getAllowedSectionTypes(page.page_type), [page.page_type]);
  const pageCanHaveSections = useMemo(() => canPageHaveSections(page.page_type), [page.page_type]);

  // Reset form when page changes
  useEffect(() => {
    setFormData({
      title: page.title,
      slug: page.slug,
      seo_title: page.seo_title || '',
      seo_description: page.seo_description || '',
      og_image_url: page.og_image_url || '',
      show_header: page.show_header,
      show_footer: page.show_footer,
      is_published: page.is_published,
    });
    setHasChanges(false);
  }, [page.id]);

  // Track changes
  const handleChange = (field: string, value: string | boolean) => {
    console.log('[Step 1B.4] Page settings changed:', { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  // Save changes
  const handleSave = () => {
    console.log('[Step 1B.4] Page settings saved:', formData);
    onUpdate(page.id, {
      title: formData.title.trim(),
      slug: formData.slug.trim(),
      seo_title: formData.seo_title.trim() || null,
      seo_description: formData.seo_description.trim() || null,
      og_image_url: formData.og_image_url.trim() || null,
      show_header: formData.show_header,
      show_footer: formData.show_footer,
      is_published: formData.is_published,
    });
    setHasChanges(false);
  };

  // Toggle handlers with immediate save
  const handleToggle = (field: 'show_header' | 'show_footer' | 'is_published', value: boolean) => {
    console.log('[Step 1B.4] Page settings updated:', { field, value });
    setFormData(prev => ({ ...prev, [field]: value }));
    onUpdate(page.id, { [field]: value });
  };

  return (
    <div className="p-4 space-y-6">
      {/* Page Info Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">Page Settings</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure SEO and visibility for this page
          </p>
        </div>
        <Badge variant={page.is_published ? 'default' : 'secondary'}>
          {page.is_published ? 'Published' : 'Draft'}
        </Badge>
      </div>

      <Separator />

      {/* Section Configuration Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Layers className="h-4 w-4" />
          Section Configuration
        </div>

        <div className="border rounded-lg p-3 bg-muted/50 space-y-3">
          <p className="text-sm text-muted-foreground">
            {permissionInfo.description}
          </p>
          
          {pageCanHaveSections ? (
            <>
              {/* Allowed section types */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Allowed sections:</p>
                {allowedSections.length > 10 ? (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    All sections available
                  </Badge>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {allowedSections.slice(0, 6).map(type => (
                      <Badge key={type} variant="secondary" className="text-xs">
                        {SECTION_DEFINITIONS[type]?.label || type}
                      </Badge>
                    ))}
                    {allowedSections.length > 6 && (
                      <Badge variant="outline" className="text-xs">
                        +{allowedSections.length - 6} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
              
              {/* Section count */}
              {permissionInfo.maxSections !== null && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Sections used:</span>
                  <span className={
                    sectionCount >= permissionInfo.maxSections 
                      ? 'text-orange-600 font-medium' 
                      : 'text-foreground'
                  }>
                    {sectionCount} / {permissionInfo.maxSections}
                  </span>
                </div>
              )}
            </>
          ) : (
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
              Functional page - no custom sections
            </Badge>
          )}
        </div>
      </div>

      <Separator />

      {/* Basic Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <FileText className="h-4 w-4" />
          Basic Information
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">Page Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter page title"
              className="h-9"
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug" className="text-xs">
              URL Slug
              {isSystemPage && (
                <span className="text-muted-foreground ml-1">(system page)</span>
              )}
            </Label>
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">/</span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                placeholder="page-url"
                className="h-9"
                disabled={isSystemPage}
                maxLength={100}
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* SEO Settings */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Globe className="h-4 w-4" />
          SEO Settings
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="seo_title" className="text-xs">
              SEO Title
              <span className="text-muted-foreground ml-1">
                ({formData.seo_title.length}/60)
              </span>
            </Label>
            <Input
              id="seo_title"
              value={formData.seo_title}
              onChange={(e) => handleChange('seo_title', e.target.value)}
              placeholder="Title for search engines"
              className="h-9"
              maxLength={60}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="seo_description" className="text-xs">
              Meta Description
              <span className="text-muted-foreground ml-1">
                ({formData.seo_description.length}/160)
              </span>
            </Label>
            <Textarea
              id="seo_description"
              value={formData.seo_description}
              onChange={(e) => handleChange('seo_description', e.target.value)}
              placeholder="Description for search engines"
              className="min-h-[80px] resize-none"
              maxLength={160}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Social Sharing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Image className="h-4 w-4" />
          Social Sharing
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="og_image" className="text-xs">OG Image URL</Label>
          <Input
            id="og_image"
            value={formData.og_image_url}
            onChange={(e) => handleChange('og_image_url', e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="h-9"
            type="url"
          />
          <p className="text-[10px] text-muted-foreground">
            Recommended: 1200×630 pixels for social media previews
          </p>
        </div>
      </div>

      <Separator />

      {/* Layout Options */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <Layout className="h-4 w-4" />
          Layout Options
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Show Header</Label>
              <p className="text-[10px] text-muted-foreground">
                Display the site header on this page
              </p>
            </div>
            <Switch
              checked={formData.show_header}
              onCheckedChange={(checked) => handleToggle('show_header', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs">Show Footer</Label>
              <p className="text-[10px] text-muted-foreground">
                Display the site footer on this page
              </p>
            </div>
            <Switch
              checked={formData.show_footer}
              onCheckedChange={(checked) => handleToggle('show_footer', checked)}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Publishing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {formData.is_published ? (
              <Eye className="h-4 w-4 text-green-600" />
            ) : (
              <EyeOff className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <Label className="text-sm font-medium">Published</Label>
              <p className="text-[10px] text-muted-foreground">
                {formData.is_published 
                  ? 'This page is visible to visitors' 
                  : 'This page is hidden from visitors'
                }
              </p>
            </div>
          </div>
          <Switch
            checked={formData.is_published}
            onCheckedChange={(checked) => handleToggle('is_published', checked)}
          />
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <Button onClick={handleSave} className="w-full" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
      )}
    </div>
  );
}
