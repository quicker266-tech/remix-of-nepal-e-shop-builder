# Domain & Subdomain Routing System

## Executive Summary

This document covers the complete domain routing architecture for PasalHub's multi-tenant storefront system. It explains how we evolved from path-based routing (`/store/{slug}`) to subdomain-based routing (`{slug}.extendbee.com`), and provides a roadmap for migrating to fully custom domains (`store.customdomain.com`).

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Routing Modes](#routing-modes)
3. [Implementation Details](#implementation-details)
4. [Key Files Reference](#key-files-reference)
5. [Database Schema](#database-schema)
6. [Migration History](#migration-history)
7. [Future: Custom Domain Support](#future-custom-domain-support)
8. [Developer Guide](#developer-guide)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### The Problem

Initially, all storefronts were accessed via path-based URLs:
```
https://platform.com/store/bombay/product/xyz
```

This approach has limitations:
- Less professional appearance for store owners
- SEO disadvantages (subdomain is treated as separate site)
- Cookie/session isolation issues
- Branding limitations

### The Solution

We implemented a **dual-mode routing system** that supports:

1. **Path Mode** (legacy/fallback): `/store/{storeSlug}/*`
2. **Subdomain Mode** (production): `{storeSlug}.extendbee.com/*`
3. **Custom Domain Mode** (future): `store.customdomain.com/*`

```
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN DETECTION                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   bombay.extendbee.com    →  Subdomain Mode → storeSlug: bombay │
│   extendbee.com/store/x   →  Path Mode      → storeSlug: x      │
│   mystore.com             →  Custom Domain  → lookup by domain  │
│   extendbee.com           →  Main Platform  → dashboard, admin  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Routing Modes

### Mode 1: Path-Based Routing (Legacy)

**URL Pattern**: `https://platform.com/store/{storeSlug}/*`

**Use Cases**:
- Development/localhost testing
- Fallback for domains not configured for subdomains
- Preview links in dashboard

**Route Examples**:
| Page | URL |
|------|-----|
| Home | `/store/bombay` |
| Product | `/store/bombay/product/chai-masala` |
| Cart | `/store/bombay/cart` |
| Checkout | `/store/bombay/checkout` |
| Customer Auth | `/store/bombay/auth` |
| Customer Account | `/store/bombay/account` |

### Mode 2: Subdomain Routing (Production)

**URL Pattern**: `https://{storeSlug}.extendbee.com/*`

**Use Cases**:
- Production storefronts
- Professional store appearance
- SEO optimization (separate subdomain = separate site authority)

**Route Examples**:
| Page | URL |
|------|-----|
| Home | `https://bombay.extendbee.com/` |
| Product | `https://bombay.extendbee.com/product/chai-masala` |
| Cart | `https://bombay.extendbee.com/cart` |
| Checkout | `https://bombay.extendbee.com/checkout` |
| Customer Auth | `https://bombay.extendbee.com/auth` |
| Customer Account | `https://bombay.extendbee.com/account` |

### Mode 3: Custom Domain (Future)

**URL Pattern**: `https://store.customdomain.com/*`

**Status**: Database schema ready, frontend implementation pending

---

## Implementation Details

### Detection Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx Initialization                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. Call getStoreSlugFromSubdomain()                           │
│      │                                                           │
│      ├─→ Found subdomain? (e.g., bombay.extendbee.com)          │
│      │   │                                                       │
│      │   ├─→ Is it reserved? (www, admin, api, etc.)            │
│      │   │   └─→ YES: Return null → Main Platform Mode          │
│      │   │                                                       │
│      │   └─→ NO: Return store slug → Subdomain Mode             │
│      │                                                           │
│      └─→ No subdomain? → Check for /store/:storeSlug route      │
│          │                                                       │
│          ├─→ Match found → Path Mode                            │
│          └─→ No match → Main Platform Mode                      │
│                                                                  │
│   2. Based on mode, render appropriate route tree               │
│                                                                  │
│      Subdomain Mode:                                             │
│        <StorefrontProvider storeSlugOverride={slug}>            │
│          <StoreCustomerAuthProvider>                            │
│            <CartProvider storeSlug={slug}>                      │
│              <SubdomainStorefrontRoutes />                      │
│            </CartProvider>                                       │
│          </StoreCustomerAuthProvider>                           │
│        </StorefrontProvider>                                     │
│                                                                  │
│      Path Mode:                                                  │
│        <AuthProvider>                     ← Platform auth        │
│          <StoreProvider>                  ← Store selection      │
│            <CartProvider>                 ← Non-isolated cart    │
│              <Routes>                                            │
│                <Route path="/store/:storeSlug" ...>             │
│              </Routes>                                           │
│            </CartProvider>                                       │
│          </StoreProvider>                                        │
│        </AuthProvider>                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Context Isolation

Different routing modes have different context requirements:

| Mode | Auth Context | Cart Isolation | Store Detection |
|------|--------------|----------------|-----------------|
| Path Mode | `AuthProvider` (platform) + `StoreCustomerAuthProvider` (store) | Per-store via `storeSlug` param | URL param `:storeSlug` |
| Subdomain Mode | `StoreCustomerAuthProvider` only | Per-store via subdomain | `getStoreSlugFromSubdomain()` |
| Custom Domain | `StoreCustomerAuthProvider` only | Per-store via domain lookup | Database lookup |

### Why No Platform AuthProvider in Subdomain Mode?

In subdomain mode, we don't wrap with `AuthProvider` because:

1. **Separation of Concerns**: Store customers ≠ Platform users
2. **Cookie Domain**: Platform auth cookies are on `extendbee.com`, not accessible from `bombay.extendbee.com`
3. **Different Auth Systems**: 
   - Platform uses Supabase Auth (`auth.users`)
   - Storefronts use `store_customer_accounts` table

---

## Key Files Reference

### Core Domain Detection

| File | Purpose |
|------|---------|
| `src/lib/subdomain.ts` | Domain detection utilities |
| `src/App.tsx` | Top-level routing based on domain |

### Context Providers

| File | Purpose |
|------|---------|
| `src/contexts/StorefrontContext.tsx` | Unified store data for storefront pages |
| `src/contexts/StoreCustomerAuthContext.tsx` | Store-specific customer authentication |
| `src/contexts/CartContext.tsx` | Shopping cart with optional store isolation |

### Routing

| File | Purpose |
|------|---------|
| `src/routes/StorefrontRoutes.tsx` | Reusable storefront route definitions |
| `src/hooks/useStoreLinks.ts` | Route-aware link generator |

### Storefront Pages

| File | Route |
|------|-------|
| `src/pages/storefront/StorePage.tsx` | `/` and `/page/:pageSlug` |
| `src/pages/storefront/ProductDetail.tsx` | `/product/:productSlug` |
| `src/pages/storefront/Cart.tsx` | `/cart` |
| `src/pages/storefront/Checkout.tsx` | `/checkout` |
| `src/pages/storefront/CustomerAuth.tsx` | `/auth` |
| `src/pages/storefront/CustomerAccount.tsx` | `/account` |
| `src/pages/storefront/CustomerOrders.tsx` | `/account/orders` |
| `src/pages/storefront/CustomerProfile.tsx` | `/account/profile` |

---

## Database Schema

### Stores Table - Domain Fields

```sql
ALTER TABLE stores ADD COLUMN subdomain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN custom_domain TEXT UNIQUE;
ALTER TABLE stores ADD COLUMN domain_type TEXT DEFAULT 'subdomain';
  -- Values: 'subdomain' | 'custom_domain'
ALTER TABLE stores ADD COLUMN domain_verified BOOLEAN DEFAULT false;
ALTER TABLE stores ADD COLUMN domain_verified_at TIMESTAMPTZ;
```

### Current Domain Resolution Query

```sql
-- StorefrontContext.tsx uses this query
SELECT * FROM stores
WHERE (slug = :storeSlug OR subdomain = :storeSlug)
  AND status = 'active'
LIMIT 1;
```

### Future: Custom Domain Resolution

```sql
-- Will be added for custom domain support
SELECT * FROM stores
WHERE custom_domain = :hostname
  AND domain_verified = true
  AND status = 'active'
LIMIT 1;
```

---

## Migration History

### Phase 1: Initial Implementation (v1.0.0)

**Changes**:
1. Added domain columns to `stores` table
2. Created `src/lib/subdomain.ts` with detection utilities
3. Updated `App.tsx` for conditional routing

**Files Created**:
- `src/lib/subdomain.ts`

**Files Modified**:
- `src/App.tsx` - Added subdomain detection and conditional routing

### Phase 2: StorefrontContext (v1.1.0)

**Problem**: Each storefront page was fetching store data independently, causing duplicate API calls.

**Solution**: Unified `StorefrontContext` that fetches once and provides to all pages.

**Changes**:
1. Created `StorefrontContext.tsx` with store, theme, header/footer, and nav data
2. Added `isSubdomainMode` flag for routing awareness
3. Parallel data fetching for performance

**Files Created**:
- `src/contexts/StorefrontContext.tsx`

### Phase 3: useStoreLinks Hook (v1.0.0)

**Problem**: Components needed to generate links without knowing the routing mode.

**Solution**: `useStoreLinks` hook that returns route-aware link builders.

**Files Created**:
- `src/hooks/useStoreLinks.ts`

### Phase 4: Store Customer Auth (v1.2.0)

**Problem**: Platform auth (`supabase.auth`) doesn't work across subdomains due to cookie restrictions.

**Solution**: Store-specific customer authentication system.

**Changes**:
1. Created `store_customer_accounts` and `store_customer_sessions` tables
2. Created edge function for auth operations
3. Created `StoreCustomerAuthContext.tsx`
4. Updated all storefront pages to use store customer auth

**Files Created**:
- `src/contexts/StoreCustomerAuthContext.tsx`
- `supabase/functions/store-customer-auth/index.ts`

**Files Modified**:
- `src/pages/storefront/Checkout.tsx` - Use `useStoreCustomerAuth()`
- `src/pages/storefront/CustomerAuth.tsx` - Use store customer auth
- `src/pages/storefront/CustomerAccount.tsx` - Use store customer auth
- `src/pages/storefront/CustomerOrders.tsx` - Use store customer auth
- `src/pages/storefront/CustomerProfile.tsx` - Use store customer auth

### Phase 5: Checkout Fix (v1.2.1)

**Problem**: 
1. In subdomain mode, checkout used platform auth → always showed "Login Required"
2. Orders not linked to authenticated customer's account

**Solution**:
1. Replaced `supabase.auth.getUser()` with `useStoreCustomerAuth()`
2. Use `customer.customer_id` for order placement when authenticated

**Files Modified**:
- `src/pages/storefront/Checkout.tsx`

---

## Future: Custom Domain Support

### Overview

Custom domains allow store owners to use their own domain (e.g., `shop.mybrand.com`) instead of a subdomain.

### Current State

| Feature | Status |
|---------|--------|
| Database schema | ✅ Ready |
| Domain verification logic | ❌ Not implemented |
| DNS verification | ❌ Not implemented |
| SSL provisioning | ❌ Not implemented |
| Frontend routing | ❌ Not implemented |
| Store settings UI | ❌ Not implemented |

### Implementation Roadmap

#### Step 1: Domain Verification System

```typescript
// New edge function: verify-domain
// 1. Generate unique TXT record value
// 2. Store in stores.domain_verification_token
// 3. Check DNS for TXT record
// 4. Update domain_verified = true on success
```

#### Step 2: Update Domain Detection

```typescript
// src/lib/subdomain.ts - Add custom domain detection

export async function getStoreFromCustomDomain(): Promise<Store | null> {
  const hostname = window.location.hostname;
  
  // Skip if it's a known platform domain
  if (isPlatformDomain(hostname)) return null;
  
  // Query database for custom domain
  const { data } = await supabase
    .from('stores')
    .select('*')
    .eq('custom_domain', hostname)
    .eq('domain_verified', true)
    .single();
  
  return data;
}
```

#### Step 3: Update App.tsx Detection Order

```typescript
// Detection priority:
// 1. Custom domain lookup (database query)
// 2. Subdomain detection (hostname parsing)
// 3. Path-based routing (URL params)
// 4. Main platform routes

const App = () => {
  const [customDomainStore, setCustomDomainStore] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function detectDomain() {
      // Try custom domain first
      const store = await getStoreFromCustomDomain();
      if (store) {
        setCustomDomainStore(store);
      }
      setLoading(false);
    }
    detectDomain();
  }, []);
  
  if (loading) return <LoadingScreen />;
  
  // Custom domain mode
  if (customDomainStore) {
    return <StorefrontApp store={customDomainStore} />;
  }
  
  // Subdomain mode
  const subdomainSlug = getStoreSlugFromSubdomain();
  if (subdomainSlug) {
    return <StorefrontApp storeSlug={subdomainSlug} />;
  }
  
  // Main platform / path mode
  return <PlatformApp />;
};
```

#### Step 4: DNS Setup Instructions (For Store Owners)

When a store owner wants to connect a custom domain:

1. **Add Domain in Settings**
   - Enter domain: `shop.mybrand.com`
   - System generates verification token

2. **Configure DNS Records**
   ```
   Type: CNAME
   Name: shop (or @ for root)
   Value: storefronts.extendbee.com
   
   Type: TXT
   Name: _extendbee-verify
   Value: verify=abc123xyz
   ```

3. **Verify Domain**
   - System checks DNS records
   - On success, marks `domain_verified = true`

4. **SSL Provisioning**
   - Automatic via Let's Encrypt
   - Managed by infrastructure (Cloudflare, etc.)

#### Step 5: Store Settings UI

```tsx
// src/pages/dashboard/settings/DomainSettings.tsx

function DomainSettings() {
  return (
    <div>
      <h2>Domain Settings</h2>
      
      {/* Subdomain Display */}
      <Card>
        <CardHeader>Subdomain</CardHeader>
        <CardContent>
          <p>Your store is available at:</p>
          <code>https://{storeSlug}.extendbee.com</code>
        </CardContent>
      </Card>
      
      {/* Custom Domain Setup */}
      <Card>
        <CardHeader>Custom Domain</CardHeader>
        <CardContent>
          <Input placeholder="shop.mybrand.com" />
          <Button>Connect Domain</Button>
          
          {/* DNS Instructions */}
          {showDnsInstructions && (
            <DNSInstructions token={verificationToken} />
          )}
          
          {/* Verification Status */}
          <VerificationStatus status={domainStatus} />
        </CardContent>
      </Card>
    </div>
  );
}
```

### Infrastructure Considerations

#### DNS & SSL

| Requirement | Solution |
|-------------|----------|
| Wildcard SSL for subdomains | Let's Encrypt wildcard cert for `*.extendbee.com` |
| Custom domain SSL | On-demand Let's Encrypt via Caddy/nginx |
| DNS management | Cloudflare API or custom DNS service |
| CDN | Cloudflare (handles SSL termination) |

#### Architecture Options

**Option A: Cloudflare for SaaS**
- Pro: Automatic SSL, edge caching, simple setup
- Con: Cost at scale

**Option B: Self-managed with Caddy**
- Pro: Free, full control
- Con: More infrastructure to manage

**Option C: Vercel/Netlify Custom Domains**
- Pro: If already hosting there
- Con: Limited customization

---

## Developer Guide

### Adding a New Storefront Route

1. **Add route to both mode definitions**:

```tsx
// src/App.tsx

// In SubdomainStorefrontRoutes:
<Route path="/wishlist" element={<Wishlist />} />

// In Path mode routes:
<Route path="wishlist" element={<Wishlist />} />
```

2. **Add link to useStoreLinks hook**:

```tsx
// src/hooks/useStoreLinks.ts

return {
  // ...existing links
  wishlist: () => buildLink('/wishlist'),
};
```

3. **Use in components**:

```tsx
const links = useStoreLinks();
<Link to={links.wishlist()}>My Wishlist</Link>
```

### Checking Current Routing Mode

```tsx
import { useStorefront } from '@/contexts/StorefrontContext';

function MyComponent() {
  const { isSubdomainMode, storeSlug } = useStorefront();
  
  if (isSubdomainMode) {
    // Subdomain-specific logic
  }
}
```

### Building Links Outside React Components

```typescript
import { buildStoreLink } from '@/hooks/useStoreLinks';

const url = buildStoreLink('bombay', '/product/xyz', false);
// Returns: /store/bombay/product/xyz
```

### Adding New Enabled Domains

```typescript
// src/lib/subdomain.ts

const SUBDOMAIN_ENABLED_DOMAINS = [
  'extendbee.com',
  'nepal-shop-nest.lovable.app',
  'your-new-domain.com', // Add here
];
```

### Adding Reserved Subdomains

```typescript
// src/lib/subdomain.ts

const RESERVED_SUBDOMAINS = [
  'www', 'app', 'admin', 'dashboard', 'api',
  'your-new-reserved', // Add here
];
```

---

## Troubleshooting

### Common Issues

#### 1. Subdomain Not Detected

**Symptom**: `getStoreSlugFromSubdomain()` returns `null` on a subdomain

**Checklist**:
- [ ] Is the domain in `SUBDOMAIN_ENABLED_DOMAINS`?
- [ ] Is the subdomain in `RESERVED_SUBDOMAINS`?
- [ ] Is there a `.` in the subdomain (multi-level)?

#### 2. Wrong Routes in Subdomain Mode

**Symptom**: Links include `/store/{slug}` prefix in subdomain mode

**Fix**: Ensure component uses `useStoreLinks()` hook, not hardcoded paths

```tsx
// ❌ Wrong
<Link to={`/store/${storeSlug}/cart`}>Cart</Link>

// ✅ Correct
const links = useStoreLinks();
<Link to={links.cart()}>Cart</Link>
```

#### 3. Authentication Not Working in Subdomain Mode

**Symptom**: `supabase.auth.getUser()` returns null in subdomain mode

**Cause**: Platform auth cookies are domain-restricted

**Fix**: Use `useStoreCustomerAuth()` instead:

```tsx
// ❌ Wrong (subdomain mode)
const { data: { user } } = await supabase.auth.getUser();

// ✅ Correct
const { customer, isAuthenticated } = useStoreCustomerAuth();
```

#### 4. Cart Not Isolated Between Stores

**Symptom**: Cart items persist across different store subdomains

**Cause**: `CartProvider` not receiving `storeSlug` prop

**Fix**: Ensure `CartProvider` has `storeSlug`:

```tsx
<CartProvider storeSlug={storeSlug}>
  {children}
</CartProvider>
```

#### 5. Store Data Not Loading

**Symptom**: `useStorefront()` returns `loading: true` forever

**Checklist**:
- [ ] Is component wrapped in `StorefrontProvider`?
- [ ] Is `storeSlugOverride` prop correct?
- [ ] Check browser console for API errors

---

## Quick Reference

### URL Patterns by Mode

| Page | Path Mode | Subdomain Mode | Custom Domain (Future) |
|------|-----------|----------------|------------------------|
| Home | `/store/{slug}` | `/` | `/` |
| Product | `/store/{slug}/product/{id}` | `/product/{id}` | `/product/{id}` |
| Cart | `/store/{slug}/cart` | `/cart` | `/cart` |
| Checkout | `/store/{slug}/checkout` | `/checkout` | `/checkout` |
| Auth | `/store/{slug}/auth` | `/auth` | `/auth` |
| Account | `/store/{slug}/account` | `/account` | `/account` |

### Detection Priority

```
1. Check custom_domain in database (future)
2. Check subdomain in hostname
3. Check :storeSlug URL param
4. Default to main platform
```

### Context Provider Hierarchy

**Subdomain/Custom Domain Mode**:
```
StorefrontProvider
  └── StoreCustomerAuthProvider
        └── CartProvider (with storeSlug)
              └── Routes
```

**Path Mode**:
```
AuthProvider
  └── StoreProvider
        └── CartProvider
              └── StorefrontProvider (per-route)
                    └── StoreCustomerAuthProvider
                          └── Routes
```

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-01-13 | Initial subdomain support |
| 1.1.0 | 2026-01-14 | StorefrontContext for unified data |
| 1.2.0 | 2026-01-15 | Store-specific customer authentication |
| 1.2.1 | 2026-01-15 | Checkout auth fix for subdomain mode |

---

*Last Updated: 2026-01-15*
