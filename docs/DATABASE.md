# Database Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-15  
**Version:** 1.2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Database Architecture](#database-architecture)
3. [Core Tables](#core-tables)
4. [Store Builder Tables](#store-builder-tables)
5. [Customer Authentication Tables](#customer-authentication-tables)
6. [Configuration Tables](#configuration-tables)
7. [RPC Functions](#rpc-functions)
8. [Database Triggers](#database-triggers)
9. [Row Level Security (RLS)](#row-level-security-rls)
10. [Enums](#enums)
11. [Migration History](#migration-history)
12. [Database Access Patterns](#database-access-patterns)

---

## Overview

PasalHub uses PostgreSQL via Lovable Cloud (Supabase) with a multi-tenant architecture. Each store operates in complete isolation through Row Level Security (RLS) policies and `store_id` foreign keys.

### Key Principles

- **Tenant Isolation**: Every table with store-specific data has a `store_id` column
- **RLS Everywhere**: All tables have Row Level Security enabled
- **SECURITY DEFINER Functions**: Sensitive operations use RPC functions with elevated privileges
- **Audit Trail**: Order status changes are logged automatically via triggers

---

## Database Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-TENANT ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌─────────────┐     ┌─────────────────────────────────────────────────────┐   │
│  │   stores    │────►│  All tenant data (products, orders, customers, etc.)│   │
│  │  (tenant)   │     │  Reference store_id as foreign key                  │   │
│  └─────────────┘     └─────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                        RLS POLICY LAYER                                  │   │
│  │  • can_access_store(user_id, store_id) - Owner or staff check            │   │
│  │  • is_super_admin(user_id) - Platform admin bypass                       │   │
│  │  • has_role(user_id, role) - Role-based access                          │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                     SECURITY DEFINER FUNCTIONS                           │   │
│  │  • store_customer_register() - Store-specific registration               │   │
│  │  • store_customer_login() - Store-specific authentication                │   │
│  │  • create_or_update_checkout_customer() - Guest checkout                 │   │
│  │  • place_checkout_order() - Order placement                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tables

### `stores`
Main tenant table. Each store is an independent business.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `owner_id` | UUID | References auth.users |
| `name` | TEXT | Store display name |
| `slug` | TEXT | URL slug (unique) |
| `description` | TEXT | Store description |
| `logo_url` | TEXT | Logo image URL |
| `banner_url` | TEXT | Banner image URL |
| `email` | TEXT | Contact email |
| `phone` | TEXT | Contact phone |
| `address` | TEXT | Physical address |
| `city` | TEXT | City |
| `status` | store_status | pending, active, suspended, closed |
| `settings` | JSONB | Store-specific settings |
| `subdomain` | TEXT | Custom subdomain (e.g., "mystore") |
| `custom_domain` | TEXT | Custom domain (e.g., "shop.example.com") |
| `domain_type` | TEXT | subdomain, custom_domain, or null |
| `domain_verified` | BOOLEAN | Domain verification status |
| `domain_verified_at` | TIMESTAMPTZ | When domain was verified |
| `business_type` | TEXT | Business type classification |
| `business_category` | TEXT | Business category |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `products`
Product catalog for each store.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `category_id` | UUID | FK to categories (nullable) |
| `name` | TEXT | Product name |
| `slug` | TEXT | URL slug |
| `description` | TEXT | Product description |
| `price` | NUMERIC | Base price |
| `compare_at_price` | NUMERIC | Original price (for sale display) |
| `cost_price` | NUMERIC | Cost for profit calculation |
| `sku` | TEXT | Stock keeping unit |
| `barcode` | TEXT | Product barcode |
| `stock_quantity` | INTEGER | Inventory count |
| `track_inventory` | BOOLEAN | Whether to track stock |
| `images` | JSONB | Array of image URLs |
| `attributes` | JSONB | Custom attributes |
| `featured` | BOOLEAN | Show in featured section |
| `status` | product_status | draft, active, archived |
| `seo_title` | TEXT | SEO meta title |
| `seo_description` | TEXT | SEO meta description |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `product_variants`
Product variations (size, color, etc.).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | FK to products |
| `name` | TEXT | Variant name (e.g., "Large / Red") |
| `sku` | TEXT | Variant-specific SKU |
| `price` | NUMERIC | Variant price |
| `compare_at_price` | NUMERIC | Sale comparison price |
| `stock_quantity` | INTEGER | Variant inventory |
| `image_url` | TEXT | Variant-specific image |
| `attributes` | JSONB | Variant attributes (size, color, etc.) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `categories`
Product categories with hierarchy support.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `parent_id` | UUID | FK to categories (for subcategories) |
| `name` | TEXT | Category name |
| `slug` | TEXT | URL slug |
| `description` | TEXT | Category description |
| `image_url` | TEXT | Category image |
| `sort_order` | INTEGER | Display order |
| `attribute_template` | JSONB | Default attributes for products |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `orders`
Customer orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `customer_id` | UUID | FK to customers |
| `order_number` | TEXT | Display order number |
| `status` | order_status | pending, confirmed, processing, shipped, delivered, cancelled, refunded |
| `subtotal` | NUMERIC | Pre-tax/shipping total |
| `tax_amount` | NUMERIC | Tax amount |
| `shipping_amount` | NUMERIC | Shipping cost |
| `discount_amount` | NUMERIC | Discount applied |
| `total` | NUMERIC | Final total |
| `shipping_address` | JSONB | Delivery address |
| `billing_address` | JSONB | Billing address |
| `notes` | TEXT | Customer notes |
| `internal_notes` | TEXT | Staff notes (not visible to customer) |
| `created_at` | TIMESTAMPTZ | Order placed timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `order_items`
Line items within orders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | FK to orders |
| `product_id` | UUID | FK to products (nullable - preserved if deleted) |
| `variant_id` | UUID | FK to product_variants (nullable) |
| `product_name` | TEXT | Snapshot of product name |
| `variant_name` | TEXT | Snapshot of variant name |
| `sku` | TEXT | Snapshot of SKU |
| `quantity` | INTEGER | Quantity ordered |
| `unit_price` | NUMERIC | Price per unit |
| `total_price` | NUMERIC | Line item total |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

### `order_status_history`
Audit trail for order status changes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `order_id` | UUID | FK to orders |
| `status` | order_status | Status at this point |
| `changed_by` | UUID | User who made the change |
| `notes` | TEXT | Optional notes about the change |
| `created_at` | TIMESTAMPTZ | When status changed |

### `customers`
Store customers (can span multiple orders).

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `user_id` | UUID | FK to auth.users (nullable for guests) |
| `email` | TEXT | Customer email |
| `full_name` | TEXT | Customer name |
| `phone` | TEXT | Phone number |
| `address` | TEXT | Default address |
| `city` | TEXT | City |
| `notes` | TEXT | Staff notes |
| `total_orders` | INTEGER | Order count |
| `total_spent` | NUMERIC | Lifetime spend |
| `created_at` | TIMESTAMPTZ | First order timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `discount_codes`
Promotional discount codes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `code` | TEXT | Discount code (e.g., "SAVE20") |
| `description` | TEXT | Code description |
| `discount_type` | TEXT | percentage or fixed |
| `discount_value` | NUMERIC | Discount amount |
| `minimum_amount` | NUMERIC | Minimum order for eligibility |
| `max_uses` | INTEGER | Usage limit (null = unlimited) |
| `used_count` | INTEGER | Current usage count |
| `is_active` | BOOLEAN | Active status |
| `starts_at` | TIMESTAMPTZ | Valid from |
| `expires_at` | TIMESTAMPTZ | Valid until |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `product_reviews`
Customer product reviews.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `product_id` | UUID | FK to products |
| `store_id` | UUID | FK to stores |
| `customer_name` | TEXT | Reviewer name |
| `customer_email` | TEXT | Reviewer email |
| `rating` | INTEGER | 1-5 stars |
| `title` | TEXT | Review title |
| `content` | TEXT | Review body |
| `is_approved` | BOOLEAN | Moderation status |
| `created_at` | TIMESTAMPTZ | Submission timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## Store Builder Tables

### `store_themes`
Visual theme configuration for stores.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `name` | TEXT | Theme name |
| `is_active` | BOOLEAN | Currently active theme |
| `colors` | JSONB | Color palette (primary, secondary, accent, etc.) |
| `typography` | JSONB | Font settings (heading, body, sizes) |
| `layout` | JSONB | Layout settings (container width, spacing) |
| `custom_css` | TEXT | Custom CSS overrides |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Colors JSONB Structure:**
```json
{
  "primary": "#3b82f6",
  "secondary": "#f59e0b",
  "accent": "#10b981",
  "background": "#ffffff",
  "foreground": "#1f2937",
  "muted": "#f3f4f6",
  "border": "#e5e7eb"
}
```

### `store_pages`
Custom pages for storefronts.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `title` | TEXT | Page title |
| `slug` | TEXT | URL slug |
| `page_type` | page_type | homepage, about, contact, policy, custom, product, category, cart, checkout, profile, order_tracking, search |
| `is_published` | BOOLEAN | Visibility status |
| `published_at` | TIMESTAMPTZ | When published |
| `show_header` | BOOLEAN | Show header on page |
| `show_footer` | BOOLEAN | Show footer on page |
| `seo_title` | TEXT | SEO meta title |
| `seo_description` | TEXT | SEO meta description |
| `og_image_url` | TEXT | Social sharing image |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `page_sections`
Configurable sections within pages.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `page_id` | UUID | FK to store_pages |
| `store_id` | UUID | FK to stores |
| `section_type` | section_type | See section_type enum |
| `name` | TEXT | Display name |
| `config` | JSONB | Section-specific configuration |
| `mobile_config` | JSONB | Mobile-specific overrides |
| `sort_order` | INTEGER | Display order |
| `is_visible` | BOOLEAN | Visibility toggle |
| `position` | TEXT | before_content, after_content |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `page_templates`
Pre-defined page configurations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `template_name` | TEXT | Template name |
| `business_type` | TEXT | Target business type |
| `business_category` | TEXT | Target category |
| `page_type` | page_type | Page type this template is for |
| `default_sections` | JSONB | Array of section configurations |
| `default_title` | TEXT | Default page title |
| `default_slug` | TEXT | Default URL slug |
| `description` | TEXT | Template description |
| `preview_image_url` | TEXT | Template preview image |
| `sort_order` | INTEGER | Display order |
| `is_active` | BOOLEAN | Available for use |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `store_navigation`
Navigation menu items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `label` | TEXT | Link text |
| `url` | TEXT | External URL (if not linked to page) |
| `page_id` | UUID | FK to store_pages (if internal link) |
| `parent_id` | UUID | FK to self (for dropdowns) |
| `location` | nav_location | header, footer, mobile |
| `sort_order` | INTEGER | Display order |
| `is_highlighted` | BOOLEAN | Special styling |
| `open_in_new_tab` | BOOLEAN | Target _blank |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `store_header_footer`
Header and footer configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores (unique) |
| `header_config` | JSONB | Header layout and settings |
| `footer_config` | JSONB | Footer layout and settings |
| `social_links` | JSONB | Social media URLs |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Header Config Structure:**
```json
{
  "layout": "logo-left",
  "sticky": true,
  "showSearch": true,
  "showCart": true,
  "showAccount": true,
  "backgroundColor": "#ffffff",
  "textColor": "#1f2937"
}
```

**Footer Config Structure:**
```json
{
  "layout": "multi-column",
  "showNewsletter": true,
  "showSocial": true,
  "showPaymentIcons": true,
  "backgroundColor": "#1f2937",
  "textColor": "#f9fafb",
  "copyright": "© 2026 Store Name. All rights reserved."
}
```

---

## Customer Authentication Tables

### `store_customer_accounts`
Store-specific customer login credentials.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `customer_id` | UUID | FK to customers |
| `email` | TEXT | Login email |
| `password_hash` | TEXT | Bcrypt hashed password |
| `created_at` | TIMESTAMPTZ | Registration timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Important Notes:**
- One customer can have accounts at multiple stores
- Same email can exist across different stores
- Unique constraint: `(store_id, email)`
- Password is hashed via edge function using bcrypt

### `store_customer_sessions`
Session tokens for store customer authentication.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `account_id` | UUID | FK to store_customer_accounts |
| `customer_id` | UUID | FK to customers |
| `token_hash` | TEXT | Hashed session token |
| `expires_at` | TIMESTAMPTZ | Session expiration |
| `last_used_at` | TIMESTAMPTZ | Last activity |
| `created_at` | TIMESTAMPTZ | Session creation |

**Session Flow:**
1. User logs in → edge function hashes password → validates → creates session
2. Session token stored in localStorage
3. Each request validates session via RPC function
4. Sessions expire after 30 days
5. Expired sessions cleaned up by `cleanup_expired_store_customer_sessions()`

---

## Configuration Tables

### `store_shipping_settings`
Shipping rates and zones.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores (unique) |
| `enable_shipping` | BOOLEAN | Shipping enabled |
| `default_shipping_rate` | NUMERIC | Fallback rate |
| `free_shipping_threshold` | NUMERIC | Free shipping minimum |
| `shipping_zones` | JSONB | Zone-based rates |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

**Shipping Zones Structure:**
```json
[
  {
    "name": "Kathmandu Valley",
    "cities": ["Kathmandu", "Lalitpur", "Bhaktapur"],
    "rate": 100
  },
  {
    "name": "Outside Valley",
    "cities": ["Pokhara", "Chitwan"],
    "rate": 200
  }
]
```

### `store_extensions`
Third-party integrations.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `extension_id` | TEXT | Extension identifier |
| `config` | JSONB | Extension configuration |
| `is_enabled` | BOOLEAN | Active status |
| `created_at` | TIMESTAMPTZ | Installation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `store_staff`
Staff members with store access.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `user_id` | UUID | FK to auth.users |
| `role` | TEXT | Staff role |
| `created_at` | TIMESTAMPTZ | Assignment timestamp |

### `profiles`
User profile information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `full_name` | TEXT | Display name |
| `avatar_url` | TEXT | Profile picture |
| `phone` | TEXT | Phone number |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `user_roles`
Platform-level roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | FK to auth.users |
| `role` | app_role | super_admin, store_admin, store_staff, customer |
| `created_at` | TIMESTAMPTZ | Assignment timestamp |

### `store_customers`
Links authenticated users to store customers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `store_id` | UUID | FK to stores |
| `user_id` | UUID | FK to auth.users |
| `customer_id` | UUID | FK to customers |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

---

## RPC Functions

### Customer Authentication Functions

#### `store_customer_register()`
Registers a new customer account for a specific store.

```sql
store_customer_register(
  p_store_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
) RETURNS JSON
```

**Returns:**
```json
{
  "success": true,
  "customer_id": "uuid",
  "account_id": "uuid"
}
```

**Behavior:**
1. Checks if email already exists for this store
2. Creates customer record if new email
3. Creates store_customer_account with hashed password
4. Returns customer and account IDs

#### `store_customer_login()`
Authenticates a store customer and creates a session.

```sql
store_customer_login(
  p_store_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_token_hash TEXT
) RETURNS JSON
```

**Returns:**
```json
{
  "success": true,
  "customer": {
    "id": "uuid",
    "email": "email@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890"
  },
  "session_id": "uuid",
  "expires_at": "2026-02-15T00:00:00Z"
}
```

#### `store_customer_validate_session()`
Validates an existing session and returns customer data.

```sql
store_customer_validate_session(
  p_store_id UUID,
  p_token_hash TEXT
) RETURNS JSON
```

**Returns:**
```json
{
  "valid": true,
  "customer": {
    "id": "uuid",
    "email": "email@example.com",
    "full_name": "John Doe",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "Kathmandu"
  }
}
```

#### `store_customer_logout()`
Invalidates a customer session.

```sql
store_customer_logout(
  p_store_id UUID,
  p_token_hash TEXT
) RETURNS JSON
```

#### `store_customer_update_profile()`
Updates customer profile information.

```sql
store_customer_update_profile(
  p_store_id UUID,
  p_token_hash TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
) RETURNS JSON
```

#### `store_customer_get_orders()`
Retrieves orders for an authenticated customer.

```sql
store_customer_get_orders(
  p_store_id UUID,
  p_token_hash TEXT
) RETURNS JSON
```

### Checkout Functions

#### `create_or_update_checkout_customer()`
Creates or updates a customer during checkout.

```sql
create_or_update_checkout_customer(
  p_store_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_address TEXT,
  p_city TEXT
) RETURNS UUID
```

#### `place_checkout_order()`
Places an order with items.

```sql
place_checkout_order(
  p_store_id UUID,
  p_customer_id UUID,
  p_items JSON,
  p_shipping_address JSON,
  p_shipping_amount NUMERIC DEFAULT 0,
  p_notes TEXT DEFAULT NULL
) RETURNS JSON
```

### Utility Functions

#### `get_or_create_store_customer()`
Gets existing customer or creates new one.

```sql
get_or_create_store_customer(
  p_store_id UUID,
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL
) RETURNS UUID
```

#### `initialize_store_pages()`
Creates default pages for a new store.

```sql
initialize_store_pages(
  p_store_id UUID,
  p_business_type TEXT DEFAULT 'general',
  p_business_category TEXT DEFAULT NULL
) RETURNS INTEGER
```

#### `get_standard_pages_for_business()`
Returns page templates for a business type.

```sql
get_standard_pages_for_business(
  p_business_type TEXT,
  p_business_category TEXT DEFAULT NULL
) RETURNS TABLE(...)
```

#### `cleanup_expired_store_customer_sessions()`
Removes expired customer sessions.

```sql
cleanup_expired_store_customer_sessions() RETURNS VOID
```

### Access Control Functions

#### `can_access_store()`
Checks if user has store access.

```sql
can_access_store(_store_id UUID, _user_id UUID) RETURNS BOOLEAN
```

#### `is_super_admin()`
Checks if user is platform admin.

```sql
is_super_admin(_user_id UUID) RETURNS BOOLEAN
```

#### `has_role()`
Checks if user has specific role.

```sql
has_role(_user_id UUID, _role app_role) RETURNS BOOLEAN
```

---

## Database Triggers

### Order Status History Trigger
Automatically logs order status changes.

```sql
CREATE TRIGGER log_order_status_changes
AFTER UPDATE OF status ON orders
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION log_order_status_change();
```

### Store Header/Footer Auto-Create
Creates header/footer config when store is created.

```sql
CREATE TRIGGER ensure_store_header_footer
AFTER INSERT ON stores
FOR EACH ROW
EXECUTE FUNCTION create_store_header_footer();
```

### Updated At Triggers
Auto-update `updated_at` timestamps.

Applied to: `stores`, `products`, `categories`, `customers`, `orders`, `store_themes`, `store_pages`, `store_customer_accounts`

---

## Row Level Security (RLS)

### Policy Types

| Type | Description |
|------|-------------|
| **Public Read** | Anyone can SELECT (active stores, products) |
| **Authenticated** | Logged-in users can INSERT |
| **Tenant CRUD** | Store owners/staff have full access |
| **Super Admin** | Platform admins bypass all restrictions |
| **RPC Only** | No direct access, must use functions |

### Critical Table Policies

| Table | Public | Auth INSERT | Tenant CRUD | Notes |
|-------|--------|-------------|-------------|-------|
| `stores` | READ (active) | ✓ | ✓ | Owners can update own store |
| `products` | READ (active) | ✗ | ✓ | Public read for storefronts |
| `orders` | ✗ | ✓ | ✓ | Authenticated can create |
| `order_items` | ✗ | ✓ | ✓ | Follows order access |
| `customers` | ✗ | RPC only | ✓ | INSERT via RPC only |
| `store_customer_accounts` | ✗ | ✗ | ✗ | RPC only |
| `store_customer_sessions` | ✗ | ✗ | ✗ | RPC only |

### Security Functions All Use

```sql
SET search_path = public  -- Prevents search_path injection attacks
```

---

## Enums

### `app_role`
```sql
'super_admin' | 'store_admin' | 'store_staff' | 'customer'
```

### `store_status`
```sql
'pending' | 'active' | 'suspended' | 'closed'
```

### `product_status`
```sql
'draft' | 'active' | 'archived'
```

### `order_status`
```sql
'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
```

### `page_type`
```sql
'homepage' | 'about' | 'contact' | 'policy' | 'custom' | 'product' | 'category' | 'cart' | 'checkout' | 'profile' | 'order_tracking' | 'search'
```

### `section_type`
```sql
'header' | 'footer' | 'hero_banner' | 'hero_slider' | 'hero_video' | 'featured_products' | 'product_grid' | 'product_carousel' | 'new_arrivals' | 'best_sellers' | 'category_grid' | 'category_banner' | 'text_block' | 'image_text' | 'gallery' | 'testimonials' | 'faq' | 'announcement_bar' | 'newsletter' | 'countdown' | 'promo_banner' | 'social_feed' | 'trust_badges' | 'brand_logos' | 'custom_html' | 'spacer' | 'divider' | 'product_filters' | 'product_sort' | 'recently_viewed' | 'recommended_products' | 'product_reviews'
```

### `nav_location`
```sql
'header' | 'footer' | 'mobile'
```

---

## Migration History

| Date | Version | Description |
|------|---------|-------------|
| 2025-12-29 | 0.1.0 | Initial schema with stores, products, categories |
| 2025-12-30 | 0.2.0 | Added orders, order_items, customers |
| 2025-12-31 | 0.3.0 | Added store_themes, store_pages, page_sections |
| 2026-01-02 | 0.4.0 | Added store_navigation, store_header_footer |
| 2026-01-05 | 0.5.0 | Added page_templates, auto-initialization functions |
| 2026-01-08 | 0.6.0 | Added discount_codes, product_reviews |
| 2026-01-10 | 0.7.0 | Added subdomain, custom_domain columns to stores |
| 2026-01-11 | 0.8.0 | Security hardening, created public_stores view |
| 2026-01-15 | 1.0.0 | Added store_customer_accounts, store_customer_sessions |
| 2026-01-15 | 1.1.0 | Added customer authentication RPC functions |
| 2026-01-15 | 1.2.0 | Added store_customer_get_orders, profile update functions |

---

## Database Access Patterns

### From Frontend (Client-Side)

```typescript
import { supabase } from '@/integrations/supabase/client';

// Fetching with store isolation
const { data, error } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId)
  .eq('status', 'active');

// Calling RPC functions
const { data, error } = await supabase
  .rpc('store_customer_validate_session', {
    p_store_id: storeId,
    p_token_hash: tokenHash
  });
```

### From Edge Functions

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Service role bypasses RLS
const { data, error } = await supabase
  .from('store_customer_accounts')
  .select('*')
  .eq('store_id', storeId)
  .eq('email', email)
  .single();
```

---

## Views

### `public_stores`
A view that exposes only non-sensitive store information for public access.

```sql
CREATE VIEW public_stores AS
SELECT 
  id, name, slug, description, logo_url, banner_url,
  status, business_type, business_category, settings, created_at
FROM stores
WHERE status = 'active';
```

**Purpose:** Hide `owner_id` and other sensitive fields from public queries.

---

*This documentation is auto-generated and maintained. Last update: 2026-01-15*
