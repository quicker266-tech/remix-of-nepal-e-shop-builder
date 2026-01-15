# Store Builder Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-15  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Component Structure](#component-structure)
4. [Section Types](#section-types)
5. [Page Types & Permissions](#page-types--permissions)
6. [Data Flow](#data-flow)
7. [Configuration System](#configuration-system)
8. [Theme System](#theme-system)
9. [Header & Footer](#header--footer)
10. [Navigation Management](#navigation-management)
11. [Adding New Sections](#adding-new-sections)
12. [Best Practices](#best-practices)

---

## Overview

The Store Builder is a visual page editor that allows store owners to customize their storefront without coding. It provides:

- **Drag-and-drop section management** - Add, reorder, remove sections
- **Real-time preview** - See changes instantly
- **Theme customization** - Colors, typography, layout
- **Page management** - Create custom pages, configure SEO
- **Header/footer editing** - Customize navigation and layout
- **Responsive preview** - Desktop, tablet, mobile views

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          STORE BUILDER                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────┐  ┌──────────────────────────┐  ┌────────────────┐  │
│  │  Left Sidebar  │  │      Preview Frame       │  │ Right Sidebar  │  │
│  │                │  │                          │  │                │  │
│  │ • Page Selector│  │  ┌────────────────────┐  │  │ Section Editor │  │
│  │ • Section List │  │  │     Live Preview   │  │  │                │  │
│  │ • Theme Editor │  │  │                    │  │  │ • Title        │  │
│  │ • Page Settings│  │  │  [Theme Applied]   │  │  │ • Config       │  │
│  │ • Header/Footer│  │  │                    │  │  │ • Visibility   │  │
│  │ • Navigation   │  │  │  Section 1         │  │  │                │  │
│  │                │  │  │  Section 2         │  │  │                │  │
│  └────────────────┘  │  │  Section 3         │  │  └────────────────┘  │
│                      │  │  ...               │  │                      │
│                      │  └────────────────────┘  │                      │
│                      │                          │                      │
│                      └──────────────────────────┘                      │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Structure

```
src/components/store-builder/
├── StoreBuilder.tsx          # Main container component
├── types.ts                  # TypeScript definitions
├── constants.ts              # Section definitions & defaults
├── editor/
│   ├── EditorHeader.tsx      # Preview controls (device, zoom)
│   ├── PageSelector.tsx      # Page switching dropdown
│   ├── PageManager.tsx       # Page CRUD operations
│   ├── PageSettings.tsx      # SEO, visibility, layout
│   ├── SectionPalette.tsx    # Add sections (filtered by page)
│   ├── SectionList.tsx       # Manage sections (reorder, toggle)
│   ├── SectionEditor.tsx     # Configure selected section
│   ├── ThemeEditor.tsx       # Colors, fonts, layout
│   ├── HeaderFooterEditor.tsx# Header/footer tabs
│   ├── NavigationEditor.tsx  # Nav items CRUD
│   ├── PreviewFrame.tsx      # Live preview with theme
│   ├── PositionToggle.tsx    # Before/after content position
│   └── BuiltInContentPlaceholder.tsx
└── utils/
    ├── sectionPermissions.ts # Page-section rules
    └── pageHelpers.ts        # Page type utilities
```

---

## Section Types

The Store Builder supports 32 section types across 6 categories:

### Built-in (Auto-added, not removable)
| Type | Description |
|------|-------------|
| `header` | Site header |
| `footer` | Site footer |

### Hero Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `hero_banner` | Static hero with background | title, subtitle, buttonText, buttonLink, backgroundImage, height, textAlignment |
| `hero_slider` | Carousel hero with multiple slides | slides[], autoplay, interval |
| `hero_video` | Video background hero | videoUrl, title, subtitle, overlayOpacity |

### Product Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `featured_products` | Featured products grid | title, limit, showPrice |
| `product_grid` | All products grid | title, columns, limit |
| `product_carousel` | Horizontal scroll products | title, autoScroll |
| `new_arrivals` | Recently added products | title, limit |
| `best_sellers` | Top selling products | title, limit |
| `recently_viewed` | Customer's viewed products | title |
| `recommended_products` | Personalized recommendations | title |
| `product_reviews` | Product review display | showRating, limit |
| `product_filters` | Filter sidebar | categories, priceRange |
| `product_sort` | Sort dropdown | options[] |

### Category Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `category_grid` | Category cards | title, columns, showDescription |
| `category_banner` | Featured category | categoryId, height |

### Content Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `text_block` | Rich text content | content, alignment |
| `image_text` | Image with text | imageUrl, imagePosition, title, content |
| `gallery` | Image gallery | images[], columns |
| `testimonials` | Customer reviews | testimonials[], layout |
| `faq` | FAQ accordion | questions[], title |

### Marketing Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `announcement_bar` | Top banner | text, link, backgroundColor |
| `newsletter` | Email signup | title, description, buttonText |
| `countdown` | Sale countdown | endDate, title |
| `promo_banner` | Promotional banner | title, description, imageUrl |
| `social_feed` | Social media feed | platform, handle |
| `trust_badges` | Trust indicators | badges[] |
| `brand_logos` | Partner logos | logos[] |

### Utility Sections
| Type | Description | Config Options |
|------|-------------|----------------|
| `custom_html` | Raw HTML (sanitized) | html |
| `spacer` | Vertical spacing | height |
| `divider` | Horizontal line | style, color |

---

## Page Types & Permissions

Different page types have different section allowances:

### Full Access Pages
| Page Type | Allowed Sections | Notes |
|-----------|------------------|-------|
| `homepage` | All sections | Unlimited sections |
| `custom` | All sections | Unlimited sections |

### Limited Pages
| Page Type | Allowed Sections | Notes |
|-----------|------------------|-------|
| `about` | Content sections | Excludes product/marketing |
| `contact` | Content sections | Excludes product/marketing |
| `policy` | Content sections | For terms, privacy, etc. |
| `product` | Marketing, content | Adds around product display |
| `category` | Marketing, content | Adds around category listing |

### System Pages (No Sections)
| Page Type | Built-in Content |
|-----------|------------------|
| `cart` | Shopping cart display |
| `checkout` | Checkout form |
| `profile` | Customer profile |
| `order_tracking` | Order status |
| `search` | Search results |

### Permission Functions

```typescript
// src/components/store-builder/utils/sectionPermissions.ts

// Check if section allowed on page
isSectionTypeAllowed('hero_banner', 'homepage'); // true
isSectionTypeAllowed('hero_banner', 'cart');     // false

// Get allowed sections for page
getAllowedSectionTypes('homepage'); // ['hero_banner', 'product_grid', ...]
getAllowedSectionTypes('cart');     // []

// Check if page can have sections
canPageHaveSections('homepage');    // true
canPageHaveSections('checkout');    // false

// Check section limit
canAddMoreSections('homepage', 10); // true (no limit)
canAddMoreSections('about', 5);     // depends on limit
```

---

## Data Flow

### Loading Data

```
1. StoreBuilder mounts
   ↓
2. useStoreBuilder hook fetches:
   • Theme from store_themes
   • Pages from store_pages
   • Sections from page_sections
   • Header/footer from store_header_footer
   • Navigation from store_navigation
   ↓
3. Data stored in local state
   ↓
4. Preview renders with theme CSS variables
```

### Saving Changes

```
1. User modifies section config
   ↓
2. updateSectionConfig() called
   ↓
3. Supabase UPDATE to page_sections
   ↓
4. Local state updated
   ↓
5. Preview re-renders
```

### Section Operations

```typescript
// Add section
addSection(pageId, sectionType, position);
→ INSERT into page_sections
→ Update local state
→ Set as selected section

// Update section
updateSectionConfig(sectionId, newConfig);
→ UPDATE page_sections.config
→ Update local state

// Delete section
deleteSection(sectionId);
→ DELETE from page_sections
→ Update local state
→ Clear selection

// Reorder sections
reorderSections(sectionIds);
→ UPDATE sort_order for each
→ Update local state
```

---

## Configuration System

### Section Config Structure

Each section has a typed configuration stored as JSONB:

```typescript
// Example: Hero Banner
interface HeroBannerConfig {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  backgroundOverlay?: number;  // 0-100
  textAlignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
  textColor?: string;
}

// Example: Product Grid
interface ProductGridConfig {
  title?: string;
  columns?: 2 | 3 | 4;
  limit?: number;
  showPrice?: boolean;
  showAddToCart?: boolean;
  filterByCategory?: string;
}
```

### Default Configurations

Defined in `constants.ts`:

```typescript
export const SECTION_TYPES: SectionDefinition[] = [
  {
    type: 'hero_banner',
    label: 'Hero Banner',
    icon: 'Image',
    category: 'hero',
    description: 'Large hero section with background image',
    defaultConfig: {
      title: 'Welcome to Our Store',
      subtitle: 'Discover amazing products',
      buttonText: 'Shop Now',
      buttonLink: '/catalog',
      backgroundImage: '',
      backgroundOverlay: 40,
      textAlignment: 'center',
      height: 'large',
    },
  },
  // ... more sections
];
```

---

## Theme System

### Theme Structure

```typescript
interface Theme {
  id: string;
  store_id: string;
  name: string;
  is_active: boolean;
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
  custom_css?: string;
}

interface ThemeColors {
  primary: string;        // #3b82f6
  secondary: string;      // #f59e0b
  accent: string;         // #10b981
  background: string;     // #ffffff
  foreground: string;     // #1f2937
  muted: string;          // #f3f4f6
  border: string;         // #e5e7eb
  error: string;          // #ef4444
}

interface ThemeTypography {
  headingFont: string;    // 'Inter'
  bodyFont: string;       // 'Inter'
  baseFontSize: string;   // '16px'
  headingWeight: string;  // '700'
}

interface ThemeLayout {
  containerWidth: string; // '1200px'
  borderRadius: string;   // '8px'
  spacing: string;        // 'comfortable' | 'compact' | 'spacious'
}
```

### Theme Application

The theme is applied via CSS custom properties in PreviewFrame:

```tsx
function PreviewFrame({ theme, sections }) {
  const themeStyles = theme ? `
    :root {
      --primary: ${theme.colors.primary};
      --secondary: ${theme.colors.secondary};
      --background: ${theme.colors.background};
      --foreground: ${theme.colors.foreground};
      /* ... more variables */
    }
  ` : '';

  return (
    <iframe>
      <style>{themeStyles}</style>
      {/* sections */}
    </iframe>
  );
}
```

### Theme Editor

```typescript
// ThemeEditor.tsx
<ThemeEditor
  theme={theme}
  onUpdate={(updates) => updateTheme(updates)}
/>

// Sections:
// 1. Color Palette - Primary, secondary, accent pickers
// 2. Typography - Font family, sizes
// 3. Layout - Container width, spacing
// 4. Custom CSS - Advanced overrides
```

---

## Header & Footer

### Configuration Tables

Header and footer settings are stored in `store_header_footer`:

```typescript
interface HeaderConfig {
  layout: 'logo-left' | 'logo-center' | 'logo-right';
  sticky: boolean;
  showSearch: boolean;
  showCart: boolean;
  showAccount: boolean;
  backgroundColor?: string;
  textColor?: string;
}

interface FooterConfig {
  layout: 'simple' | 'minimal' | 'multi-column';
  showNewsletter: boolean;
  showSocial: boolean;
  showPaymentIcons: boolean;
  backgroundColor?: string;
  textColor?: string;
  copyright?: string;
  columns?: FooterColumn[];
}

interface SocialLinks {
  facebook?: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  youtube?: string;
}
```

### Editor Component

```typescript
// HeaderFooterEditor.tsx
<Tabs defaultValue="header">
  <TabsList>
    <TabsTrigger value="header">Header</TabsTrigger>
    <TabsTrigger value="footer">Footer</TabsTrigger>
    <TabsTrigger value="social">Social Links</TabsTrigger>
  </TabsList>
  
  <TabsContent value="header">
    <HeaderLayoutSelector />
    <ToggleGroup for={showSearch, showCart, showAccount} />
    <ColorPickers for={backgroundColor, textColor} />
  </TabsContent>
  
  <TabsContent value="footer">
    <FooterLayoutSelector />
    <ToggleGroup for={showNewsletter, showSocial} />
    <CopyrightEditor />
  </TabsContent>
  
  <TabsContent value="social">
    <SocialLinksForm />
  </TabsContent>
</Tabs>
```

---

## Navigation Management

### Navigation Structure

```typescript
interface NavItem {
  id: string;
  store_id: string;
  label: string;
  url?: string;           // External URL
  page_id?: string;       // Internal page link
  parent_id?: string;     // For dropdown menus
  location: 'header' | 'footer' | 'mobile';
  sort_order: number;
  is_highlighted: boolean;
  open_in_new_tab: boolean;
}
```

### NavigationEditor

```typescript
// NavigationEditor.tsx
<NavigationEditor
  navItems={navItems}
  pages={pages}
  onAdd={(item) => addNavItem(item)}
  onUpdate={(id, updates) => updateNavItem(id, updates)}
  onDelete={(id) => deleteNavItem(id)}
  onReorder={(ids) => reorderNavItems(ids)}
/>

// Features:
// - Add internal (page) or external links
// - Drag-and-drop reorder
// - Toggle highlight (styled differently)
// - Set open in new tab
// - Filter by location (header/footer/mobile)
```

---

## Adding New Sections

### Step 1: Define the Type

Add to `src/components/store-builder/types.ts`:

```typescript
export type SectionType = 
  | 'hero_banner'
  | 'my_new_section'  // Add here
  | ...;

export interface MyNewSectionConfig {
  title: string;
  description?: string;
  // Add your config properties
}
```

### Step 2: Add Section Definition

Add to `src/components/store-builder/constants.ts`:

```typescript
export const SECTION_TYPES: SectionDefinition[] = [
  // ... existing sections
  {
    type: 'my_new_section',
    label: 'My New Section',
    icon: 'Layout',  // Lucide icon name
    category: 'content',  // hero | product | category | content | marketing | utility
    description: 'Description for the palette',
    defaultConfig: {
      title: 'Default Title',
      description: '',
    },
  },
];
```

### Step 3: Add Preview Renderer

Add case in `src/components/store-builder/editor/PreviewFrame.tsx`:

```typescript
const renderSection = (section: Section) => {
  switch (section.section_type) {
    // ... existing cases
    case 'my_new_section':
      return <MyNewSectionPreview config={section.config} />;
  }
};

// Create preview component
function MyNewSectionPreview({ config }: { config: MyNewSectionConfig }) {
  return (
    <section className="p-8 bg-background">
      <h2 className="text-2xl font-bold">{config.title}</h2>
      {config.description && <p>{config.description}</p>}
    </section>
  );
}
```

### Step 4: Add Configuration Editor

Add case in `src/components/store-builder/editor/SectionEditor.tsx`:

```typescript
const renderFields = () => {
  switch (section.section_type) {
    // ... existing cases
    case 'my_new_section':
      return (
        <>
          <FormField label="Title">
            <Input
              value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
            />
          </FormField>
          <FormField label="Description">
            <Textarea
              value={config.description}
              onChange={(e) => updateConfig({ description: e.target.value })}
            />
          </FormField>
        </>
      );
  }
};
```

### Step 5: Create Production Component

Create `src/components/storefront/sections/MyNewSection.tsx`:

```typescript
interface MyNewSectionProps {
  config: MyNewSectionConfig;
  storeId: string;
}

export function MyNewSection({ config, storeId }: MyNewSectionProps) {
  // This component renders on the actual storefront
  // It may fetch real data, handle interactions, etc.
  
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-foreground">
          {config.title}
        </h2>
        {config.description && (
          <p className="mt-4 text-muted-foreground">
            {config.description}
          </p>
        )}
      </div>
    </section>
  );
}
```

### Step 6: Register in Section Index

Add to `src/components/storefront/sections/index.tsx`:

```typescript
export { MyNewSection } from './MyNewSection';
```

### Step 7: Add to StorePage Renderer

Update `src/pages/storefront/StorePage.tsx`:

```typescript
import { MyNewSection } from '@/components/storefront/sections';

const renderSection = (section: PageSection) => {
  switch (section.section_type) {
    // ... existing cases
    case 'my_new_section':
      return <MyNewSection config={section.config} storeId={storeId} />;
  }
};
```

### Step 8: Add Database Enum (if needed)

If the section type doesn't exist in the database enum, run a migration:

```sql
ALTER TYPE section_type ADD VALUE 'my_new_section';
```

---

## Best Practices

### 1. Config Validation

Always validate config before saving:

```typescript
const validateConfig = (type: SectionType, config: unknown) => {
  const schema = SECTION_SCHEMAS[type];
  return schema.safeParse(config);
};
```

### 2. Default Values

Provide sensible defaults for all config properties:

```typescript
const defaultConfig = {
  title: 'Section Title',
  columns: 3,
  showPrice: true,
  // Never leave required fields undefined
};
```

### 3. Responsive Design

Test sections at all breakpoints:

```typescript
// Use responsive classes
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
  {/* ... */}
</div>
```

### 4. Loading States

Handle loading states in production components:

```typescript
function ProductGrid({ config, storeId }) {
  const { data: products, isLoading } = useQuery({...});

  if (isLoading) {
    return <ProductGridSkeleton columns={config.columns} />;
  }

  return (
    <div className="grid">
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### 5. Error Boundaries

Wrap sections in error boundaries:

```typescript
<ErrorBoundary fallback={<SectionError type={section.section_type} />}>
  {renderSection(section)}
</ErrorBoundary>
```

---

*This documentation is maintained with the codebase. Last update: 2026-01-15*
