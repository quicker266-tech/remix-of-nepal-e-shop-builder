# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned
- Phase 4: Toast notifications for Store Builder actions
- Phase 4: Image upload integration for section backgrounds
- Multi-tenant domain system (subdomains + custom domains)

---

## [0.9.0] - 2026-01-13

### Fixed - Store Initialization Root Cause

**Database Trigger Enhancement (`auto_initialize_store_pages`)**
- **Root Cause Identified**: Stores created before opening Store Builder were missing `store_header_footer` and `store_themes` records, causing headers/footers to not render on storefronts
- Extended the `auto_initialize_store_pages()` trigger function to also create:
  - `store_header_footer` record with default layout configuration
  - `store_themes` record with default theme (colors, typography, layout)
- All new stores now automatically get complete initialization on creation
- Uses `ON CONFLICT DO NOTHING` for idempotency

**Backfill Migration**
- Created missing `store_header_footer` records for all existing stores
- Created missing `store_themes` records for all existing stores
- All storefronts now show headers/footers immediately without requiring Store Builder to be opened first

### Changed
- Removed Phase 4 header/footer from planned items (now complete via database trigger)

### Database
- Updated function: `auto_initialize_store_pages()` - Now creates header/footer and theme configs
- Backfilled: All existing stores now have `store_header_footer` records
- Backfilled: All existing stores now have `store_themes` records

---

## [0.8.0] - 2026-01-11

### Fixed - Critical Order System Bugs

**Checkout Flow (`src/pages/storefront/Checkout.tsx`)**
- Order creation was broken - was only creating customers, now properly creates `orders` and `order_items` records
- Customer stats increment fixed - was always setting to 1, now correctly increments `total_orders` and `total_spent`
- Added comprehensive console logging with `[CHECKOUT]` prefix for debugging
- Added proper error handling with detailed error messages

**Dashboard Metrics (`src/pages/dashboard/DashboardHome.tsx`)**
- Replaced hardcoded zeros with real database queries
- Products, Orders, Customers, and Revenue now show actual counts
- Recent Orders section displays last 5 orders with customer info
- Added loading states and skeleton placeholders

### Added - Customer Detail System

**CustomerDetail Page (`src/pages/dashboard/customers/CustomerDetail.tsx`)**
- Customer info display (name, email, phone, address)
- Stats cards (total orders, total spent, customer since)
- Order history with expandable cards (click to toggle)
- Order items display with product details
- Order summary (subtotal, shipping, tax, total)
- Shipping address per order
- Customer notes display
- Link to full order details page

**Clickable Customer Rows (`src/pages/dashboard/customers/CustomersList.tsx`)**
- Added navigation to customer detail on row click
- Added cursor-pointer and hover styling

**Order Status History (Database)**
- New table: `order_status_history` for audit trail
- Auto-logging trigger: `trigger_log_order_status`
- RLS policies for security
- Indexes for performance

### Database
- New table: `order_status_history`
  - `id` (UUID, PK)
  - `order_id` (UUID, FK → orders)
  - `status` (order_status enum)
  - `notes` (TEXT)
  - `changed_by` (UUID, FK → auth.users)
  - `created_at` (TIMESTAMPTZ)
- New trigger function: `log_order_status_change()` with `SET search_path = public` for security

### Routes Added
- `/dashboard/customers/:id` → CustomerDetail page

---

## [0.7.0] - 2026-01-04

### Added - Complete Page Builder System (Phase 1)

**Database Architecture**
- New columns on `stores`: `business_type`, `business_category` for future multi-business support
- Extended `page_type` enum with: `product`, `category`, `cart`, `checkout`, `profile`, `order_tracking`, `search`
- New table: `page_templates` - Stores default page configurations per business type
- New helper functions:
  - `get_standard_pages_for_business()` - Returns templates for a business type
  - `initialize_store_pages()` - Creates all standard pages for a store
  - `auto_initialize_store_pages()` - Trigger to auto-create pages on store creation

**Page Auto-Initialization**
- New stores automatically get all standard e-commerce pages
- Existing stores backfilled with missing pages (Home, Products, Categories, Cart, Checkout, Profile, About, Contact)
- Pages created with default sections from templates

**UI Updates**
- Extended `PageType` in types.ts with all new page types
- Added `SYSTEM_PAGE_TYPES` and `CONTENT_PAGE_TYPES` constants
- `PageManager.tsx` now shows system page badges and prevents deletion of system pages
- New icons for all page types (ShoppingBag, Grid, ShoppingCart, CreditCard, User, Package, Search)

---

## [0.6.0] - 2025-12-31

### Fixed - Critical Store Builder Bugs
- **Cross-store data leakage**: Editor state now resets when switching stores
- **Store editor scrollability**: Preview area now scrolls properly with many sections
- **Layout controls**: Border Radius and Section Padding now use dropdown selectors

### Added - Shipping & Extensions
- **Shipping Settings page** (`/dashboard/shipping`) - Configure delivery zones and rates
- **Extensions page** (`/dashboard/extensions`) - Enable integrations like Google Analytics, WhatsApp Chat
- **Checkout shipping integration** - Dynamic shipping calculation with zone-based rates and free shipping threshold

### Database
- New table: `store_shipping_settings` - Store shipping configuration
- New table: `store_extensions` - Store extension configurations with RLS policies

---

## [0.5.0] - 2025-12-28

### Added - Customer-Facing Storefront Renderer (Phase 3 Complete)

**Dynamic Page Renderer**
- `src/pages/storefront/StorePage.tsx` - Fetches sections from database and renders them dynamically with full theme support

**Production Section Components** (`src/components/storefront/sections/`)
| Component | Purpose |
|-----------|---------|
| `HeroBanner.tsx` | Full-width hero with background image, overlay, and CTA buttons |
| `HeroSlider.tsx` | Carousel hero using embla-carousel with autoplay |
| `HeroVideo.tsx` | Video background with text overlay |
| `ProductGrid.tsx` | Fetches and displays real products from database |
| `FeaturedProducts.tsx` | Featured products carousel with real data |
| `CategoryGrid.tsx` | Fetches and displays real categories from database |
| `Newsletter.tsx` | Email signup form with customizable text |
| `Testimonials.tsx` | Customer testimonial cards |
| `FAQ.tsx` | Collapsible accordion for FAQs |
| `TrustBadges.tsx` | Trust/security badge icons |
| `TextBlock.tsx` | Rich text content block |
| `AnnouncementBar.tsx` | Top announcement banner |
| `Countdown.tsx` | Countdown timer with end date |
| `ImageText.tsx` | Side-by-side image and text layout |
| `Gallery.tsx` | Image gallery grid |
| `PromoBanner.tsx` | Promotional banner with badge and CTA |
| `BrandLogos.tsx` | Partner/brand logo strip |
| `Spacer.tsx` | Configurable vertical spacing |
| `Divider.tsx` | Horizontal divider line |
| `index.tsx` | Central exports for all section components |

**Routing**
- Added route `/store/:storeSlug/page/:pageSlug` for dynamic page rendering
- Storefront pages now render sections created in Store Builder

**Theme Integration**
- CSS custom properties generated from `store_themes` table
- All storefront sections respect theme colors, typography, and layout settings

---

## [0.4.0] - 2025-12-28

### Added - Store Builder Editor Completion (Phase 1 Complete)

**Preview Renderers**
- Complete preview rendering for all 26 section types in `PreviewFrame.tsx`
- Theme-aware previews using CSS custom properties
- Responsive preview modes (desktop/tablet/mobile)

**Section Editors**
- Dedicated field editors for all section types in `SectionEditor.tsx`
- Array field management for slides, testimonials, FAQs, gallery images, trust badges, and brand logos
- Add/edit/remove functionality for all array-based configurations

**Documentation**
- JSDoc comments added to all Store Builder editor components
- JSDoc comments added to Context files (Auth, Store, Cart)
- JSDoc comments added to key pages (ProductForm, StoreCatalog)

---

## [0.3.0] - 2025-12-27

### Added - Store Builder Foundation

**Database Schema**
- `store_themes` - Theme configuration (colors, typography, layout)
- `store_pages` - Custom page management
- `page_sections` - Page sections with JSONB configuration
- `store_navigation` - Navigation menu management
- `store_header_footer` - Global header/footer settings
- RLS policies for all tables

**Store Builder Components** (`src/components/store-builder/`)
- `StoreBuilder.tsx` - Main editor container
- `types.ts` - TypeScript definitions
- `constants.ts` - Section definitions and defaults

**Editor Components** (`src/components/store-builder/editor/`)
- `EditorHeader.tsx` - Preview controls and publish actions
- `SectionPalette.tsx` - Add sections by category
- `SectionList.tsx` - Drag-and-drop section management
- `SectionEditor.tsx` - Section configuration panel
- `PageManager.tsx` - Page CRUD operations
- `ThemeEditor.tsx` - Theme customization
- `PreviewFrame.tsx` - Live preview

**Custom Hooks** (`src/hooks/useStoreBuilder.ts`)
- `useStoreTheme()` - Theme fetch and update
- `useStorePages()` - Page CRUD
- `usePageSections()` - Section CRUD with reordering
- `useStoreHeaderFooter()` - Header/footer config
- `useStoreNavigation()` - Navigation management

**Routing**
- Added `/dashboard/store-builder` route
- Added "Store Builder" link in dashboard sidebar

### Section Types Supported
| Category | Sections |
|----------|----------|
| Hero | `hero_banner`, `hero_slider`, `hero_video` |
| Products | `featured_products`, `product_grid`, `product_carousel`, `new_arrivals`, `best_sellers` |
| Categories | `category_grid`, `category_banner` |
| Content | `text_block`, `image_text`, `gallery`, `testimonials`, `faq` |
| Marketing | `announcement_bar`, `newsletter`, `countdown`, `promo_banner`, `trust_badges`, `brand_logos` |
| Layout | `custom_html`, `spacer`, `divider` |

---

## [0.2.0] - 2025-12-26

### Added - Core E-commerce Features
- Product management (CRUD, variants, categories)
- Order management with status workflow
- Customer management
- Discount codes
- Multi-tenant store architecture
- Dashboard layouts for store admins
- Super admin dashboard

---

## [0.1.0] - 2025-12-25

### Added - Initial Project Setup
- React 18 + TypeScript + Vite
- Tailwind CSS with semantic design tokens
- shadcn/ui component library
- React Router for navigation
- TanStack Query for data fetching
- Supabase integration for backend
- Authentication system with role-based access
