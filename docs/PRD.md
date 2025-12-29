# PasalHub - Product Requirements Document

**Version:** 0.5.0  
**Last Updated:** December 29, 2025  
**Status:** Active Development

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Technical Architecture](#2-technical-architecture)
3. [Database Schema](#3-database-schema)
4. [Row Level Security Policies](#4-row-level-security-policies)
5. [Feature Specifications](#5-feature-specifications)
6. [API Layer](#6-api-layer)
7. [User Flows](#7-user-flows)
8. [Known Issues and Limitations](#8-known-issues-and-limitations)
9. [Future Roadmap](#9-future-roadmap)
10. [Testing Guide](#10-testing-guide)
11. [Environment Configuration](#11-environment-configuration)
12. [Security Considerations](#12-security-considerations)
13. [Glossary](#13-glossary)

---

## 1. Executive Summary

### 1.1 Product Vision

PasalHub is a **multi-tenant e-commerce platform** that enables anyone to create and manage their own online store without coding knowledge. It provides a Shopify-like experience with a visual drag-and-drop store builder, comprehensive product management, order processing, and customer relationship tools.

### 1.2 Target Users

| User Type | Description |
|-----------|-------------|
| **Store Owners (Tenants)** | Entrepreneurs, small businesses, and retailers who want to sell products online |
| **End Customers** | Shoppers who browse and purchase from individual stores |
| **Platform Administrators** | Super admins who manage the entire platform, monitor stores, and handle support |

### 1.3 Core Value Proposition

- **No-Code Store Creation**: Visual store builder with 26+ customizable section types
- **Multi-Tenant Architecture**: Each store is isolated with its own products, orders, customers, and branding
- **Complete E-Commerce Suite**: Products, variants, categories, orders, discounts, and customer management
- **Customizable Storefronts**: Theme editor with colors, typography, and layout controls
- **Role-Based Access**: Granular permissions for store owners, staff, and super admins

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend Framework** | React 18 | Component-based UI |
| **Language** | TypeScript | Type-safe development |
| **Build Tool** | Vite | Fast development and bundling |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **UI Components** | shadcn/ui | Accessible component library |
| **Routing** | React Router v6 | Client-side navigation |
| **State Management** | TanStack Query | Server state and caching |
| **Context** | React Context | Global state (Auth, Cart, Store) |
| **Backend** | Lovable Cloud (Supabase) | BaaS with PostgreSQL |
| **Database** | PostgreSQL | Relational data storage |
| **Authentication** | Supabase Auth | Email/password authentication |
| **Storage** | Supabase Storage | File uploads (images) |
| **Serverless** | Edge Functions | Custom backend logic |

### 2.2 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Landing    │  │   Auth      │  │  Dashboard  │  │  Storefront │        │
│  │   Page      │  │   Pages     │  │   (Tenant)  │  │  (Customer) │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │   Super     │  │   Store     │  │   Shared    │                         │
│  │   Admin     │  │   Builder   │  │   UI (shadcn)│                        │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
│                                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                           CONTEXTS & STATE                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                         │
│  │ AuthContext │  │ StoreContext│  │ CartContext │                         │
│  └─────────────┘  └─────────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD (Supabase)                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   Auth      │  │  Database   │  │   Storage   │  │    Edge     │        │
│  │  Service    │  │ (PostgreSQL)│  │   Buckets   │  │  Functions  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────┐       │
│  │                    Row Level Security (RLS)                      │       │
│  │  • can_access_store(user_id, store_id) - Tenant isolation       │       │
│  │  • is_super_admin(user_id) - Admin bypass                       │       │
│  └─────────────────────────────────────────────────────────────────┘       │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Project Structure

```
src/
├── components/
│   ├── ui/                    # shadcn/ui components
│   ├── dashboard/             # Dashboard layout components
│   │   ├── DashboardHeader.tsx
│   │   ├── DashboardSidebar.tsx
│   │   └── StoreSwitcher.tsx
│   ├── admin/                 # Super admin components
│   │   ├── SuperAdminHeader.tsx
│   │   └── SuperAdminSidebar.tsx
│   ├── products/              # Product management components
│   │   ├── ImageUpload.tsx
│   │   ├── ProductVariantsSection.tsx
│   │   └── QuickCategoryModal.tsx
│   ├── store-builder/         # Visual store builder
│   │   ├── StoreBuilder.tsx   # Main container
│   │   ├── types.ts           # Type definitions
│   │   ├── constants.ts       # Section configurations
│   │   └── editor/            # Editor components
│   │       ├── EditorHeader.tsx
│   │       ├── PageManager.tsx
│   │       ├── PreviewFrame.tsx
│   │       ├── SectionEditor.tsx
│   │       ├── SectionList.tsx
│   │       ├── SectionPalette.tsx
│   │       └── ThemeEditor.tsx
│   └── storefront/            # Customer-facing components
│       └── sections/          # 19 production section renderers
│           ├── index.tsx      # Section registry
│           ├── HeroBanner.tsx
│           ├── ProductGrid.tsx
│           └── ... (17 more)
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   ├── CartContext.tsx        # Shopping cart state
│   └── StoreContext.tsx       # Current store selection
├── hooks/
│   ├── useStoreBuilder.ts     # Store builder data hooks
│   ├── use-mobile.tsx         # Responsive detection
│   └── use-toast.ts           # Toast notifications
├── layouts/
│   ├── DashboardLayout.tsx    # Tenant dashboard wrapper
│   └── SuperAdminLayout.tsx   # Admin dashboard wrapper
├── pages/
│   ├── Index.tsx              # Router entry
│   ├── LandingPage.tsx        # Marketing homepage
│   ├── AuthPage.tsx           # Login/Signup
│   ├── NotFound.tsx           # 404 page
│   ├── admin/                 # Super admin pages
│   │   ├── AdminOverview.tsx
│   │   ├── AdminStores.tsx
│   │   └── AdminUsers.tsx
│   ├── dashboard/             # Tenant dashboard pages
│   │   ├── DashboardHome.tsx
│   │   ├── CreateStore.tsx
│   │   ├── products/
│   │   ├── orders/
│   │   ├── customers/
│   │   ├── categories/
│   │   ├── discounts/
│   │   ├── settings/
│   │   └── profile/
│   └── storefront/            # Customer-facing pages
│       ├── StorePage.tsx      # Dynamic page renderer
│       ├── StoreCatalog.tsx   # Product listing
│       ├── ProductDetail.tsx  # Product details
│       ├── Cart.tsx           # Shopping cart
│       └── Checkout.tsx       # Checkout flow
├── integrations/
│   └── supabase/
│       ├── client.ts          # Supabase client (auto-generated)
│       └── types.ts           # Database types (auto-generated)
├── lib/
│   └── utils.ts               # Utility functions
├── App.tsx                    # Root component with routes
├── App.css                    # Global styles
├── index.css                  # Tailwind and CSS variables
└── main.tsx                   # Application entry point
```

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│    profiles     │       │   user_roles    │       │     stores      │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │───────│ user_id (FK)    │       │ owner_id (FK)   │
│ full_name       │       │ role            │       │ name            │
│ avatar_url      │       │ created_at      │       │ slug (UNIQUE)   │
│ phone           │       └─────────────────┘       │ status          │
│ created_at      │                                 │ logo_url        │
│ updated_at      │                                 │ settings (JSON) │
└─────────────────┘                                 │ created_at      │
                                                    └────────┬────────┘
                                                             │
                    ┌────────────────────────────────────────┼────────────────────────────────────────┐
                    │                    │                   │                    │                   │
                    ▼                    ▼                   ▼                    ▼                   ▼
          ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
          │   store_staff   │  │    products     │  │   categories    │  │    customers    │  │ discount_codes  │
          ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤  ├─────────────────┤
          │ id (PK)         │  │ id (PK)         │  │ id (PK)         │  │ id (PK)         │  │ id (PK)         │
          │ store_id (FK)   │  │ store_id (FK)   │  │ store_id (FK)   │  │ store_id (FK)   │  │ store_id (FK)   │
          │ user_id (FK)    │  │ category_id(FK) │  │ parent_id (FK)  │  │ user_id (FK)    │  │ code            │
          │ role            │  │ name            │  │ name            │  │ email           │  │ discount_type   │
          │ created_at      │  │ price           │  │ slug            │  │ full_name       │  │ discount_value  │
          └─────────────────┘  │ status          │  │ sort_order      │  │ total_orders    │  │ is_active       │
                               │ images (JSON)   │  │ image_url       │  │ total_spent     │  │ expires_at      │
                               │ featured        │  └─────────────────┘  └────────┬────────┘  └─────────────────┘
                               └────────┬────────┘                                │
                                        │                                         │
                                        ▼                                         │
                              ┌─────────────────┐                                 │
                              │product_variants │                                 │
                              ├─────────────────┤                                 │
                              │ id (PK)         │                                 │
                              │ product_id (FK) │                                 │
                              │ name            │                                 │
                              │ sku             │                                 │
                              │ price           │                                 │
                              │ stock_quantity  │                                 │
                              │ attributes(JSON)│                                 │
                              └─────────────────┘                                 │
                                                                                  │
                              ┌─────────────────┐                                 │
                              │     orders      │◄────────────────────────────────┘
                              ├─────────────────┤
                              │ id (PK)         │
                              │ store_id (FK)   │
                              │ customer_id(FK) │
                              │ order_number    │
                              │ status          │
                              │ subtotal        │
                              │ total           │
                              │ shipping_address│
                              └────────┬────────┘
                                       │
                                       ▼
                              ┌─────────────────┐
                              │   order_items   │
                              ├─────────────────┤
                              │ id (PK)         │
                              │ order_id (FK)   │
                              │ product_id (FK) │
                              │ variant_id (FK) │
                              │ quantity        │
                              │ unit_price      │
                              │ total_price     │
                              └─────────────────┘


         STORE BUILDER TABLES
         ═════════════════════

┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│  store_themes   │       │   store_pages   │       │ page_sections   │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │       │ id (PK)         │
│ store_id (FK)   │───────│ store_id (FK)   │───────│ store_id (FK)   │
│ name            │       │ title           │       │ page_id (FK)    │
│ is_active       │       │ slug            │       │ section_type    │
│ colors (JSON)   │       │ page_type       │       │ name            │
│ typography(JSON)│       │ is_published    │       │ config (JSON)   │
│ layout (JSON)   │       │ show_header     │       │ sort_order      │
│ custom_css      │       │ show_footer     │       │ is_visible      │
└─────────────────┘       │ seo_title       │       └─────────────────┘
                          │ seo_description │
                          └─────────────────┘

┌─────────────────┐       ┌─────────────────────┐
│store_navigation │       │ store_header_footer │
├─────────────────┤       ├─────────────────────┤
│ id (PK)         │       │ id (PK)             │
│ store_id (FK)   │       │ store_id (FK)       │
│ page_id (FK)    │       │ header_config(JSON) │
│ label           │       │ footer_config(JSON) │
│ url             │       │ social_links (JSON) │
│ location        │       └─────────────────────┘
│ sort_order      │
│ is_highlighted  │
└─────────────────┘
```

### 3.2 Core Tables Detail

#### `stores`
The central table for multi-tenancy. Each store is an independent e-commerce instance.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| owner_id | uuid | No | - | Reference to auth.users |
| name | text | No | - | Store display name |
| slug | text | No | - | URL-friendly identifier (unique) |
| description | text | Yes | - | Store description |
| logo_url | text | Yes | - | Logo image URL |
| banner_url | text | Yes | - | Banner image URL |
| status | store_status | No | 'pending' | active, inactive, suspended, pending |
| settings | jsonb | Yes | '{}' | Store configuration (currency, etc.) |
| email | text | Yes | - | Contact email |
| phone | text | Yes | - | Contact phone |
| address | text | Yes | - | Physical address |
| city | text | Yes | - | City |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

#### `products`
Product catalog for each store.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| store_id | uuid | No | - | Parent store reference |
| category_id | uuid | Yes | - | Category reference |
| name | text | No | - | Product name |
| slug | text | No | - | URL-friendly identifier |
| description | text | Yes | - | Product description |
| sku | text | Yes | - | Stock keeping unit |
| barcode | text | Yes | - | Barcode/UPC |
| price | numeric | No | 0 | Base price |
| compare_at_price | numeric | Yes | - | Original price (for sales) |
| cost_price | numeric | Yes | - | Cost to store |
| stock_quantity | integer | No | 0 | Available stock |
| track_inventory | boolean | Yes | true | Whether to track stock |
| status | product_status | No | 'draft' | draft, active, archived |
| images | jsonb | Yes | '[]' | Array of image URLs |
| attributes | jsonb | Yes | '{}' | Custom attributes |
| featured | boolean | Yes | false | Featured product flag |
| seo_title | text | Yes | - | SEO page title |
| seo_description | text | Yes | - | SEO meta description |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

#### `orders`
Customer orders with full lifecycle tracking.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| store_id | uuid | No | - | Parent store reference |
| customer_id | uuid | Yes | - | Customer reference |
| order_number | text | No | - | Human-readable order ID |
| status | order_status | No | 'pending' | pending, confirmed, processing, shipped, delivered, cancelled, refunded |
| subtotal | numeric | No | 0 | Sum of line items |
| discount_amount | numeric | Yes | 0 | Applied discounts |
| shipping_amount | numeric | Yes | 0 | Shipping cost |
| tax_amount | numeric | Yes | 0 | Tax amount |
| total | numeric | No | 0 | Final order total |
| shipping_address | jsonb | Yes | - | Shipping address object |
| billing_address | jsonb | Yes | - | Billing address object |
| notes | text | Yes | - | Customer notes |
| internal_notes | text | Yes | - | Staff notes |
| created_at | timestamptz | No | now() | Order placed timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

#### `page_sections`
Store builder section configurations.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | uuid | No | gen_random_uuid() | Primary key |
| store_id | uuid | No | - | Parent store reference |
| page_id | uuid | No | - | Parent page reference |
| section_type | section_type | No | - | One of 26 section types |
| name | text | No | - | Section display name |
| config | jsonb | No | '{}' | Section-specific configuration |
| mobile_config | jsonb | Yes | - | Mobile-specific overrides |
| sort_order | integer | No | 0 | Position in page |
| is_visible | boolean | No | true | Visibility toggle |
| created_at | timestamptz | No | now() | Creation timestamp |
| updated_at | timestamptz | No | now() | Last update timestamp |

### 3.3 Enums

```sql
-- Store status
CREATE TYPE store_status AS ENUM ('active', 'inactive', 'suspended', 'pending');

-- Product status
CREATE TYPE product_status AS ENUM ('draft', 'active', 'archived');

-- Order status
CREATE TYPE order_status AS ENUM (
  'pending', 'confirmed', 'processing', 
  'shipped', 'delivered', 'cancelled', 'refunded'
);

-- User roles
CREATE TYPE app_role AS ENUM ('customer', 'tenant', 'super_admin');

-- Page types
CREATE TYPE page_type AS ENUM ('home', 'about', 'contact', 'faq', 'custom', 'product', 'category', 'collection');

-- Navigation location
CREATE TYPE nav_location AS ENUM ('header', 'footer', 'both');

-- Section types (26 total)
CREATE TYPE section_type AS ENUM (
  'hero-banner', 'hero-slider', 'hero-video',
  'product-grid', 'featured-products', 'product-carousel', 'new-arrivals', 'best-sellers',
  'category-grid', 'category-banner',
  'text-block', 'image-text', 'gallery', 'testimonials', 'faq',
  'announcement-bar', 'newsletter', 'countdown', 'promo-banner', 'trust-badges', 'brand-logos',
  'custom-html', 'spacer', 'divider',
  'video-section', 'map-section'
);
```

### 3.4 Multi-Tenancy Implementation

All tenant-specific data includes a `store_id` column that references the `stores` table. Row Level Security (RLS) policies enforce data isolation:

```sql
-- Helper function for tenant access control
CREATE OR REPLACE FUNCTION can_access_store(user_id uuid, store_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stores WHERE id = store_id AND owner_id = user_id
  ) OR EXISTS (
    SELECT 1 FROM store_staff WHERE store_id = store_id AND user_id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function for super admin check
CREATE OR REPLACE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = user_id AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. Row Level Security Policies

### 4.1 Policy Matrix

| Table | Public Read | Tenant CRUD | Super Admin | Notes |
|-------|-------------|-------------|-------------|-------|
| `stores` | Active only | Own stores (owner_id) | Full access | Public can view active stores |
| `products` | Active + store active | Store members | - | Products visible when store is active |
| `categories` | Store active | Store members | - | Categories visible for active stores |
| `orders` | - | Store members | View all | No public access |
| `order_items` | - | Via order access | - | Inherits from orders |
| `customers` | - | Store members | - | No public access |
| `discount_codes` | - | Store members | - | No public access |
| `product_variants` | Active product + store | Store members | - | Via product visibility |
| `profiles` | - | Own profile | View all | Users see only their profile |
| `user_roles` | - | Own roles | Full access | Users see only their roles |
| `store_staff` | - | Owner manages, staff views | Full access | Staff can view membership |
| `store_themes` | Active theme + store active | Store members | - | One active theme visible |
| `store_pages` | Published + store active | Store members | - | Published pages visible |
| `page_sections` | Visible + page published | Store members | - | Visible sections only |
| `store_navigation` | Store active | Store members | - | Navigation visible |
| `store_header_footer` | Store active | Store members | - | Header/footer visible |

### 4.2 Key RLS Policy Examples

```sql
-- Products: Public can view active products of active stores
CREATE POLICY "Anyone can view active products"
ON products FOR SELECT
USING (
  status = 'active' AND
  EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = products.store_id 
    AND stores.status = 'active'
  )
);

-- Products: Store members can manage all products
CREATE POLICY "Store members can manage products"
ON products FOR ALL
USING (can_access_store(auth.uid(), store_id));

-- Orders: Store members can manage orders
CREATE POLICY "Store members can manage orders"
ON orders FOR ALL
USING (can_access_store(auth.uid(), store_id));

-- Orders: Super admins can view all orders
CREATE POLICY "Super admins can view all orders"
ON orders FOR SELECT
USING (is_super_admin(auth.uid()));
```

---

## 5. Feature Specifications

### 5.1 Authentication System

**Implementation**: Supabase Auth with email/password

**Features**:
- Email/password signup and login
- Automatic profile creation on signup (via database trigger)
- Role assignment (customer, tenant, super_admin)
- Protected routes based on authentication state
- Session persistence across page reloads

**User Flows**:
1. **Signup**: Email + Password → Profile created → Role assigned → Redirect to dashboard
2. **Login**: Email + Password → Session created → Redirect based on role
3. **Logout**: Session destroyed → Redirect to landing page

**Role-Based Routing**:
| Role | Default Redirect | Accessible Routes |
|------|------------------|-------------------|
| customer | Store catalog | /store/* |
| tenant | Dashboard home | /dashboard/* |
| super_admin | Admin overview | /admin/*, /dashboard/* |

### 5.2 Multi-Tenant Store Management

**Store Creation**:
- Unique slug validation
- Auto-generated from store name
- Owner automatically assigned
- Default settings applied

**Store Settings**:
- Basic info (name, description, logo, banner)
- Contact info (email, phone, address)
- Business settings (currency, tax rates)
- Store status management

**Staff Management**:
- Invite staff by email (planned)
- Role assignment (staff, manager)
- Staff can access store data
- Only owner can manage staff

### 5.3 Product Management

**Product CRUD**:
- Create products with full details
- Rich text description editor
- Multiple image upload
- Category assignment
- SEO metadata

**Product Variants**:
- Multiple variants per product
- Individual SKU, price, stock per variant
- Attribute-based variants (size, color)
- Variant-specific images

**Inventory Management**:
- Stock quantity tracking
- Low stock indicators (planned)
- Inventory history (planned)

**Product Status Workflow**:
```
Draft → Active → Archived
  ↑       ↓
  └───────┘
```

### 5.4 Order Management

**Order Lifecycle**:
```
Pending → Confirmed → Processing → Shipped → Delivered
    ↓         ↓           ↓           ↓
    └─────────┴───────────┴───────────┴──→ Cancelled
                                           Refunded
```

**Order Features**:
- Auto-generated order numbers
- Customer information capture
- Shipping/billing addresses
- Line items with denormalized product data
- Order notes (customer and internal)
- Status history tracking (planned)

**Order Items**:
- Product snapshot at time of order
- Variant information preserved
- Quantity and pricing
- Product reference maintained

### 5.5 Customer Management

**Customer Records**:
- Store-scoped customer profiles
- Email as primary identifier
- Contact information
- Aggregated metrics (total orders, total spent)
- Order history

**Customer Features**:
- Manual customer creation
- Auto-creation on checkout (planned)
- Customer notes for staff
- Customer search and filtering

### 5.6 Discount System

**Discount Types**:
| Type | Description | Example |
|------|-------------|---------|
| percentage | Percentage off order | 20% off |
| fixed | Fixed amount off | $10 off |
| free_shipping | Free shipping | Free shipping |

**Discount Rules**:
- Validity period (starts_at, expires_at)
- Usage limits (max_uses)
- Usage tracking (used_count)
- Minimum order amount
- Active/inactive toggle

**Discount Application**:
- Code validation at checkout
- Automatic discount calculation
- Multiple discount support (planned)

### 5.7 Visual Store Builder

**Overview**: Drag-and-drop page builder with 26 section types

**Section Categories**:

| Category | Section Types |
|----------|---------------|
| **Hero** | hero-banner, hero-slider, hero-video |
| **Products** | product-grid, featured-products, product-carousel, new-arrivals, best-sellers |
| **Categories** | category-grid, category-banner |
| **Content** | text-block, image-text, gallery, testimonials, faq |
| **Marketing** | announcement-bar, newsletter, countdown, promo-banner, trust-badges, brand-logos |
| **Layout** | custom-html, spacer, divider |
| **Media** | video-section, map-section |

**Editor Components**:

| Component | Purpose |
|-----------|---------|
| `StoreBuilder.tsx` | Main container with layout |
| `SectionPalette.tsx` | Browse and add sections |
| `SectionList.tsx` | Reorder and manage sections |
| `SectionEditor.tsx` | Configure section properties |
| `PreviewFrame.tsx` | Live preview with device modes |
| `ThemeEditor.tsx` | Global theme settings |
| `PageManager.tsx` | Page CRUD operations |
| `EditorHeader.tsx` | Save, publish, navigation |

**Section Configuration Schema**:
```typescript
interface HeroBannerConfig {
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  buttonStyle: 'primary' | 'secondary' | 'outline';
  overlayOpacity: number;
  contentAlignment: 'left' | 'center' | 'right';
  minHeight: string;
}
```

**Theme Editor**:
- Colors: primary, secondary, accent, background, foreground, etc.
- Typography: heading font, body font, weights, base size
- Layout: border radius, button radius, section padding, container width
- Custom CSS support

### 5.8 Customer Storefront

**Dynamic Page Rendering**:
- Route: `/store/:storeSlug/page/:pageSlug`
- Fetches page sections from database
- Applies store theme via CSS variables
- Renders sections in order

**Production Section Components** (19 implemented):

| Component | Description |
|-----------|-------------|
| `HeroBanner.tsx` | Full-width hero with CTA |
| `HeroSlider.tsx` | Carousel hero sections |
| `HeroVideo.tsx` | Video background hero |
| `ProductGrid.tsx` | Product catalog grid |
| `FeaturedProducts.tsx` | Highlighted products |
| `CategoryGrid.tsx` | Category cards |
| `TextBlock.tsx` | Rich text content |
| `ImageText.tsx` | Image + text layout |
| `Gallery.tsx` | Image gallery |
| `Testimonials.tsx` | Customer reviews |
| `FAQ.tsx` | Accordion FAQ |
| `AnnouncementBar.tsx` | Top banner |
| `Newsletter.tsx` | Email signup |
| `Countdown.tsx` | Timer countdown |
| `PromoBanner.tsx` | Promotional banner |
| `TrustBadges.tsx` | Trust indicators |
| `BrandLogos.tsx` | Partner logos |
| `Spacer.tsx` | Vertical spacing |
| `Divider.tsx` | Section divider |

**Storefront Pages**:
- `StorePage.tsx`: Dynamic page renderer
- `StoreCatalog.tsx`: Product listing with filters
- `ProductDetail.tsx`: Individual product view
- `Cart.tsx`: Shopping cart
- `Checkout.tsx`: Checkout flow

### 5.9 Super Admin Dashboard

**Overview Page**:
- Total stores count
- Total users count
- Total orders count
- Recent activity feed (planned)

**Stores Management**:
- View all stores regardless of status
- Filter by status
- Quick actions (activate, suspend)
- Store details view

**Users Management**:
- View all user profiles
- Role management
- User activity (planned)

---

## 6. API Layer

### 6.1 Current Architecture

PasalHub uses **Supabase's auto-generated PostgREST API** for data access. The API is secured by Row Level Security policies at the database level.

**Key Characteristics**:
- RESTful API auto-generated from database schema
- Real-time subscriptions available
- RLS policies enforce access control
- TypeScript types auto-generated

### 6.2 Data Access Patterns

```typescript
// Fetch products for a store
const { data, error } = await supabase
  .from('products')
  .select(`
    *,
    categories (id, name),
    product_variants (*)
  `)
  .eq('store_id', storeId)
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Create a new order
const { data: order, error } = await supabase
  .from('orders')
  .insert({
    store_id: storeId,
    customer_id: customerId,
    order_number: generateOrderNumber(),
    status: 'pending',
    subtotal: calculateSubtotal(items),
    total: calculateTotal(items, discount, shipping)
  })
  .select()
  .single();

// Update page sections order
const { error } = await supabase
  .from('page_sections')
  .update({ sort_order: newOrder })
  .eq('id', sectionId);
```

### 6.3 Custom Hooks

```typescript
// useStoreTheme - Manage store theme
const { theme, isLoading, updateTheme } = useStoreTheme(storeId);

// useStorePages - CRUD for store pages
const { pages, isLoading, createPage, updatePage, deletePage } = useStorePages(storeId);

// usePageSections - Manage page sections
const { 
  sections, 
  isLoading, 
  addSection, 
  updateSection, 
  deleteSection, 
  reorderSections,
  duplicateSection 
} = usePageSections(storeId, pageId);
```

### 6.4 Edge Functions (Planned)

| Function | Purpose | Trigger |
|----------|---------|---------|
| `process-payment` | Handle Stripe webhooks | HTTP POST |
| `send-order-email` | Send order notifications | Database trigger |
| `generate-invoice` | Create PDF invoices | HTTP POST |
| `sync-inventory` | Sync with external systems | Scheduled |

---

## 7. User Flows

### 7.1 Store Owner Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           STORE OWNER JOURNEY                                │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Sign Up │────▶│  Create  │────▶│   Add    │────▶│ Customize│
    │          │     │  Store   │     │ Products │     │  Theme   │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
                                                              ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Manage  │◀────│  Share   │◀────│ Publish  │◀────│  Build   │
    │  Orders  │     │  Store   │     │  Pages   │     │  Pages   │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
         │
         ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Track   │────▶│  Analyze │────▶│   Grow   │
    │ Customers│     │  Sales   │     │ Business │
    └──────────┘     └──────────┘     └──────────┘
```

### 7.2 Customer Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            CUSTOMER JOURNEY                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Visit   │────▶│  Browse  │────▶│  View    │────▶│  Add to  │
    │  Store   │     │ Products │     │ Details  │     │   Cart   │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                                                              │
                                                              ▼
    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Receive │◀────│  Track   │◀────│  Place   │◀────│ Checkout │
    │  Order   │     │  Order   │     │  Order   │     │          │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
         │
         ▼
    ┌──────────┐     ┌──────────┐
    │  Leave   │────▶│  Return  │
    │  Review  │     │  Again   │
    └──────────┘     └──────────┘
```

### 7.3 Super Admin Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SUPER ADMIN JOURNEY                                 │
└─────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
    │  Login   │────▶│  View    │────▶│  Monitor │────▶│  Manage  │
    │          │     │ Overview │     │  Stores  │     │  Users   │
    └──────────┘     └──────────┘     └──────────┘     └──────────┘
                          │                │                │
                          ▼                ▼                ▼
                    ┌──────────┐     ┌──────────┐     ┌──────────┐
                    │  Review  │     │ Activate/│     │  Assign  │
                    │  Metrics │     │ Suspend  │     │  Roles   │
                    └──────────┘     └──────────┘     └──────────┘
```

---

## 8. Known Issues and Limitations

### 8.1 Current Limitations

| Issue | Impact | Severity | Workaround |
|-------|--------|----------|------------|
| **No native custom domain support** | Stores cannot have custom domains (store.com) | High | Cloudflare Workers reverse proxy |
| **No payment processing** | Cannot accept real payments | High | Stripe integration planned |
| **No email notifications** | No order confirmations or updates | Medium | Edge Functions + Resend planned |
| **Storage not isolated per-tenant** | All stores share same bucket | Low | Folder-based organization |
| **No formal SLA** | Uptime not guaranteed | Medium | Hybrid hosting for production |
| **No API rate limiting** | Potential abuse | Medium | Edge Functions rate limiter |
| **No audit logging** | Cannot track changes | Low | Activity logging planned |
| **No real-time order updates** | Manual refresh required | Low | Realtime subscriptions available |

### 8.2 Technical Debt

| Item | Description | Priority |
|------|-------------|----------|
| Missing database indexes | Performance may degrade with scale | High |
| No unit tests | Limited test coverage | Medium |
| Large component files | Some components need refactoring | Low |
| Inconsistent error handling | Error messages vary | Low |

### 8.3 Browser Support

| Browser | Support Level |
|---------|---------------|
| Chrome 90+ | Full |
| Firefox 88+ | Full |
| Safari 14+ | Full |
| Edge 90+ | Full |
| IE 11 | Not supported |

---

## 9. Future Roadmap

### 9.1 Backlog Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Multi-tenant custom domains | Cloudflare Workers reverse proxy | High |
| Database performance indexes | Add indexes for common queries | High |
| Stripe payment integration | Process real payments | High |
| Order email notifications | Transactional emails via Resend | High |
| Storefront header component | Render header with navigation | Medium |
| Storefront footer component | Render footer with links | Medium |
| Activity logging system | Track user actions | Medium |
| Per-store storage isolation | Separate storage buckets | Medium |
| Public API | REST API for third parties | Low |

### 9.2 Phase Roadmap

```
PHASE 4: Infrastructure (Current)
├── Multi-tenant custom domain routing
├── Database performance indexes
├── Activity logging system
└── Per-store storage isolation

PHASE 5: Payments & Notifications
├── Stripe payment integration
├── Order email notifications (Resend)
├── Webhook system for integrations
└── Invoice generation

PHASE 6: Header/Footer & Polish
├── Storefront header component
├── Storefront footer component
├── Navigation menu integration
└── Mobile menu improvements

PHASE 7: Third-Party Ecosystem
├── Public REST API
├── API key authentication
├── Webhook subscriptions
└── Developer documentation

PHASE 8: Advanced Features
├── Multi-currency support
├── Tax calculation integration
├── Shipping rate calculator
├── Inventory sync with suppliers
└── Advanced analytics dashboard
```

---

## 10. Testing Guide

### 10.1 Authentication Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Sign up | Enter email + password, submit | Account created, redirect to dashboard |
| Sign up duplicate | Use existing email | Error message displayed |
| Login valid | Enter valid credentials | Session created, redirect to dashboard |
| Login invalid | Enter wrong password | Error message displayed |
| Logout | Click logout button | Session destroyed, redirect to landing |
| Protected route | Access /dashboard without auth | Redirect to /auth |

### 10.2 Store Management Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Create store | Fill form, submit | Store created with unique slug |
| Duplicate slug | Use existing slug | Error message, suggest alternative |
| Update store | Edit settings, save | Settings updated |
| Delete store | Confirm deletion | Store removed (if no orders) |
| Add staff | Enter email, select role | Staff invited |

### 10.3 Product Management Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Create product | Fill required fields | Product created as draft |
| Upload images | Select multiple images | Images uploaded and displayed |
| Add variants | Add size/color variants | Variants created with individual stock |
| Publish product | Change status to active | Product visible on storefront |
| Delete product | Confirm deletion | Product removed |

### 10.4 Order Management Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| View orders | Navigate to orders page | All store orders listed |
| Filter by status | Select status filter | Filtered list displayed |
| Update status | Change order status | Status updated, timestamp recorded |
| View order details | Click order row | Full order information shown |
| Add internal note | Enter note, save | Note attached to order |

### 10.5 Store Builder Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Add section | Drag from palette | Section added to page |
| Reorder sections | Drag to new position | Order updated |
| Edit section | Click edit, modify | Changes reflected in preview |
| Delete section | Click delete, confirm | Section removed |
| Duplicate section | Click duplicate | Copy created below original |
| Switch device mode | Click mobile/tablet | Preview adjusts to device |
| Save page | Click save | Changes persisted |
| Publish page | Click publish | Page marked as published |

### 10.6 Storefront Tests

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| Load homepage | Visit /store/{slug} | Homepage with sections rendered |
| Theme applied | Check colors/fonts | Theme CSS variables applied |
| Product grid | Add product-grid section | Real products displayed |
| Add to cart | Click add to cart | Item added, cart updated |
| Checkout | Complete checkout form | Order created |
| Responsive | Resize browser | Layout adapts correctly |

---

## 11. Environment Configuration

### 11.1 Required Environment Variables

```bash
# Supabase Configuration (Auto-provided by Lovable Cloud)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=xxx

# Optional: Payment Processing (Future)
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Optional: Email Notifications (Future)
RESEND_API_KEY=re_xxx
```

### 11.2 Key Configuration Files

| File | Purpose |
|------|---------|
| `supabase/config.toml` | Supabase project configuration |
| `tailwind.config.ts` | Tailwind CSS theme and plugins |
| `vite.config.ts` | Vite build and dev configuration |
| `tsconfig.json` | TypeScript compiler options |
| `index.html` | HTML entry point with meta tags |
| `src/index.css` | CSS variables and Tailwind base |

### 11.3 Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 12. Security Considerations

### 12.1 Implemented Security Measures

| Measure | Implementation |
|---------|----------------|
| **Row Level Security** | All tables have RLS policies enabled |
| **Tenant Isolation** | `can_access_store()` function enforces isolation |
| **Super Admin Bypass** | `is_super_admin()` function for admin access |
| **No Direct Auth Access** | Uses profiles table, not auth.users |
| **HTTPS Enforced** | All traffic encrypted via Supabase |
| **Secure Password Storage** | Supabase Auth handles hashing |
| **Session Management** | JWT tokens with expiration |
| **CORS Configuration** | Restricted to allowed origins |

### 12.2 Security Best Practices in Code

```typescript
// Always use RLS - never bypass in code
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId); // RLS adds additional checks

// Validate user input
const schema = z.object({
  name: z.string().min(1).max(255),
  price: z.number().positive(),
  status: z.enum(['draft', 'active', 'archived'])
});

// Sanitize user-generated content
const sanitizedHtml = DOMPurify.sanitize(userHtml);
```

### 12.3 Security Recommendations for Production

| Recommendation | Priority | Status |
|----------------|----------|--------|
| Enable email confirmation | High | Planned |
| Implement rate limiting | High | Planned |
| Add audit logging | Medium | Planned |
| Regular RLS policy review | Medium | Manual |
| Penetration testing | Medium | Not started |
| Content Security Policy | Low | Not started |
| Subresource Integrity | Low | Not started |

### 12.4 Vulnerability Reporting

For security vulnerabilities, please report to the development team directly. Do not create public issues for security concerns.

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Tenant** | A store owner who operates an independent store on the platform |
| **Store** | An individual e-commerce instance with its own products, orders, and settings |
| **Section** | A configurable content block in the visual store builder |
| **RLS** | Row Level Security - PostgreSQL feature for row-level access control |
| **Edge Function** | Serverless function running on Supabase edge network |
| **Slug** | URL-friendly identifier (e.g., `my-store`, `summer-sale`) |
| **Variant** | Product variation (e.g., size, color) with its own SKU and price |
| **Theme** | Visual styling configuration (colors, fonts, layout) |
| **Page** | A store page composed of ordered sections |
| **Super Admin** | Platform administrator with access to all stores and users |
| **PostgREST** | RESTful API auto-generated from PostgreSQL schema |
| **JSONB** | PostgreSQL binary JSON data type for flexible configurations |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.5.0 | Dec 29, 2025 | PasalHub Team | Initial PRD creation |

---

## Appendix A: Section Configuration Schemas

### Hero Banner

```typescript
interface HeroBannerConfig {
  title: string;
  subtitle: string;
  backgroundImage: string;
  backgroundColor: string;
  textColor: string;
  buttonText: string;
  buttonLink: string;
  buttonStyle: 'primary' | 'secondary' | 'outline';
  overlayOpacity: number; // 0-100
  contentAlignment: 'left' | 'center' | 'right';
  minHeight: string; // e.g., '500px', '80vh'
}
```

### Product Grid

```typescript
interface ProductGridConfig {
  title: string;
  subtitle: string;
  categoryId: string | null; // Filter by category
  productIds: string[]; // Specific products
  columns: 2 | 3 | 4;
  limit: number;
  showPrice: boolean;
  showAddToCart: boolean;
  sortBy: 'newest' | 'price-asc' | 'price-desc' | 'name';
}
```

### Testimonials

```typescript
interface TestimonialsConfig {
  title: string;
  subtitle: string;
  testimonials: Array<{
    id: string;
    name: string;
    role: string;
    content: string;
    avatar: string;
    rating: number; // 1-5
  }>;
  layout: 'grid' | 'carousel';
  columns: 1 | 2 | 3;
}
```

---

## Appendix B: Database Functions

### can_access_store

```sql
CREATE OR REPLACE FUNCTION public.can_access_store(
  p_user_id uuid, 
  p_store_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM stores 
    WHERE id = p_store_id AND owner_id = p_user_id
  ) OR EXISTS (
    SELECT 1 FROM store_staff 
    WHERE store_id = p_store_id AND user_id = p_user_id
  );
END;
$$;
```

### is_super_admin

```sql
CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = p_user_id AND role = 'super_admin'
  );
END;
$$;
```

---

*End of Product Requirements Document*
