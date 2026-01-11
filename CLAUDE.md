# CLAUDE.md - AI Development Assistant Rules

**Version:** 0.7.0  
**Project:** PasalHub - Multi-Tenant E-Commerce Platform  
**Last Updated:** January 11, 2026

---

## 🎯 Core Mandate

**ALWAYS ask before generating code. NEVER run code without explicit approval.**

1. **Discuss first** - Understand requirements and architecture
2. **Get approval** - Wait for user confirmation before coding
3. **No auto-execution** - Never run code without permission

---

## 📚 Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (semantic tokens) + shadcn/ui
- **Routing:** React Router v6
- **State:** TanStack Query + React Context (Auth, Store, Cart)

### Backend (Supabase via Lovable Cloud)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Auth:** Supabase Auth (email/password)
- **Storage:** Supabase Storage (product images)
- **Serverless:** Edge Functions

### Package Manager
- **Runtime:** Bun (faster alternative to Node.js/npm)
- **Commands:** Use `bun` instead of `npm` for all operations

### Key Dependencies
```json
{
  "react": "^18.3.1",
  "@supabase/supabase-js": "^2.89.0",
  "@tanstack/react-query": "^5.83.0",
  "react-router-dom": "^6.30.1",
  "lucide-react": "^0.462.0",
  "zod": "^3.25.76",
  "react-hook-form": "^7.61.1"
}
```

---

## 🏗️ Architecture Overview

### Multi-Tenant Structure
- **Tenant Isolation:** Each store is independent via `store_id` foreign keys
- **RLS Policies:** Database-level access control (no store can see another's data)
- **Super Admin:** Bypass access via `is_super_admin()` function

### Core Modules
```
src/
├── components/
│   ├── ui/                 # shadcn/ui base components
│   ├── dashboard/          # Store admin UI
│   ├── store-builder/      # Visual editor (26 section types)
│   ├── storefront/         # Customer-facing components
│   └── products/           # Product management
├── contexts/
│   ├── AuthContext.tsx     # Authentication state
│   ├── StoreContext.tsx    # Current store selection
│   └── CartContext.tsx     # Shopping cart
├── pages/
│   ├── dashboard/          # Store owner pages
│   ├── admin/              # Super admin pages
│   └── storefront/         # Customer pages
└── integrations/
    └── supabase/           # Client + auto-generated types
```

---

## 📊 Database Schema (20 Tables)

### Core Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `stores` | Store instances | `id`, `owner_id`, `slug`, `status` |
| `products` | Product catalog | `id`, `store_id`, `category_id`, `price`, `images` |
| `product_variants` | Product options | `product_id`, `name`, `price`, `stock` |
| `categories` | Product categories | `id`, `store_id`, `parent_id`, `slug` |
| `orders` | Customer orders | `id`, `store_id`, `customer_id`, `status`, `total` |
| `order_items` | Order line items | `order_id`, `product_id`, `quantity`, `unit_price` |
| `order_status_history` | Status audit trail | `order_id`, `status`, `changed_by`, `notes` |
| `customers` | Store customers | `id`, `store_id`, `user_id`, `email` |
| `discount_codes` | Promo codes | `store_id`, `code`, `discount_type`, `discount_value` |

### Store Builder Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `store_themes` | Visual themes | `colors` (JSON), `typography` (JSON), `layout` (JSON) |
| `store_pages` | Custom pages | `title`, `slug`, `page_type`, `is_published` |
| `page_sections` | Page sections | `section_type`, `config` (JSON), `sort_order` |
| `page_templates` | Default sections per page type | `business_type`, `page_type`, `default_sections` |
| `store_navigation` | Nav menus | `label`, `url`, `location`, `sort_order` |
| `store_header_footer` | Header/footer config | `store_id`, `header_config`, `footer_config` |

### Configuration Tables
| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `store_shipping_settings` | Shipping zones & rates | `store_id`, `shipping_zones`, `free_shipping_threshold` |
| `store_extensions` | Integrations | `store_id`, `extension_type`, `config`, `is_enabled` |
| `store_staff` | Staff access | `store_id`, `user_id`, `role` |
| `profiles` | User profiles | `id`, `full_name`, `avatar_url` |
| `user_roles` | App-wide roles | `user_id`, `role` (super_admin, store_owner, customer) |

### Section Types (26 Total)
```typescript
type SectionType =
  // Built-in (auto-added, not removable)
  | 'header' | 'footer'
  // Hero
  | 'hero_banner' | 'hero_slider' | 'hero_video'
  // Products
  | 'featured_products' | 'product_grid' | 'product_carousel' | 'new_arrivals' | 'best_sellers'
  // Categories
  | 'category_grid' | 'category_banner'
  // Content
  | 'text_block' | 'image_text' | 'gallery' | 'testimonials' | 'faq'
  // Marketing
  | 'announcement_bar' | 'newsletter' | 'countdown' | 'promo_banner'
  // Social/Trust
  | 'social_feed' | 'trust_badges' | 'brand_logos'
  // Utility
  | 'custom_html' | 'spacer' | 'divider';
```

### Page Types with Standard Sections
Each page type has predefined sections that are auto-initialized:

| Page Type | Standard Sections |
|-----------|-------------------|
| `homepage` | hero_banner, featured_products, category_grid, testimonials, newsletter |
| `product` | Built-in product display (not customizable via sections) |
| `category` | Built-in category listing |
| `cart` | Built-in cart display |
| `checkout` | Built-in checkout form |
| `custom` | Empty - user adds sections manually |

---

## 🔒 Security & Access Control

### RLS Helper Functions
```sql
-- Check store access (owner or staff)
can_access_store(user_id, store_id) → boolean

-- Check super admin
is_super_admin(user_id) → boolean

-- Check role
has_role(user_id, role) → boolean
```

### Access Patterns
- **Store Owners:** Full access to their stores via `owner_id`
- **Store Staff:** Limited access via `store_staff` table
- **Super Admins:** Bypass RLS for all stores
- **Customers:** Read-only access to published content

---

## 🎨 Store Builder System

### How It Works
1. **User creates page** → `store_pages` row created
2. **System auto-initializes** → Sections added based on `page_type` templates
3. **User configures** → `config` JSONB updated
4. **User reorders** → `sort_order` updated
5. **Preview updates** → Real-time from local state
6. **User publishes** → `is_published = true`

### Section Configuration (JSONB)
```typescript
// Example: hero_banner config
{
  title: "Welcome to Our Store",
  subtitle: "Shop the latest collection",
  buttonText: "Shop Now",
  buttonLink: "/store/mystore/shop",
  backgroundImage: "https://...",
  textAlignment: "center",
  height: "large"
}
```

### Page Auto-Initialization Flow
When a new page is created:
1. Check `page_type` (homepage, product, category, cart, checkout, custom)
2. For `homepage`: Auto-add hero_banner, featured_products, category_grid, testimonials, newsletter
3. For built-in types (product, category, cart, checkout): No sections needed - content is code-driven
4. For `custom`: Start empty, user adds sections manually

### Dynamic Page Rendering
```
URL: /store/:storeSlug/page/:pageSlug
  ↓
1. Fetch store by slug
2. Fetch active theme
3. Fetch page by slug
4. Fetch sections (ordered by sort_order, where is_visible=true)
5. Apply theme as CSS variables
6. Render sections using storefront components
```

---

## 🛣️ Route Structure

### Dashboard Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/dashboard` | `DashboardHome` | Overview metrics |
| `/dashboard/create-store` | `CreateStore` | New store form |
| `/dashboard/categories` | `CategoriesList` | Category management |
| `/dashboard/products` | `ProductsList` | Product list |
| `/dashboard/products/new` | `ProductForm` | Create product |
| `/dashboard/products/:id/edit` | `ProductForm` | Edit product |
| `/dashboard/orders` | `OrdersList` | Order list |
| `/dashboard/orders/:id` | `OrderDetails` | Order details + status updates |
| `/dashboard/customers` | `CustomersList` | Customer list |
| `/dashboard/discounts` | `DiscountsList` | Discount codes |
| `/dashboard/shipping` | `ShippingSettings` | Delivery zones & rates |
| `/dashboard/extensions` | `ExtensionsList` | Integrations (Analytics, WhatsApp) |
| `/dashboard/settings` | `StoreSettings` | Store config |
| `/dashboard/store-builder` | `StoreBuilder` | Visual page editor |
| `/dashboard/profile` | `ProfilePage` | User profile |

### Storefront Routes
| Route | Component | Purpose |
|-------|-----------|---------|
| `/store/:storeSlug` | `StorePage` | Store homepage |
| `/store/:storeSlug/page/:pageSlug` | `StorePage` | Custom pages |
| `/store/:storeSlug/catalog` | `StoreCatalog` | Product listing |
| `/store/:storeSlug/category/:categorySlug` | `StoreCatalog` | Category products |
| `/store/:storeSlug/product/:productSlug` | `ProductDetail` | Product page |
| `/store/:storeSlug/cart` | `Cart` | Shopping cart |
| `/store/:storeSlug/checkout` | `Checkout` | Checkout flow |

### Admin Routes (Super Admin)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/admin` | `AdminOverview` | Platform metrics |
| `/admin/stores` | `AdminStores` | All stores management |
| `/admin/users` | `AdminUsers` | User management |

---

## 🛒 Checkout Flow

### Current Implementation
1. User fills form (name, email, phone, address, city)
2. Shipping calculated from `store_shipping_settings` based on city
3. Customer created/updated via `create_or_update_checkout_customer` RPC
4. Order saved to `orders` table with status `pending`
5. Order items saved to `order_items` table
6. Cart cleared, success message shown

### Order Status Workflow
```
pending → processing → shipped → delivered
                   ↘ cancelled
```

Status changes are automatically logged to `order_status_history` via database trigger.

---

## 🛠️ Development Rules

### File Organization
- **Dashboard pages:** `src/pages/dashboard/`
- **Storefront pages:** `src/pages/storefront/`
- **Shared components:** `src/components/`
- **Store Builder:** `src/components/store-builder/`

### Styling Guidelines
```tsx
// ✅ ALWAYS use semantic tokens
<div className="bg-background text-foreground" />
<button className="bg-primary text-primary-foreground" />

// ❌ NEVER use direct colors
<div className="bg-white text-black" />
<button className="bg-blue-500 text-white" />
```

### Data Fetching Pattern
```typescript
// Use TanStack Query
const { data, isLoading, error } = useQuery({
  queryKey: ['products', storeId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('store_id', storeId);
    if (error) throw error;
    return data;
  }
});
```

### Form Handling Pattern
```typescript
// Use react-hook-form + zod
const form = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});

const onSubmit = async (values: FormValues) => {
  // Handle submission
};
```

---

## 📁 Critical File Locations

### Type Definitions
- `src/integrations/supabase/types.ts` - Auto-generated from DB (DO NOT EDIT)
- `src/components/store-builder/types.ts` - Store Builder types

### Constants & Config
- `src/components/store-builder/constants.ts` - Section definitions
- `.env` - Supabase credentials (auto-managed by Lovable)

### Context Providers
- `src/contexts/AuthContext.tsx` - User authentication
- `src/contexts/StoreContext.tsx` - Current store selection
- `src/contexts/CartContext.tsx` - Shopping cart state

### Key Hooks
- `src/hooks/useStoreBuilder.ts` - Store builder state management

---

## 🚨 Common Pitfalls to Avoid

1. **Multi-Tenancy Violations**
   - ❌ Querying without `store_id` filter
   - ✅ Always filter by current store: `.eq('store_id', currentStore.id)`

2. **RLS Policy Errors**
   - ❌ Forgetting to enable RLS on new tables
   - ✅ Always add policies after creating tables

3. **Type Mismatches**
   - ❌ Using outdated types after schema changes
   - ✅ Types auto-regenerate after migrations

4. **Direct Color Usage**
   - ❌ `className="bg-blue-500"`
   - ✅ `className="bg-primary"`

5. **State Management**
   - ❌ Storing server state in useState
   - ✅ Use TanStack Query for server data

6. **Editing Auto-Generated Files**
   - ❌ Modifying `src/integrations/supabase/types.ts`
   - ❌ Modifying `src/integrations/supabase/client.ts`
   - ❌ Modifying `.env`
   - ✅ These are auto-managed by Lovable Cloud

---

## 🔄 Workflow for Adding Features

### New Dashboard Page
1. Create in `src/pages/dashboard/`
2. Add route in `src/App.tsx`
3. Add sidebar link in `DashboardSidebar.tsx`

### New Section Type
1. Add type to `src/components/store-builder/types.ts`
2. Add definition to `src/components/store-builder/constants.ts`
3. Add preview in `PreviewFrame.tsx`
4. Add editor fields in `SectionEditor.tsx`
5. Create production component in `src/components/storefront/sections/`
6. Register in `src/components/storefront/sections/index.tsx`

### New Database Table
1. Create migration via Lovable migration tool
2. Enable RLS in migration
3. Add policies in migration
4. Types auto-regenerate after approval

---

## 🎯 Current Project Status

**Version:** 0.7.0

### Completed ✅
- Store Builder foundation (26 section types)
- Theme system with CSS variables
- Dynamic page rendering with auto-initialization
- Product management with variants and images
- Category management with hierarchy
- Multi-tenant architecture with RLS
- Dashboard and admin interfaces
- Shipping settings with zone-based rates
- Extensions system (Google Analytics, WhatsApp)
- Order management with status history
- Customer management
- Discount codes system

### In Progress 🚧
- Customer detail page (`/dashboard/customers/:id`)
- Real dashboard metrics (currently placeholder)
- Template library for store designs

---

## 📞 Quick Reference

### Environment Variables (Auto-Managed)
```bash
VITE_SUPABASE_URL=https://fkvxtuwkveirnxegzepy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=[auto-provided]
VITE_SUPABASE_PROJECT_ID=fkvxtuwkveirnxegzepy
```

### Local Development
```bash
bun install          # Install dependencies
bun run dev          # Start dev server (localhost:8080)
bun run build        # Production build
bun run lint         # Run ESLint
```

### Database Access
```typescript
import { supabase } from '@/integrations/supabase/client';

// Query with store isolation
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId);
```

---

**Remember: This is a Lovable-managed project. Focus on:**
- Working within existing architecture
- Adding features to Store Builder
- Using Lovable Cloud for backend logic
- Following multi-tenant patterns

**Always discuss first, code second. 🚀**
