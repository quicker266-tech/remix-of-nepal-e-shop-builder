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
│   ├── SectionPalette (add sections, filtered by page permissions)
│   ├── SectionList (manage sections)
│   ├── ThemeEditor (customize theme)
│   ├── PageManager (manage pages)
│   ├── PageSettings (SEO, layout, publishing)
│   ├── HeaderFooterEditor (header/footer config)
│   └── NavigationEditor (nav menu management)
├── PreviewFrame (live preview)
│   └── BuiltInContentPlaceholder (system page content indicator)
├── Right Sidebar
│   └── SectionEditor (configure selected section)
└── PageSelector (page dropdown with categories)
```

### Editor Components

| Component | File | Purpose |
|-----------|------|---------|
| `EditorHeader` | `EditorHeader.tsx` | Preview controls, responsive modes |
| `SectionPalette` | `SectionPalette.tsx` | Add sections (filtered by page type) |
| `SectionList` | `SectionList.tsx` | Reorder, toggle, delete sections |
| `SectionEditor` | `SectionEditor.tsx` | Configure selected section |
| `PageManager` | `PageManager.tsx` | Page CRUD, system page badges |
| `PageSettings` | `PageSettings.tsx` | SEO, layout, OG image, publishing |
| `PageSelector` | `PageSelector.tsx` | Page dropdown with icons |
| `ThemeEditor` | `ThemeEditor.tsx` | Colors, typography, layout |
| `PreviewFrame` | `PreviewFrame.tsx` | Live preview with theme |
| `HeaderFooterEditor` | `HeaderFooterEditor.tsx` | Header/footer tabs |
| `NavigationEditor` | `NavigationEditor.tsx` | Nav items CRUD |
| `BuiltInContentPlaceholder` | `BuiltInContentPlaceholder.tsx` | Shows where system content renders |
| `PositionToggle` | `PositionToggle.tsx` | Before/after section position |

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

## Header/Footer System

### Overview
The storefront header and footer are configured via the `store_header_footer` table and rendered by dedicated production components.

### Configuration Table: `store_header_footer`
| Field | Type | Purpose |
|-------|------|---------|
| `header_config` | JSONB | Layout, sticky, icon visibility, colors |
| `footer_config` | JSONB | Layout, newsletter, social, payment icons, colors |
| `social_links` | JSONB | URLs for Facebook, Instagram, Twitter, TikTok, YouTube |

### Header Layouts
- `logo-left` - Logo on left, nav center, actions right (default)
- `logo-center` - Logo centered, nav below
- `logo-right` - Logo on right, actions left

### Footer Layouts
- `simple` - Single row with logo, nav links, copyright
- `minimal` - Copyright and social links only
- `multi-column` - Full footer with columns, newsletter

### Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `StorefrontHeader` | `src/components/storefront/` | Production header with nav, icons |
| `StorefrontFooter` | `src/components/storefront/` | Production footer with social, newsletter |
| `HeaderFooterEditor` | `src/components/store-builder/editor/` | Editor panel with tabs |
| `NavigationEditor` | `src/components/store-builder/editor/` | Navigation menu CRUD |

---

## Section Permissions System

### Overview
Different page types have different allowed sections. System pages (cart, checkout, profile) have limited or no custom sections to preserve built-in functionality.

### Permission Levels
| Page Type | Allowed Sections | Max Sections |
|-----------|------------------|--------------|
| `homepage` | All sections | Unlimited |
| `custom` | All sections | Unlimited |
| `about`, `contact`, `policy` | Content sections only | Limited |
| `product`, `category` | Marketing, content | Limited |
| `cart`, `checkout`, `profile` | None (built-in only) | 0 |
| `search`, `order_tracking` | None (built-in only) | 0 |

### Utility Functions
Located in `src/components/store-builder/utils/sectionPermissions.ts`:

```typescript
// Check if a section type is allowed on a page type
isSectionTypeAllowed('hero_banner', 'homepage') // true
isSectionTypeAllowed('hero_banner', 'cart') // false

// Get all allowed section types for a page
getAllowedSectionTypes('homepage') // ['hero_banner', 'product_grid', ...]
getAllowedSectionTypes('cart') // []

// Check if page can have any sections
canPageHaveSections('homepage') // true
canPageHaveSections('checkout') // false

// Check if more sections can be added
canAddMoreSections('homepage', 10) // true
canAddMoreSections('about', 10) // depends on max limit
```

---

## Built-in Page Content

System pages (cart, checkout, category, product) have built-in content that renders automatically, independent of custom sections.

### Content Components
| Component | Page Type | Features |
|-----------|-----------|----------|
| `CategoryPageContent` | category | Category grid, product filtering, breadcrumbs, sorting |
| `ProductListingContent` | product | Search, filters, sorting, grid/list view |
| Cart (built-in) | cart | Cart items, quantity controls, totals |
| Checkout (built-in) | checkout | Shipping form, payment, order summary |

### Behavior
1. When `page_type` is `category` or `product`, StorePage renders the appropriate content component
2. Custom sections can be added above/below (if page type allows)
3. `BuiltInContentPlaceholder` shows in Store Builder preview where content will appear
4. Content components fetch their own data (products, categories) independently

---

## Product Reviews System

### Database Table: `product_reviews`
| Field | Type | Purpose |
|-------|------|---------|
| `id` | UUID | Primary key |
| `product_id` | UUID | FK to products |
| `store_id` | UUID | FK to stores |
| `customer_name` | TEXT | Reviewer display name |
| `customer_email` | TEXT | Reviewer email (for verification) |
| `rating` | INTEGER | 1-5 stars |
| `title` | TEXT | Review title (optional) |
| `content` | TEXT | Review body (optional) |
| `is_approved` | BOOLEAN | Moderation status (default false) |
| `created_at` | TIMESTAMPTZ | Submission time |

### RLS Policies
- **Public**: Can SELECT where `is_approved = true`
- **Authenticated**: Can INSERT reviews
- **Store members**: Full CRUD access for moderation

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

### Current Version: 1.0.0
- Phase 1: Store Builder editor ✅
- Phase 2: Theme integration ✅
- Phase 3: Customer storefront renderer ✅
- Phase 3.5: Order system fix + Customer detail ✅
- Phase 3.7: Storefront header/footer + Navigation ✅
- Phase 3.8: Built-in page content + Section permissions ✅
- Phase 3.9: Product reviews table ✅
- Phase 4: Header/footer auto-initialization ✅
- Phase 5: Custom domain & subdomain support ✅
- Phase 6: Store-specific customer authentication ✅

---

## Domain & Subdomain Support

### Overview
The platform supports multiple domain modes for storefronts:
1. **Path-based routing**: `/store/{storeSlug}/...` (default)
2. **Subdomain routing**: `{storeSlug}.extendbee.com/...`
3. **Custom domain**: `store.customdomain.com` (future)

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/subdomain.ts` | Domain detection utilities |
| `src/contexts/StorefrontContext.tsx` | Unified store data provider |
| `src/routes/StorefrontRoutes.tsx` | Route configuration |

### Domain Utilities (subdomain.ts)

```typescript
// Check if on a store subdomain
isStorefrontSubdomain() // => true/false

// Get store slug from subdomain
getStoreSlugFromSubdomain() // => 'bombay' or null

// Check if on main platform domain
isMainDomain() // => true/false

// Build correct URL based on routing mode
buildStoreUrl('bombay', '/product/xyz')
// Subdomain mode: '/product/xyz'
// Path mode: '/store/bombay/product/xyz'
```

### Configuration
Add production domains to `SUBDOMAIN_ENABLED_DOMAINS` in `subdomain.ts`:
```typescript
const SUBDOMAIN_ENABLED_DOMAINS = [
  'extendbee.com',
  'nepal-shop-nest.lovable.app',
];
```

Reserved subdomains (www, admin, api, etc.) are excluded from store detection.

### Storefront Context

The `StorefrontContext` provides unified store data to all storefront pages, reducing duplicate API calls.

```typescript
// Access store data in any storefront component
const { 
  store,           // Store details
  storeId,         // Store UUID
  storeSlug,       // Store slug
  theme,           // Active theme
  headerFooter,    // Header/footer config
  navItems,        // Navigation items
  loading,         // Loading state
  error,           // Error message
  isSubdomainMode, // Routing mode
  refetch,         // Refetch data
} = useStorefront();
```

---

## Store-Specific Customer Authentication

### Overview
Each store has its own isolated customer database. Customers register and log in per-store, not globally. This allows the same email to have different accounts in different stores.

### Database Tables

| Table | Purpose |
|-------|---------|
| `store_customer_accounts` | Email + password hash per store |
| `store_customer_sessions` | Token-based sessions with expiry |

### Authentication Flow

```
1. Customer registers → store_customer_accounts record created
2. Customer logs in → password verified, session token generated
3. Session stored → store_customer_sessions with 30-day expiry
4. Token stored → localStorage per store (storeId_customer_token)
5. Validate session → on page load, verify token via RPC
6. Logout → session deleted from database + localStorage
```

### RPC Functions

| Function | Purpose |
|----------|---------|
| `store_customer_register` | Create account with hashed password |
| `store_customer_login` | Verify password, create session |
| `store_customer_validate_session` | Check token validity |
| `store_customer_logout` | Delete session |
| `store_customer_update_profile` | Update customer details |
| `store_customer_get_orders` | Fetch customer's orders |

### Edge Function: store-customer-auth

Handles secure password hashing using SHA-256. Located at `supabase/functions/store-customer-auth/`.

**Endpoints:**
- `POST /register` - Hash password, call register RPC
- `POST /login` - Hash password, call login RPC
- `POST /validate` - Validate session token
- `POST /logout` - Invalidate session
- `GET /profile` - Get customer profile
- `PUT /profile` - Update profile
- `GET /orders` - Get customer orders

### Context Usage

```typescript
// In storefront components
const { 
  customer,      // Current customer data
  isLoggedIn,    // Authentication status
  loading,       // Loading state
  login,         // Login function
  register,      // Register function
  logout,        // Logout function
  updateProfile, // Update profile function
  refreshProfile // Refresh customer data
} = useStoreCustomerAuth();
```

### Store Isolation
- Customer tokens are scoped to store ID: `{storeId}_customer_token`
- Same email can exist in multiple stores with different passwords
- Orders are linked to store-specific customer records

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
| `store_customer_accounts` | Store-scoped | Via RPC only | Via RPC only | - |
| `store_customer_sessions` | Store-scoped | Via RPC only | Via RPC only | Via RPC only |

---

## Contexts Reference

| Context | File | Purpose |
|---------|------|---------|
| `AuthContext` | `src/contexts/AuthContext.tsx` | Platform user authentication (store owners) |
| `CartContext` | `src/contexts/CartContext.tsx` | Shopping cart state per store |
| `StoreContext` | `src/contexts/StoreContext.tsx` | Current store selection (dashboard) |
| `StorefrontContext` | `src/contexts/StorefrontContext.tsx` | Unified storefront data (theme, nav, etc.) |
| `StoreCustomerAuthContext` | `src/contexts/StoreCustomerAuthContext.tsx` | Store-specific customer authentication |

---

## Key Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useStoreBuilder` | `src/hooks/useStoreBuilder.ts` | Store builder data fetching |
| `useStoreLinks` | `src/hooks/useStoreLinks.ts` | Generate store-aware URLs |
| `useStorefront` | `src/contexts/StorefrontContext.tsx` | Access storefront context |
| `useStoreCustomerAuth` | `src/contexts/StoreCustomerAuthContext.tsx` | Customer auth operations |

---

## File Structure: Customer Auth System

```
src/
├── contexts/
│   └── StoreCustomerAuthContext.tsx  # Customer auth provider + hook
├── pages/storefront/
│   ├── CustomerAuth.tsx              # Login/Register forms
│   ├── CustomerAccount.tsx           # Account dashboard
│   ├── CustomerProfile.tsx           # Profile management
│   └── CustomerOrders.tsx            # Order history
supabase/
├── functions/
│   └── store-customer-auth/
│       └── index.ts                  # Password hashing + auth endpoints
└── migrations/
    └── [timestamp]_store_customer_auth.sql  # Tables + RPC functions
```
