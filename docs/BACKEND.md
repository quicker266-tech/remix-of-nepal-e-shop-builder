# Backend Architecture Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-15  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Backend Infrastructure](#backend-infrastructure)
3. [Edge Functions](#edge-functions)
4. [Authentication Architecture](#authentication-architecture)
5. [Database Security](#database-security)
6. [API Patterns](#api-patterns)
7. [File Storage](#file-storage)
8. [Environment Configuration](#environment-configuration)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## Overview

PasalHub uses Lovable Cloud (Supabase) as its backend infrastructure. This provides:

- **PostgreSQL Database** - Relational data storage with RLS
- **Edge Functions** - Serverless Deno functions
- **Authentication** - Built-in auth for platform users + custom auth for store customers
- **Storage** - File storage with access policies
- **Realtime** - WebSocket subscriptions (optional)

---

## Backend Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         LOVABLE CLOUD (Supabase)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │   Supabase Auth  │  │   PostgreSQL     │  │   Edge Functions │      │
│  │                  │  │                  │  │                  │      │
│  │  • Email/Pass    │  │  • 20+ tables    │  │  • store-customer│      │
│  │  • OAuth         │  │  • 60+ policies  │  │    -auth         │      │
│  │  • JWT tokens    │  │  • 10+ functions │  │  • (more coming) │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐                            │
│  │   Storage        │  │   Realtime       │                            │
│  │                  │  │                  │                            │
│  │  • Product imgs  │  │  • Order updates │                            │
│  │  • Store logos   │  │  • Chat (future) │                            │
│  └──────────────────┘  └──────────────────┘                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Edge Functions

Edge functions are serverless Deno functions that run on Supabase infrastructure. They're used for operations that require:
- Server-side secrets (API keys)
- Complex business logic
- Password hashing
- External API calls

### Location
```
supabase/
├── config.toml              # Supabase configuration
└── functions/
    └── store-customer-auth/ # Customer authentication function
        └── index.ts
```

### store-customer-auth

Handles store-specific customer authentication with secure password hashing.

**Endpoints:**
| Action | Method | Purpose |
|--------|--------|---------|
| `register` | POST | Create new customer account |
| `login` | POST | Authenticate and create session |
| `validate` | POST | Validate existing session |
| `logout` | POST | Invalidate session |
| `update-profile` | POST | Update customer profile |
| `get-orders` | POST | Fetch customer orders |

**Request Format:**
```typescript
{
  action: 'register' | 'login' | 'validate' | 'logout' | 'update-profile' | 'get-orders',
  storeId: string,
  email?: string,
  password?: string,     // For register/login
  sessionToken?: string, // For validate/logout/update-profile/get-orders
  fullName?: string,     // For register/update-profile
  phone?: string,
  address?: string,
  city?: string
}
```

**Response Format:**
```typescript
// Success
{
  success: true,
  data: { /* action-specific data */ }
}

// Error
{
  success: false,
  error: 'Error message'
}
```

**Security Features:**
- CORS headers for web requests
- Password hashing with bcrypt (12 rounds)
- Session tokens are SHA-256 hashed before storage
- 30-day session expiration
- Server-side validation of all inputs

**Code Structure:**
```typescript
// supabase/functions/store-customer-auth/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import * as bcrypt from 'https://deno.land/x/bcrypt@v0.4.1/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, storeId, email, password, sessionToken, ...profile } = await req.json();

    // Create Supabase client with service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    switch (action) {
      case 'register':
        return handleRegister(supabase, storeId, email, password, profile);
      case 'login':
        return handleLogin(supabase, storeId, email, password);
      // ... more cases
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

### Configuration

Edge functions are configured in `supabase/config.toml`:

```toml
[functions.store-customer-auth]
verify_jwt = false  # We handle auth ourselves
```

---

## Authentication Architecture

### Dual Authentication System

PasalHub uses two authentication systems:

#### 1. Platform Authentication (Supabase Auth)
For store owners and platform admins.

```
User → Supabase Auth → JWT Token → Frontend AuthContext
```

- Email/password signup/login
- Session managed by Supabase
- JWT in Authorization header
- Used for dashboard access

#### 2. Store Customer Authentication (Custom)
For store customers (shoppers).

```
Customer → Edge Function → Password Hash → RPC Functions → Session Token → Frontend Context
```

- Per-store customer isolation
- Same email can exist at multiple stores
- Sessions stored in `store_customer_sessions`
- Session token in localStorage

### Why Two Systems?

| Requirement | Platform Auth | Store Customer Auth |
|-------------|---------------|---------------------|
| Multi-store isolation | ❌ Global users | ✅ Per-store accounts |
| Same email at different stores | ❌ Unique email | ✅ Unique per store |
| Admin dashboard access | ✅ | ❌ |
| Checkout/orders | ❌ (overkill) | ✅ |

### Session Flow (Store Customers)

```
1. Registration:
   Frontend → Edge Function (hash password) → RPC store_customer_register()
   
2. Login:
   Frontend → Edge Function (hash password) → RPC store_customer_login()
   ← Returns: { customer, session_id, expires_at }
   → Store session token in localStorage
   
3. Page Load:
   Frontend → Edge Function (validate session) → RPC store_customer_validate_session()
   ← Returns: { valid, customer }
   
4. Authenticated Request:
   Frontend → Edge Function (with session token) → RPC function
   
5. Logout:
   Frontend → Edge Function → RPC store_customer_logout()
   → Clear localStorage
```

---

## Database Security

### Row Level Security (RLS)

All tables have RLS enabled. Policies control who can read/write data.

**Policy Types:**
```sql
-- Public read (anyone can select)
CREATE POLICY "Public can view products"
ON products FOR SELECT
USING (status = 'active');

-- Authenticated insert
CREATE POLICY "Authenticated users can create orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Tenant access (owner or staff)
CREATE POLICY "Store members can manage products"
ON products FOR ALL
USING (can_access_store(auth.uid(), store_id));

-- RPC only (no direct access)
CREATE POLICY "Deny direct customer insert"
ON customers FOR INSERT
WITH CHECK (false); -- Use RPC function instead
```

### SECURITY DEFINER Functions

For operations that need elevated privileges:

```sql
CREATE OR REPLACE FUNCTION store_customer_login(
  p_store_id UUID,
  p_email TEXT,
  p_password_hash TEXT,
  p_token_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- CRITICAL: Prevents search_path injection
AS $$
BEGIN
  -- Function has elevated access to tables
  -- RLS policies are bypassed
END;
$$;
```

### Access Control Functions

```sql
-- Check if user can access a store
CREATE FUNCTION can_access_store(_store_id UUID, _user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores WHERE id = _store_id AND owner_id = _user_id
    UNION
    SELECT 1 FROM store_staff WHERE store_id = _store_id AND user_id = _user_id
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Check if user is super admin
CREATE FUNCTION is_super_admin(_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = _user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;
```

---

## API Patterns

### Frontend → Supabase Direct

For simple CRUD operations with RLS protection:

```typescript
import { supabase } from '@/integrations/supabase/client';

// Select with filters
const { data, error } = await supabase
  .from('products')
  .select('*, category:categories(*)')
  .eq('store_id', storeId)
  .eq('status', 'active')
  .order('created_at', { ascending: false });

// Insert
const { data, error } = await supabase
  .from('products')
  .insert({ name, price, store_id: storeId })
  .select()
  .single();

// Update
const { error } = await supabase
  .from('products')
  .update({ name, price })
  .eq('id', productId);

// Delete
const { error } = await supabase
  .from('products')
  .delete()
  .eq('id', productId);
```

### Frontend → RPC Functions

For complex operations or when RLS would block access:

```typescript
// Call database function
const { data, error } = await supabase.rpc('create_or_update_checkout_customer', {
  p_store_id: storeId,
  p_email: email,
  p_full_name: fullName,
  p_phone: phone,
  p_address: address,
  p_city: city,
});
```

### Frontend → Edge Functions

For operations requiring server-side secrets or complex logic:

```typescript
const response = await fetch(
  `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/store-customer-auth`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      action: 'login',
      storeId,
      email,
      password,
    }),
  }
);

const result = await response.json();
```

---

## File Storage

### Buckets

| Bucket | Access | Purpose |
|--------|--------|---------|
| `store-assets` | Public | Store logos, banners |
| `product-images` | Public | Product photos |
| `customer-uploads` | Private | Customer documents (future) |

### Upload Pattern

```typescript
// Upload file
const fileName = `${storeId}/${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('product-images')
  .upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('product-images')
  .getPublicUrl(fileName);
```

### Storage Policies

```sql
-- Anyone can view product images
CREATE POLICY "Public product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Only store owners can upload
CREATE POLICY "Store owners can upload product images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' 
  AND auth.uid() IS NOT NULL
);
```

---

## Environment Configuration

### Auto-Managed Variables

These are automatically configured by Lovable Cloud:

```bash
# Frontend (.env)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGc...
VITE_SUPABASE_PROJECT_ID=xxxx

# Edge Functions (Deno.env)
SUPABASE_URL          # Same as VITE_SUPABASE_URL
SUPABASE_ANON_KEY     # Anon key for authenticated requests
SUPABASE_SERVICE_ROLE_KEY  # Admin key (bypasses RLS)
```

### Adding Secrets

For API keys and sensitive data:

1. Use Lovable's secrets tool
2. Secrets are encrypted and stored securely
3. Available in edge functions via `Deno.env.get('SECRET_NAME')`

---

## Error Handling

### Database Errors

```typescript
const { data, error } = await supabase.from('products').select();

if (error) {
  console.error('Database error:', error.message);
  
  // Common error codes
  if (error.code === 'PGRST116') {
    // No rows returned when using .single()
  } else if (error.code === '23505') {
    // Unique constraint violation
  } else if (error.code === '42501') {
    // RLS policy violation
  }
}
```

### Edge Function Errors

```typescript
try {
  const response = await fetch(edgeFunctionUrl, { ... });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Edge function failed');
  }
  
  const data = await response.json();
  return data;
} catch (error) {
  console.error('Edge function error:', error);
  throw error;
}
```

### Error Response Format

All APIs return consistent error format:

```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

---

## Best Practices

### 1. Always Filter by store_id

```typescript
// ✅ CORRECT - Include store filter
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', currentStoreId);

// ❌ WRONG - No store filter (RLS will block anyway, but be explicit)
const { data } = await supabase
  .from('products')
  .select('*');
```

### 2. Use RPC for Complex Operations

```typescript
// ✅ CORRECT - Use RPC for multi-table operations
const { data } = await supabase.rpc('place_checkout_order', {
  p_store_id: storeId,
  p_customer_id: customerId,
  p_items: items,
  p_shipping_address: address,
});

// ❌ WRONG - Multiple separate queries
await supabase.from('orders').insert(order);
await supabase.from('order_items').insert(items);
await supabase.from('customers').update(stats);
// Race conditions, partial failures possible
```

### 3. Hash Passwords Server-Side

```typescript
// ✅ CORRECT - Hash in edge function
const response = await fetch(edgeFunctionUrl, {
  body: JSON.stringify({ action: 'register', password: plainText }),
});

// ❌ WRONG - Hash client-side (can be bypassed)
const hash = await bcrypt.hash(password, 12);
await supabase.rpc('register', { password_hash: hash });
```

### 4. Validate All Inputs

```typescript
// Edge function input validation
const { action, storeId, email } = await req.json();

if (!action || !storeId) {
  return new Response(
    JSON.stringify({ success: false, error: 'Missing required fields' }),
    { status: 400 }
  );
}

if (email && !isValidEmail(email)) {
  return new Response(
    JSON.stringify({ success: false, error: 'Invalid email format' }),
    { status: 400 }
  );
}
```

### 5. Log for Debugging

```typescript
// Edge function logging
console.log(`[store-customer-auth] Action: ${action}, Store: ${storeId}`);

// Frontend logging with prefixes
console.log('[CHECKOUT] Starting order placement...');
console.error('[AUTH] Session validation failed:', error);
```

---

*This documentation is maintained with the codebase. Last update: 2026-01-15*
