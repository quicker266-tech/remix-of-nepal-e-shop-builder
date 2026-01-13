# Development Guide

## Project Overview

This is a multi-tenant e-commerce platform with a visual store builder. Store owners can customize their storefronts using a drag-and-drop editor.

---

## Architecture

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling (using semantic tokens)
- **shadcn/ui** - Component library
- **React Router** - Routing
- **TanStack Query** - Data fetching

### Backend (Lovable Cloud / Supabase)
- **PostgreSQL** - Database
- **Row Level Security (RLS)** - Data access control
- **Edge Functions** - Serverless functions
- **Storage** - File uploads

---

## Key Directories

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── dashboard/       # Dashboard-specific components
│   ├── store-builder/   # Visual editor components
│   │   ├── editor/      # Editor panels (SectionEditor, PreviewFrame, etc.)
│   │   ├── types.ts     # TypeScript definitions
│   │   └── constants.ts # Section definitions & defaults
│   ├── storefront/      # Customer-facing storefront
│   │   └── sections/    # Production section components (19 types)
│   └── products/        # Product-related components
├── contexts/            # React contexts (Auth, Cart, Store)
├── hooks/               # Custom React hooks
│   └── useStoreBuilder.ts # Store Builder data hooks
├── layouts/             # Page layouts
├── pages/               # Route pages
│   ├── dashboard/       # Store admin pages
│   ├── admin/           # Super admin pages
│   └── storefront/      # Customer-facing pages
│       ├── StorePage.tsx    # Dynamic page renderer
│       ├── StoreCatalog.tsx # Product catalog
│       └── ProductDetail.tsx
├── integrations/        # External service integrations
│   └── supabase/        # Supabase client & types
└── lib/                 # Utility functions
```

---

## Store Builder Module

### Purpose
Allow store owners to visually customize their storefront without coding.

### Components Flow
```
StoreBuilder (main container)
├── EditorHeader (preview controls)
├── Left Sidebar
│   ├── SectionPalette (add sections)
│   ├── SectionList (manage sections)
│   ├── ThemeEditor (customize theme)
│   └── PageManager (manage pages)
├── PreviewFrame (live preview)
└── Right Sidebar
    └── SectionEditor (configure selected section)
```

### Data Flow
1. User loads Store Builder → hooks fetch theme, pages, sections
2. User adds section → `addSection()` creates DB record
3. User configures section → `updateSectionConfig()` saves to DB
4. User reorders sections → `reorderSections()` updates sort_order
5. Preview updates in real-time from local state
6. **Customer visits store** → `StorePage.tsx` fetches sections and renders production components

### Section Configuration
Each section type has a JSONB `config` field with type-specific properties:

```typescript
// Example: Hero Banner Config
interface HeroBannerConfig {
  title: string;
  subtitle?: string;
  buttonText?: string;
  buttonLink?: string;
  backgroundImage?: string;
  backgroundOverlay?: number;
  textAlignment?: 'left' | 'center' | 'right';
  height?: 'small' | 'medium' | 'large' | 'full';
}
```

---

## Storefront Renderer

### How Dynamic Pages Work

1. **Route**: `/store/:storeSlug/page/:pageSlug`
2. **Component**: `src/pages/storefront/StorePage.tsx`
3. **Flow**:
   - Fetch store by slug
   - Fetch active theme from `store_themes`
   - Fetch page by slug from `store_pages`
   - Fetch visible sections from `page_sections` (ordered by `sort_order`)
   - Apply theme as CSS custom properties
   - Render each section using production components from `src/components/storefront/sections/`

### Section Components

All production section components are in `src/components/storefront/sections/`:

| Component | Data Source | Description |
|-----------|-------------|-------------|
| `HeroBanner` | Config only | Static hero with background image |
| `HeroSlider` | Config only | Carousel with embla-carousel |
| `ProductGrid` | Products table | Fetches real products |
| `FeaturedProducts` | Products table | Featured products only |
| `CategoryGrid` | Categories table | Fetches real categories |
| `Newsletter` | Config only | Email signup form |
| `Testimonials` | Config only | Customer quotes |
| `FAQ` | Config only | Accordion Q&A |

---

## Database Schema

### Core Tables
| Table | Purpose |
|-------|---------|
| `stores` | Store information |
| `products` | Product catalog |
| `categories` | Product categories |
| `orders` | Customer orders |
| `order_items` | Items within orders |
| `order_status_history` | Order status audit trail |
| `customers` | Store customers |

### Store Builder Tables
| Table | Purpose |
|-------|---------|
| `store_themes` | Theme settings (colors, fonts, layout) |
| `store_pages` | Custom pages |
| `page_sections` | Page sections with config |
| `store_navigation` | Nav menus |
| `store_header_footer` | Header/footer config |

---

## Styling Guidelines

### Use Semantic Tokens
```tsx
// ✅ Good - uses semantic tokens
<div className="bg-background text-foreground border-border" />

// ❌ Bad - uses direct colors
<div className="bg-white text-black border-gray-200" />
```

### Available Tokens (index.css)
- `--background`, `--foreground` - Page background/text
- `--primary`, `--primary-foreground` - Primary buttons
- `--secondary`, `--secondary-foreground` - Secondary elements
- `--muted`, `--muted-foreground` - Muted backgrounds/text
- `--accent` - Accent color
- `--border` - Border color
- `--destructive` - Error/delete actions

---

## Adding Features

### New Dashboard Page
1. Create page in `src/pages/dashboard/`
2. Add route in `src/App.tsx` under dashboard routes
3. Add sidebar link in `src/components/dashboard/DashboardSidebar.tsx`

### New Section Type (Store Builder)

#### Step 1: Define the Type
Add to `src/components/store-builder/types.ts`:
```typescript
export type SectionType = 
  | 'hero_banner'
  | 'my_new_section'  // Add here
  | ...;

export interface MyNewSectionConfig {
  title: string;
  // Add config properties
}
```

#### Step 2: Add Section Definition
Add to `src/components/store-builder/constants.ts`:
```typescript
export const SECTION_TYPES: SectionDefinition[] = [
  // ...existing sections
  {
    type: 'my_new_section',
    label: 'My New Section',
    icon: 'Layout',
    category: 'content',
    description: 'Description here',
    defaultConfig: {
      title: 'Default Title',
    }
  }
];
```

#### Step 3: Add Preview Renderer
Add case in `src/components/store-builder/editor/PreviewFrame.tsx`:
```typescript
case 'my_new_section':
  return <MyNewSectionPreview config={section.config} />;
```

#### Step 4: Add Field Editor
Add case in `src/components/store-builder/editor/SectionEditor.tsx`:
```typescript
case 'my_new_section':
  return <MyNewSectionFields config={config} updateConfig={updateConfig} />;
```

#### Step 5: Add Production Component
Create `src/components/storefront/sections/MyNewSection.tsx`:
```typescript
export function MyNewSection({ config, storeId }: SectionProps) {
  // Production-ready component that may fetch real data
}
```

#### Step 6: Register in Storefront
Add to `src/components/storefront/sections/index.tsx` and `StorePage.tsx`.

#### Step 7: Add Database Enum (if needed)
Run migration to add to `section_type` enum.

### New Database Table
1. Create migration using Supabase migration tool
2. Include RLS policies for security
3. Types auto-generate in `src/integrations/supabase/types.ts`

---

## Versioning Guidelines

This project follows [Semantic Versioning](https://semver.org/):

| Version | When to Bump |
|---------|--------------|
| **Major (X.0.0)** | Breaking changes, major rewrites |
| **Minor (0.X.0)** | New features (e.g., Phase 3 storefront) |
| **Patch (0.0.X)** | Bug fixes, minor improvements |

### Current Version: 0.9.0
- Phase 1: Store Builder editor ✅
- Phase 2: Theme integration ✅
- Phase 3: Customer storefront renderer ✅
- Phase 3.5: Order system fix + Customer detail ✅
- Phase 4: Header/footer auto-initialization ✅
- Phase 5: Polish, custom domains (TODO)

---

## Common Patterns

### Fetching Data with Hooks
```typescript
const { data, loading, error, refetch } = useMyData(storeId);
```

### Handling Forms
```typescript
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

### Toast Notifications
```typescript
const { toast } = useToast();
toast({ title: "Success!", description: "..." });
toast({ title: "Error", variant: "destructive" });
```

---

## Troubleshooting

### Build Errors
- Check TypeScript types match database schema
- Ensure all imports are correct
- Run `npm run build` locally to catch issues

### RLS Errors
- Check user is authenticated
- Verify RLS policies allow the operation
- Use Supabase logs to debug

### State Not Updating
- Check if using the correct hook
- Verify refetch is called after mutations
- Check React Query cache settings

### Storefront Not Showing Sections
- Verify page `is_published` is true
- Check sections have `is_visible` set to true
- Confirm `sort_order` is set correctly
- Check store `status` is 'active'

### Header/Footer Not Showing
- **Fixed in v0.9.0**: Database trigger now auto-creates `store_header_footer` on store creation
- For older stores: Run backfill migration to create missing records
- Check `store_header_footer` table has a record for the store
- Verify `header_config` and `footer_config` are not null

### Orders Not Appearing
- Check console logs for `[CHECKOUT]` prefixed messages
- Verify RLS policies allow insert to `orders` and `order_items`
- Confirm customer stats are incrementing correctly
- Check `order_status_history` for status change logs

---

## Order & Customer System

### Checkout Flow
The checkout process in `src/pages/storefront/Checkout.tsx`:
1. Fetch store by slug
2. Calculate dynamic shipping (zone-based from `store_shipping_settings`)
3. Create/update customer via `create_or_update_checkout_customer` RPC
4. Create order record in `orders` table
5. Create order items in `order_items` table
6. Update customer stats (`total_orders`, `total_spent`)
7. Show success message and clear cart

### Customer Detail Page
`src/pages/dashboard/customers/CustomerDetail.tsx` features:
- Customer information display (name, email, phone, address)
- Stats cards (total orders, total spent, customer since)
- Expandable order history with items
- Order summary (subtotal, shipping, tax, total)
- Shipping address and customer notes

### Order Status History
Automatic audit trail for order status changes:
- Trigger: `log_order_status_change()` runs on UPDATE to `orders`
- Records: previous status, new status, who changed it, timestamp
- Query example:
```sql
SELECT * FROM order_status_history 
WHERE order_id = 'order-uuid' 
ORDER BY created_at DESC;
```

---

## Dashboard Routes

| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `DashboardHome` | Overview with real metrics |
| `/dashboard/products` | `ProductsList` | Manage products |
| `/dashboard/orders` | `OrdersList` | Manage orders |
| `/dashboard/orders/:id` | `OrderDetails` | Order detail view |
| `/dashboard/customers` | `CustomersList` | View customers |
| `/dashboard/customers/:id` | `CustomerDetail` | Customer detail + order history |
| `/dashboard/categories` | `CategoriesList` | Manage categories |
| `/dashboard/discounts` | `DiscountsList` | Manage discounts |
| `/dashboard/shipping` | `ShippingSettings` | Shipping zones & rates |
| `/dashboard/extensions` | `ExtensionsList` | Store extensions |
| `/dashboard/store-builder` | `StoreBuilder` | Visual page editor |
| `/dashboard/settings` | `StoreSettings` | Store settings |
| `/dashboard/profile` | `ProfilePage` | User profile |

---

## RLS Policies Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `store_themes` | Store members | Store members | Store members | Store members |
| `store_pages` | Public (published) | Store members | Store members | Store members |
| `page_sections` | Public (visible) | Store members | Store members | Store members |
| `products` | Public (active) | Store members | Store members | Store members |
| `orders` | Store members | Authenticated | Store members | - |
