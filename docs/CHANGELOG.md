# Changelog

All notable changes to PasalHub are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.2.1] - 2026-01-15

### Fixed - Checkout & Order System Bugs

Critical fixes for checkout authentication and order linking.

#### Bug 1: Orders Not Showing in Customer Account
- **Problem**: Orders placed by logged-in customers weren't appearing in their order history
- **Cause**: Checkout created new customer records instead of using the authenticated customer's ID
- **Fix**: Modified `Checkout.tsx` to use `customer.customer_id` from `StoreCustomerAuthContext` when authenticated

#### Bug 2: Subdomain Checkout Authentication Broken
- **Problem**: In subdomain mode, checkout always showed "Login Required" even for logged-in customers
- **Cause**: `Checkout.tsx` used `supabase.auth.getUser()` (platform auth) instead of store customer auth
- **Fix**: Replaced platform auth with `useStoreCustomerAuth()` context

#### Code Changes
- Updated `src/pages/storefront/Checkout.tsx`:
  - Replaced `supabase.auth` calls with `useStoreCustomerAuth()` hook
  - Pre-fill checkout form with authenticated customer data (email, name, phone, address, city)
  - Use authenticated customer's `customer_id` for order placement
  - Guest checkout still uses `create_or_update_checkout_customer` RPC

#### Behavior After Fix
| Scenario | Before | After |
|----------|--------|-------|
| Subdomain checkout (logged in) | "Login Required" error | Checkout works normally |
| Path-mode checkout (logged in) | Order not linked | Order linked to customer |
| View orders after purchase | Empty list | Shows placed orders |
| Guest checkout | Works | Still works (unchanged) |

---

## [1.2.0] - 2026-01-15

### Added - Store-Specific Customer Authentication

Complete customer isolation system for multi-tenant storefronts.

#### Database Changes
- Created `store_customer_accounts` table for per-store customer credentials
- Created `store_customer_sessions` table for session management
- Added indexes on `token_hash` and `expires_at` for performance
- Added RLS policies denying direct access (RPC only)

#### New RPC Functions
- `store_customer_register()` - Create store-specific customer accounts
- `store_customer_login()` - Authenticate and create sessions
- `store_customer_validate_session()` - Validate existing sessions
- `store_customer_logout()` - Invalidate sessions
- `store_customer_update_profile()` - Update customer details
- `store_customer_get_orders()` - Fetch customer order history
- `cleanup_expired_store_customer_sessions()` - Periodic cleanup

#### Edge Function
- Created `supabase/functions/store-customer-auth/index.ts`
- Secure password hashing with bcrypt (12 rounds)
- SHA-256 session token hashing
- CORS support for web requests
- Actions: register, login, validate, logout, update-profile, get-orders

#### Frontend Changes
- Created `StoreCustomerAuthContext.tsx` - Authentication state management
- Updated `CustomerAuth.tsx` - Login/register using new context
- Updated `CustomerAccount.tsx` - Protected route with session check
- Updated `CustomerProfile.tsx` - Profile updates via edge function
- Updated `CustomerOrders.tsx` - Order fetching via authenticated RPC
- Updated `App.tsx` - Added StoreCustomerAuthProvider

### Security
- Passwords never stored in plain text
- Session tokens hashed before database storage
- 30-day session expiration
- Per-store customer isolation (same email can exist at different stores)

---

## [1.1.0] - 2026-01-14

### Added - StorefrontContext

Unified store data provider for all storefront pages.

#### New Context
- Created `StorefrontContext.tsx` in `src/contexts/`
- Provides: store, theme, headerFooter, navItems, loading, error, isSubdomainMode
- Single data fetch eliminates duplicate API calls

#### Features
- Automatic store detection from subdomain or URL path
- Parallel fetching of theme, header/footer, and navigation
- Routing mode awareness for link generation

---

## [1.0.0] - 2026-01-13

### Added - Domain Support

Subdomain and custom domain infrastructure.

#### Database Changes
- Added `subdomain` column to stores table
- Added `custom_domain` column to stores table
- Added `domain_type` column (subdomain, custom_domain)
- Added `domain_verified` and `domain_verified_at` columns

#### Frontend
- Created `src/lib/subdomain.ts` for domain detection
- `getStoreSlugFromSubdomain()` function
- `isStorefrontSubdomain()` function

#### Hooks
- Created `useStoreLinks.ts` for route-mode-aware link generation
- Supports both path-based and subdomain-based routing

---

## [0.9.0] - 2026-01-11

### Security Hardening

Comprehensive security improvements.

#### XSS Prevention
- Created `src/lib/sanitize.ts` with DOMPurify
- Fixed XSS in TextBlock section
- Fixed XSS in PreviewFrame (TextBlock & CustomHtml)

#### RLS Improvements
- Restricted orders/order_items INSERT to authenticated users only
- Removed permissive customer INSERT policy (RPC only now)
- Created `public_stores` view to hide sensitive owner_id

#### Input Validation
- Added Zod validation to checkout form
- Phone number regex validation
- Notes field sanitization

#### Database Security
- Added `SET search_path = public` to all SECURITY DEFINER functions
- Prevents search_path injection attacks

---

## [0.8.0] - 2026-01-10

### Added - Product Reviews

Customer review system for products.

#### Database
- Created `product_reviews` table
- Fields: rating (1-5), title, content, customer_name, customer_email
- `is_approved` flag for moderation
- RLS policies for public read (approved only), authenticated write

---

## [0.7.1] - 2026-01-08

### Added - Page Selector & Settings UI (Phase 1B)

Improved Store Builder page management.

#### New Components
- `PageSelector.tsx` - Quick page switching dropdown
- `PageSettings.tsx` - Inline SEO, visibility, layout settings

#### Changes
- Restructured sidebar tabs (Sections, Theme, Settings)
- Page selector always visible above tabs
- System page slug protection

---

## [0.7.0] - 2026-01-05

### Added - Header/Footer Auto-Initialization

Automatic header/footer setup for new stores.

#### Database Changes
- Created trigger `ensure_store_header_footer` on stores table
- Backfill migration for existing stores without header/footer

#### Default Configs
- Header: logo-left layout, sticky, show search/cart/account
- Footer: multi-column layout, show newsletter/social
- Empty social links object

---

## [0.6.0] - 2026-01-03

### Added - Section Permissions System

Page type restrictions for sections.

#### New Files
- `src/components/store-builder/utils/sectionPermissions.ts`
- `BuiltInContentPlaceholder.tsx` for system pages

#### Features
- Different allowed sections per page type
- System pages (cart, checkout) have no custom sections
- Built-in content indicator in editor

---

## [0.5.0] - 2026-01-02

### Added - Navigation Editor

Store navigation management.

#### Database
- Created `store_navigation` table
- Fields: label, url, page_id, location, sort_order

#### Components
- `NavigationEditor.tsx` - CRUD for nav items
- Support for internal (page) and external links
- Drag-and-drop reorder
- Header/footer/mobile locations

---

## [0.4.0] - 2026-01-01

### Added - Header/Footer Editor

Configurable header and footer.

#### Database
- Created `store_header_footer` table
- Separate header_config, footer_config, social_links JSONB

#### Components
- `HeaderFooterEditor.tsx` - Tabbed editor
- `StorefrontHeader.tsx` - Production header
- `StorefrontFooter.tsx` - Production footer

#### Layouts
- Header: logo-left, logo-center, logo-right
- Footer: simple, minimal, multi-column

---

## [0.3.0] - 2025-12-31

### Added - Store Builder & Theme System

Visual page editor with theme customization.

#### Database Tables
- `store_themes` - Colors, typography, layout
- `store_pages` - Custom pages with SEO
- `page_sections` - Page sections with JSONB config
- `page_templates` - Default sections per page type

#### Store Builder
- Main container with three-panel layout
- Section palette with 26+ section types
- Section list with drag-and-drop
- Real-time preview with theme CSS variables
- Theme editor for colors, fonts, layout

#### Hooks
- `useStoreBuilder.ts` - Complete state management

---

## [0.2.0] - 2025-12-30

### Added - Order System

Complete order management.

#### Database
- Created `orders` table with status enum
- Created `order_items` table
- Created `order_status_history` for audit trail
- Trigger for automatic status logging

#### RPC Functions
- `create_or_update_checkout_customer()` - Guest checkout
- `place_checkout_order()` - Order creation

#### Components
- `OrdersList.tsx` - Dashboard order list
- `OrderDetails.tsx` - Order detail with status updates
- `Checkout.tsx` - Customer checkout flow

---

## [0.1.0] - 2025-12-29

### Added - Foundation

Initial platform setup.

#### Core Tables
- `stores` - Multi-tenant stores
- `products` - Product catalog
- `product_variants` - Product options
- `categories` - Product categories
- `customers` - Store customers
- `discount_codes` - Promotional codes
- `profiles` - User profiles
- `user_roles` - Platform roles
- `store_staff` - Staff assignments

#### RLS Functions
- `can_access_store()` - Tenant access check
- `is_super_admin()` - Admin bypass
- `has_role()` - Role check

#### Frontend
- Dashboard layout with sidebar
- Super admin layout
- Auth pages (login/signup)
- Product management (list, form)
- Category management
- Customer list

---

## Migration Notes

### Upgrading from 0.x to 1.x

1. **Customer Authentication**: Existing customers don't have accounts. They'll need to register at each store they want to access.

2. **Session Tokens**: The new session system stores tokens in localStorage with store-specific keys (`store_customer_session_${storeId}`).

3. **RPC Functions**: All customer-related operations now use SECURITY DEFINER functions. Direct table access is blocked by RLS.

---

*For questions about specific versions, see the detailed documentation in the `docs/` folder.*
