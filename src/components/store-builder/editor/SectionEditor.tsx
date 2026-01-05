/**
 * ============================================================================
 * SECTION EDITOR COMPONENT
 * ============================================================================
 * 
 * Configuration panel for editing section properties.
 * Dynamically renders form fields based on section type.
 * 
 * FEATURES:
 * - Dedicated editors for all section types
 * - Real-time preview updates
 * - Array field management (slides, testimonials, FAQs, etc.)
 * - Image URL inputs with preview
 * 
 * ============================================================================
 */

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  X, Image as ImageIcon, Link as LinkIcon, Type, Settings, 
  Plus, Trash2, Video, Layout, Megaphone, Mail, Clock, Quote,
  ShieldCheck, Building, Code, ArrowUpDown, Minus, HelpCircle
} from 'lucide-react';
import { PageSection, SectionConfig, PageType } from '../types';
import { SECTION_DEFINITIONS } from '../constants';
import { PositionToggle } from './PositionToggle';
import { hasBuiltInContent } from '../utils/pageHelpers';

interface SectionEditorProps {
  section: PageSection;
  onUpdate: (config: SectionConfig) => void;
  onUpdateSection: (updates: Partial<PageSection>) => void;
  onClose: () => void;
  pageType?: PageType;
}

export function SectionEditor({ section, onUpdate, onUpdateSection, onClose, pageType }: SectionEditorProps) {
  const definition = SECTION_DEFINITIONS[section.section_type];
  const config = section.config as Record<string, any>;

  const updateField = (field: string, value: any) => {
    onUpdate({ ...config, [field]: value });
  };

  // Check if this page supports position toggle
  const showPositionToggle = pageType && hasBuiltInContent(pageType);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-foreground">{section.name}</h3>
          <p className="text-xs text-muted-foreground">{definition?.label}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Position toggle for pages with built-in content */}
          {showPositionToggle && (
            <>
              <PositionToggle
                position={section.position || 'below'}
                onChange={(pos) => onUpdateSection({ position: pos })}
              />
              <Separator />
            </>
          )}
          
          {renderSectionFields(section.section_type, config, updateField)}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// FIELD ROUTER
// ============================================================================

function renderSectionFields(
  sectionType: string,
  config: Record<string, any>,
  updateField: (field: string, value: any) => void
) {
  switch (sectionType) {
    // Hero sections
    case 'hero_banner':
      return <HeroBannerFields config={config} updateField={updateField} />;
    case 'hero_slider':
      return <HeroSliderFields config={config} updateField={updateField} />;
    case 'hero_video':
      return <HeroVideoFields config={config} updateField={updateField} />;
    
    // Product sections
    case 'featured_products':
    case 'new_arrivals':
    case 'best_sellers':
      return <ProductGridFields config={config} updateField={updateField} />;
    case 'product_grid':
      return <ProductGridFields config={config} updateField={updateField} showFilters />;
    case 'product_carousel':
      return <ProductCarouselFields config={config} updateField={updateField} />;
    
    // Category sections
    case 'category_grid':
      return <CategoryGridFields config={config} updateField={updateField} />;
    case 'category_banner':
      return <CategoryBannerFields config={config} updateField={updateField} />;
    
    // Content sections
    case 'text_block':
      return <TextBlockFields config={config} updateField={updateField} />;
    case 'image_text':
      return <ImageTextFields config={config} updateField={updateField} />;
    case 'gallery':
      return <GalleryFields config={config} updateField={updateField} />;
    case 'testimonials':
      return <TestimonialsFields config={config} updateField={updateField} />;
    case 'faq':
      return <FaqFields config={config} updateField={updateField} />;
    
    // Marketing sections
    case 'announcement_bar':
      return <AnnouncementBarFields config={config} updateField={updateField} />;
    case 'newsletter':
      return <NewsletterFields config={config} updateField={updateField} />;
    case 'countdown':
      return <CountdownFields config={config} updateField={updateField} />;
    case 'promo_banner':
      return <PromoBannerFields config={config} updateField={updateField} />;
    case 'trust_badges':
      return <TrustBadgesFields config={config} updateField={updateField} />;
    case 'brand_logos':
      return <BrandLogosFields config={config} updateField={updateField} />;
    
    // Layout sections
    case 'spacer':
      return <SpacerFields config={config} updateField={updateField} />;
    case 'divider':
      return <DividerFields config={config} updateField={updateField} />;
    case 'custom_html':
      return <CustomHtmlFields config={config} updateField={updateField} />;
    
    default:
      return <GenericFields config={config} updateField={updateField} />;
  }
}

// ============================================================================
// HERO SECTION FIELDS
// ============================================================================

function HeroBannerFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Enter headline..." />
        </Field>
        <Field label="Subtitle">
          <Textarea value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Enter subtitle..." rows={2} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={LinkIcon} title="Call to Action">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text">
            <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} placeholder="Shop Now" />
          </Field>
          <Field label="Button Link">
            <Input value={config.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} placeholder="/products" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Secondary Button">
            <Input value={config.secondaryButtonText || ''} onChange={(e) => updateField('secondaryButtonText', e.target.value)} placeholder="Learn More" />
          </Field>
          <Field label="Secondary Link">
            <Input value={config.secondaryButtonLink || ''} onChange={(e) => updateField('secondaryButtonLink', e.target.value)} placeholder="/about" />
          </Field>
        </div>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Background">
        <Field label="Image URL">
          <Input value={config.backgroundImage || ''} onChange={(e) => updateField('backgroundImage', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label={`Overlay Opacity (${config.backgroundOverlay || 0}%)`}>
          <input type="range" min="0" max="100" value={config.backgroundOverlay || 0} onChange={(e) => updateField('backgroundOverlay', parseInt(e.target.value))} className="w-full" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Layout} title="Layout">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Text Alignment">
            <Select value={config.textAlignment || 'center'} onValueChange={(v) => updateField('textAlignment', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Height">
            <Select value={config.height || 'large'} onValueChange={(v) => updateField('height', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (40vh)</SelectItem>
                <SelectItem value="medium">Medium (60vh)</SelectItem>
                <SelectItem value="large">Large (80vh)</SelectItem>
                <SelectItem value="full">Full Screen</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldSection>
    </>
  );
}

function HeroSliderFields({ config, updateField }: FieldProps) {
  const slides = config.slides || [];

  const addSlide = () => {
    updateField('slides', [...slides, { id: Date.now().toString(), title: 'New Slide', subtitle: '' }]);
  };

  const updateSlide = (index: number, key: string, value: string) => {
    const newSlides = [...slides];
    newSlides[index] = { ...newSlides[index], [key]: value };
    updateField('slides', newSlides);
  };

  const removeSlide = (index: number) => {
    updateField('slides', slides.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Layout} title="Slides">
        {slides.map((slide: any, i: number) => (
          <div key={slide.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Slide {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeSlide(i)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <Input value={slide.title || ''} onChange={(e) => updateSlide(i, 'title', e.target.value)} placeholder="Slide title" />
            <Input value={slide.subtitle || ''} onChange={(e) => updateSlide(i, 'subtitle', e.target.value)} placeholder="Subtitle" />
            <Input value={slide.backgroundImage || ''} onChange={(e) => updateSlide(i, 'backgroundImage', e.target.value)} placeholder="Background image URL" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={slide.buttonText || ''} onChange={(e) => updateSlide(i, 'buttonText', e.target.value)} placeholder="Button text" />
              <Input value={slide.buttonLink || ''} onChange={(e) => updateSlide(i, 'buttonLink', e.target.value)} placeholder="Button link" />
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addSlide} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Slide</Button>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Settings">
        <ToggleField label="Autoplay" checked={config.autoplay !== false} onChange={(v) => updateField('autoplay', v)} />
        <Field label="Interval (ms)">
          <Input type="number" value={config.interval || 5000} onChange={(e) => updateField('interval', parseInt(e.target.value))} />
        </Field>
      </FieldSection>
    </>
  );
}

function HeroVideoFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Video} title="Video">
        <Field label="Video URL (YouTube/Vimeo)">
          <Input value={config.videoUrl || ''} onChange={(e) => updateField('videoUrl', e.target.value)} placeholder="https://youtube.com/..." />
        </Field>
        <ToggleField label="Muted" checked={config.muted !== false} onChange={(v) => updateField('muted', v)} />
        <ToggleField label="Loop" checked={config.loop !== false} onChange={(v) => updateField('loop', v)} />
      </FieldSection>

      <Separator />

      <FieldSection icon={Type} title="Overlay Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text">
            <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} />
          </Field>
          <Field label="Button Link">
            <Input value={config.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} />
          </Field>
        </div>
      </FieldSection>
    </>
  );
}

// ============================================================================
// PRODUCT SECTION FIELDS
// ============================================================================

function ProductGridFields({ config, updateField, showFilters = false }: FieldProps & { showFilters?: boolean }) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Featured Products" />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Display Options">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Products to Show">
            <Select value={String(config.productCount || 4)} onValueChange={(v) => updateField('productCount', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="12">12</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Columns">
            <Select value={String(config.columns || 4)} onValueChange={(v) => updateField('columns', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
                <SelectItem value="5">5</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <ToggleField label="Show Prices" checked={config.showPrice !== false} onChange={(v) => updateField('showPrice', v)} />
        <ToggleField label="Show Add to Cart" checked={config.showAddToCart !== false} onChange={(v) => updateField('showAddToCart', v)} />
        {showFilters && <ToggleField label="Show Filters" checked={config.showFilters === true} onChange={(v) => updateField('showFilters', v)} />}
      </FieldSection>
    </>
  );
}

function ProductCarouselFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Settings">
        <Field label="Number of Products">
          <Select value={String(config.productCount || 8)} onValueChange={(v) => updateField('productCount', parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="4">4</SelectItem>
              <SelectItem value="6">6</SelectItem>
              <SelectItem value="8">8</SelectItem>
              <SelectItem value="12">12</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <ToggleField label="Autoplay" checked={config.autoplay === true} onChange={(v) => updateField('autoplay', v)} />
      </FieldSection>
    </>
  );
}

// ============================================================================
// CATEGORY SECTION FIELDS
// ============================================================================

function CategoryGridFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Shop by Category" />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Display Options">
        <Field label="Columns">
          <Select value={String(config.columns || 3)} onValueChange={(v) => updateField('columns', parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="2">2</SelectItem>
              <SelectItem value="3">3</SelectItem>
              <SelectItem value="4">4</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <ToggleField label="Show Description" checked={config.showDescription !== false} onChange={(v) => updateField('showDescription', v)} />
        <ToggleField label="Show Product Count" checked={config.showProductCount !== false} onChange={(v) => updateField('showProductCount', v)} />
      </FieldSection>
    </>
  );
}

function CategoryBannerFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Background">
        <Field label="Image URL">
          <Input value={config.backgroundImage || ''} onChange={(e) => updateField('backgroundImage', e.target.value)} placeholder="https://..." />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Options">
        <ToggleField label="Show Products" checked={config.showProducts !== false} onChange={(v) => updateField('showProducts', v)} />
      </FieldSection>
    </>
  );
}

// ============================================================================
// CONTENT SECTION FIELDS
// ============================================================================

function TextBlockFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Content">
          <Textarea value={config.content || ''} onChange={(e) => updateField('content', e.target.value)} rows={8} placeholder="Enter your content..." />
        </Field>
        <p className="text-xs text-muted-foreground">Supports basic HTML</p>
      </FieldSection>

      <Separator />

      <FieldSection icon={Layout} title="Layout">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Alignment">
            <Select value={config.alignment || 'left'} onValueChange={(v) => updateField('alignment', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Max Width">
            <Select value={config.maxWidth || 'medium'} onValueChange={(v) => updateField('maxWidth', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="large">Large</SelectItem>
                <SelectItem value="full">Full</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldSection>
    </>
  );
}

function ImageTextFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} />
        </Field>
        <Field label="Content">
          <Textarea value={config.content || ''} onChange={(e) => updateField('content', e.target.value)} rows={4} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text">
            <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} />
          </Field>
          <Field label="Button Link">
            <Input value={config.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} />
          </Field>
        </div>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Image">
        <Field label="Image URL">
          <Input value={config.imageUrl || ''} onChange={(e) => updateField('imageUrl', e.target.value)} placeholder="https://..." />
        </Field>
        <Field label="Image Position">
          <Select value={config.imagePosition || 'left'} onValueChange={(v) => updateField('imagePosition', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="left">Left</SelectItem>
              <SelectItem value="right">Right</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldSection>
    </>
  );
}

function GalleryFields({ config, updateField }: FieldProps) {
  const images = config.images || [];

  const addImage = () => {
    updateField('images', [...images, { id: Date.now().toString(), url: '', alt: '' }]);
  };

  const updateImage = (index: number, key: string, value: string) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], [key]: value };
    updateField('images', newImages);
  };

  const removeImage = (index: number) => {
    updateField('images', images.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Images">
        {images.map((img: any, i: number) => (
          <div key={img.id} className="flex gap-2">
            <Input value={img.url || ''} onChange={(e) => updateImage(i, 'url', e.target.value)} placeholder="Image URL" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeImage(i)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={addImage} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Image</Button>
      </FieldSection>

      <Separator />

      <FieldSection icon={Layout} title="Layout">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Columns">
            <Select value={String(config.columns || 3)} onValueChange={(v) => updateField('columns', parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Aspect Ratio">
            <Select value={config.aspectRatio || 'square'} onValueChange={(v) => updateField('aspectRatio', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Square</SelectItem>
                <SelectItem value="landscape">Landscape</SelectItem>
                <SelectItem value="portrait">Portrait</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
      </FieldSection>
    </>
  );
}

function TestimonialsFields({ config, updateField }: FieldProps) {
  const testimonials = config.testimonials || [];

  const addTestimonial = () => {
    updateField('testimonials', [...testimonials, { id: Date.now().toString(), quote: '', author: '', rating: 5 }]);
  };

  const updateTestimonial = (index: number, key: string, value: any) => {
    const newItems = [...testimonials];
    newItems[index] = { ...newItems[index], [key]: value };
    updateField('testimonials', newItems);
  };

  const removeTestimonial = (index: number) => {
    updateField('testimonials', testimonials.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="What Our Customers Say" />
        </Field>
        <Field label="Layout">
          <Select value={config.layout || 'carousel'} onValueChange={(v) => updateField('layout', v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="carousel">Carousel</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Quote} title="Testimonials">
        {testimonials.map((t: any, i: number) => (
          <div key={t.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Testimonial {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeTestimonial(i)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <Textarea value={t.quote || ''} onChange={(e) => updateTestimonial(i, 'quote', e.target.value)} placeholder="Quote" rows={2} />
            <Input value={t.author || ''} onChange={(e) => updateTestimonial(i, 'author', e.target.value)} placeholder="Author name" />
            <Input value={t.role || ''} onChange={(e) => updateTestimonial(i, 'role', e.target.value)} placeholder="Role/Company (optional)" />
            <Field label="Rating">
              <Select value={String(t.rating || 5)} onValueChange={(v) => updateTestimonial(i, 'rating', parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => <SelectItem key={n} value={String(n)}>{n} Stars</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
          </div>
        ))}
        <Button variant="outline" onClick={addTestimonial} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Testimonial</Button>
      </FieldSection>
    </>
  );
}

function FaqFields({ config, updateField }: FieldProps) {
  const faqs = config.faqs || [];

  const addFaq = () => {
    updateField('faqs', [...faqs, { id: Date.now().toString(), question: '', answer: '' }]);
  };

  const updateFaq = (index: number, key: string, value: string) => {
    const newItems = [...faqs];
    newItems[index] = { ...newItems[index], [key]: value };
    updateField('faqs', newItems);
  };

  const removeFaq = (index: number) => {
    updateField('faqs', faqs.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Frequently Asked Questions" />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={HelpCircle} title="Questions">
        {faqs.map((faq: any, i: number) => (
          <div key={faq.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Question {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeFaq(i)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <Input value={faq.question || ''} onChange={(e) => updateFaq(i, 'question', e.target.value)} placeholder="Question" />
            <Textarea value={faq.answer || ''} onChange={(e) => updateFaq(i, 'answer', e.target.value)} placeholder="Answer" rows={2} />
          </div>
        ))}
        <Button variant="outline" onClick={addFaq} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Question</Button>
      </FieldSection>
    </>
  );
}

// ============================================================================
// MARKETING SECTION FIELDS
// ============================================================================

function AnnouncementBarFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Megaphone} title="Content">
        <Field label="Text">
          <Input value={config.text || ''} onChange={(e) => updateField('text', e.target.value)} placeholder="Free shipping on orders over $50!" />
        </Field>
        <Field label="Link (optional)">
          <Input value={config.link || ''} onChange={(e) => updateField('link', e.target.value)} placeholder="/sale" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Styling">
        <Field label="Background Color">
          <Input value={config.backgroundColor || ''} onChange={(e) => updateField('backgroundColor', e.target.value)} placeholder="#000000 or hsl(...)" />
        </Field>
        <Field label="Text Color">
          <Input value={config.textColor || ''} onChange={(e) => updateField('textColor', e.target.value)} placeholder="#ffffff or hsl(...)" />
        </Field>
        <ToggleField label="Dismissible" checked={config.dismissible !== false} onChange={(v) => updateField('dismissible', v)} />
      </FieldSection>
    </>
  );
}

function NewsletterFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Mail} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Stay Updated" />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} placeholder="Subscribe for updates" />
        </Field>
        <Field label="Button Text">
          <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} placeholder="Subscribe" />
        </Field>
        <Field label="Success Message">
          <Input value={config.successMessage || ''} onChange={(e) => updateField('successMessage', e.target.value)} placeholder="Thank you for subscribing!" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="Styling">
        <Field label="Background Color">
          <Input value={config.backgroundColor || ''} onChange={(e) => updateField('backgroundColor', e.target.value)} placeholder="Optional" />
        </Field>
      </FieldSection>
    </>
  );
}

function CountdownFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Clock} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Sale Ends In" />
        </Field>
        <Field label="End Date">
          <Input type="datetime-local" value={config.endDate ? config.endDate.slice(0, 16) : ''} onChange={(e) => updateField('endDate', new Date(e.target.value).toISOString())} />
        </Field>
        <Field label="Expired Message">
          <Input value={config.expiredMessage || ''} onChange={(e) => updateField('expiredMessage', e.target.value)} placeholder="Sale has ended" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={LinkIcon} title="CTA">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text">
            <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} />
          </Field>
          <Field label="Button Link">
            <Input value={config.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} />
          </Field>
        </div>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Background">
        <Field label="Background Image">
          <Input value={config.backgroundImage || ''} onChange={(e) => updateField('backgroundImage', e.target.value)} placeholder="https://..." />
        </Field>
      </FieldSection>
    </>
  );
}

function PromoBannerFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Special Offer" />
        </Field>
        <Field label="Subtitle">
          <Input value={config.subtitle || ''} onChange={(e) => updateField('subtitle', e.target.value)} />
        </Field>
        <Field label="Badge">
          <Input value={config.badge || ''} onChange={(e) => updateField('badge', e.target.value)} placeholder="SALE" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={LinkIcon} title="CTA">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button Text">
            <Input value={config.buttonText || ''} onChange={(e) => updateField('buttonText', e.target.value)} />
          </Field>
          <Field label="Button Link">
            <Input value={config.buttonLink || ''} onChange={(e) => updateField('buttonLink', e.target.value)} />
          </Field>
        </div>
      </FieldSection>

      <Separator />

      <FieldSection icon={ImageIcon} title="Background">
        <Field label="Background Image">
          <Input value={config.backgroundImage || ''} onChange={(e) => updateField('backgroundImage', e.target.value)} placeholder="https://..." />
        </Field>
      </FieldSection>
    </>
  );
}

function TrustBadgesFields({ config, updateField }: FieldProps) {
  const badges = config.badges || [];

  const addBadge = () => {
    updateField('badges', [...badges, { id: Date.now().toString(), icon: 'ShieldCheck', title: 'New Badge', description: '' }]);
  };

  const updateBadge = (index: number, key: string, value: string) => {
    const newItems = [...badges];
    newItems[index] = { ...newItems[index], [key]: value };
    updateField('badges', newItems);
  };

  const removeBadge = (index: number) => {
    updateField('badges', badges.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Why Shop With Us" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={ShieldCheck} title="Badges">
        {badges.map((badge: any, i: number) => (
          <div key={badge.id} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">Badge {i + 1}</span>
              <Button variant="ghost" size="icon" onClick={() => removeBadge(i)}><Trash2 className="w-4 h-4" /></Button>
            </div>
            <Field label="Icon">
              <Select value={badge.icon || 'ShieldCheck'} onValueChange={(v) => updateBadge(i, 'icon', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Truck">Truck</SelectItem>
                  <SelectItem value="RotateCcw">Return</SelectItem>
                  <SelectItem value="Lock">Lock</SelectItem>
                  <SelectItem value="ShieldCheck">Shield</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Input value={badge.title || ''} onChange={(e) => updateBadge(i, 'title', e.target.value)} placeholder="Title" />
            <Input value={badge.description || ''} onChange={(e) => updateBadge(i, 'description', e.target.value)} placeholder="Description" />
          </div>
        ))}
        <Button variant="outline" onClick={addBadge} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Badge</Button>
      </FieldSection>
    </>
  );
}

function BrandLogosFields({ config, updateField }: FieldProps) {
  const logos = config.logos || [];

  const addLogo = () => {
    updateField('logos', [...logos, { id: Date.now().toString(), imageUrl: '', alt: '' }]);
  };

  const updateLogo = (index: number, key: string, value: string) => {
    const newItems = [...logos];
    newItems[index] = { ...newItems[index], [key]: value };
    updateField('logos', newItems);
  };

  const removeLogo = (index: number) => {
    updateField('logos', logos.filter((_: any, i: number) => i !== index));
  };

  return (
    <>
      <FieldSection icon={Type} title="Content">
        <Field label="Title">
          <Input value={config.title || ''} onChange={(e) => updateField('title', e.target.value)} placeholder="Our Partners" />
        </Field>
        <ToggleField label="Grayscale" checked={config.grayscale !== false} onChange={(v) => updateField('grayscale', v)} />
      </FieldSection>

      <Separator />

      <FieldSection icon={Building} title="Logos">
        {logos.map((logo: any, i: number) => (
          <div key={logo.id} className="flex gap-2">
            <Input value={logo.imageUrl || ''} onChange={(e) => updateLogo(i, 'imageUrl', e.target.value)} placeholder="Logo URL" className="flex-1" />
            <Button variant="ghost" size="icon" onClick={() => removeLogo(i)}><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
        <Button variant="outline" onClick={addLogo} className="w-full"><Plus className="w-4 h-4 mr-2" /> Add Logo</Button>
      </FieldSection>
    </>
  );
}

// ============================================================================
// LAYOUT SECTION FIELDS
// ============================================================================

function SpacerFields({ config, updateField }: FieldProps) {
  return (
    <FieldSection icon={ArrowUpDown} title="Size">
      <Field label="Height">
        <Select value={config.height || 'medium'} onValueChange={(v) => updateField('height', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Small (2rem)</SelectItem>
            <SelectItem value="medium">Medium (4rem)</SelectItem>
            <SelectItem value="large">Large (6rem)</SelectItem>
            <SelectItem value="xlarge">Extra Large (8rem)</SelectItem>
          </SelectContent>
        </Select>
      </Field>
    </FieldSection>
  );
}

function DividerFields({ config, updateField }: FieldProps) {
  return (
    <FieldSection icon={Minus} title="Style">
      <Field label="Line Style">
        <Select value={config.style || 'solid'} onValueChange={(v) => updateField('style', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="solid">Solid</SelectItem>
            <SelectItem value="dashed">Dashed</SelectItem>
            <SelectItem value="dotted">Dotted</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Width">
        <Select value={config.width || 'container'} onValueChange={(v) => updateField('width', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Full Width</SelectItem>
            <SelectItem value="container">Container</SelectItem>
            <SelectItem value="narrow">Narrow</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field label="Color">
        <Input value={config.color || ''} onChange={(e) => updateField('color', e.target.value)} placeholder="Optional custom color" />
      </Field>
    </FieldSection>
  );
}

function CustomHtmlFields({ config, updateField }: FieldProps) {
  return (
    <>
      <FieldSection icon={Code} title="HTML">
        <Field label="HTML Content">
          <Textarea value={config.html || ''} onChange={(e) => updateField('html', e.target.value)} rows={8} placeholder="<div>Your HTML...</div>" className="font-mono text-sm" />
        </Field>
      </FieldSection>

      <Separator />

      <FieldSection icon={Settings} title="CSS (Optional)">
        <Field label="Custom CSS">
          <Textarea value={config.css || ''} onChange={(e) => updateField('css', e.target.value)} rows={4} placeholder=".my-class { ... }" className="font-mono text-sm" />
        </Field>
      </FieldSection>
    </>
  );
}

// ============================================================================
// GENERIC FALLBACK
// ============================================================================

function GenericFields({ config, updateField }: FieldProps) {
  const entries = Object.entries(config as Record<string, unknown>);

  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No configurable options for this section type.</p>;
  }

  return (
    <div className="space-y-4">
      {entries.map(([key, value]) => {
        if (typeof value === 'string') {
          return (
            <Field key={key} label={formatLabel(key)}>
              <Input value={value} onChange={(e) => updateField(key, e.target.value)} />
            </Field>
          );
        }
        if (typeof value === 'number') {
          return (
            <Field key={key} label={formatLabel(key)}>
              <Input type="number" value={value} onChange={(e) => updateField(key, parseInt(e.target.value))} />
            </Field>
          );
        }
        if (typeof value === 'boolean') {
          return <ToggleField key={key} label={formatLabel(key)} checked={value} onChange={(v) => updateField(key, v)} />;
        }
        return null;
      })}
    </div>
  );
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface FieldProps {
  config: Record<string, any>;
  updateField: (field: string, value: any) => void;
}

function FieldSection({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="w-4 h-4" />
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="mb-1.5 block">{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function formatLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
}
