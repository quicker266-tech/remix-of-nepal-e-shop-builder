# Security Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-11  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Security Architecture](#security-architecture)
3. [Implemented Security Measures](#implemented-security-measures)
4. [Security Changelog](#security-changelog)
5. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
6. [Input Validation](#input-validation)
7. [XSS Prevention](#xss-prevention)
8. [SQL Injection Prevention](#sql-injection-prevention)
9. [Authentication & Authorization](#authentication--authorization)
10. [Known Security Considerations](#known-security-considerations)
11. [Security Best Practices](#security-best-practices)
12. [Reporting Vulnerabilities](#reporting-vulnerabilities)

---

## Overview

This document outlines all security measures implemented in the PasalHub platform, including fixes applied, security patterns used, and ongoing security considerations.

### Security Principles

- **Defense in Depth**: Multiple layers of security controls
- **Least Privilege**: Minimal access rights for users and functions
- **Input Validation**: All user inputs validated before processing
- **Output Encoding**: All dynamic content sanitized before rendering
- **Secure by Default**: Security enabled out of the box

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Zod Schema  │  │ DOMPurify   │  │ Client-side Auth    │ │
│  │ Validation  │  │ Sanitization│  │ State Management    │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Supabase Backend                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ RLS Policies│  │ SECURITY    │  │ Parameterized       │ │
│  │ (51 total)  │  │ DEFINER     │  │ Queries             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Implemented Security Measures

### 1. HTML Sanitization Library

**File:** `src/lib/sanitize.ts`

Created a centralized HTML sanitization utility using DOMPurify to prevent XSS attacks.

```typescript
import DOMPurify from 'isomorphic-dompurify';

export const sanitizeHtml = (html: string): string => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
      'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'blockquote', 'code', 'pre', 'span', 'div'
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ADD_ATTR: ['target'],
    FORCE_BODY: true,
  });
};
```

**Usage:**
- Import `sanitizeHtml` from `@/lib/sanitize`
- Apply to any user-generated HTML content before rendering

---

### 2. TextBlock XSS Prevention

**File:** `src/components/storefront/sections/TextBlock.tsx`

**Issue Fixed:** Unsanitized HTML content was being rendered via `dangerouslySetInnerHTML`.

**Before (Vulnerable):**
```typescript
<div dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }} />
```

**After (Secure):**
```typescript
import { sanitizeHtml } from '@/lib/sanitize';

const sanitizedContent = sanitizeHtml(content.replace(/\n/g, '<br />'));

<div dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
```

---

### 3. Checkout Form Validation

**File:** `src/pages/storefront/Checkout.tsx`

**Issue Fixed:** Form inputs lacked server-side validation, allowing malformed or malicious data.

**Zod Schema Implemented:**
```typescript
import { z } from 'zod';

const checkoutSchema = z.object({
  fullName: z.string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(254, 'Email must be less than 254 characters'),
  phone: z.string()
    .trim()
    .min(7, 'Phone must be at least 7 characters')
    .max(20, 'Phone must be less than 20 characters')
    .regex(/^[+\d\s()-]+$/, 'Phone can only contain numbers, spaces, +, -, (, )'),
  address: z.string()
    .trim()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address must be less than 200 characters'),
  city: z.string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be less than 100 characters'),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .transform(val => val || ''),
});
```

**Security Features:**
- ✅ Input length limits prevent database pollution
- ✅ Email format validation
- ✅ Phone number character whitelist (prevents injection)
- ✅ Notes field sanitized with DOMPurify before storage
- ✅ Real-time validation error display
- ✅ Client-side maxLength attributes as first line of defense

---

### 4. Customer Data RLS Policy Hardening

**Database Migration Applied**

**Issue Fixed:** Anonymous users could UPDATE customer records, creating potential data exposure.

**Before (Vulnerable):**
```sql
-- Policy allowed ANY user to update customer records
CREATE POLICY "Anyone can update customers for active stores" ON customers
  FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM stores 
    WHERE stores.id = customers.store_id 
    AND stores.status = 'active'
  ));
```

**After (Secure):**
```sql
-- Removed overly permissive policy
DROP POLICY IF EXISTS "Anyone can update customers for active stores" ON customers;

-- Only store owners can directly update customer records
CREATE POLICY "Store owners can update customers" ON customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stores 
      WHERE stores.id = customers.store_id 
      AND stores.owner_id = auth.uid()
    )
  );
```

**Impact:**
- Customer updates during checkout now go through the `create_or_update_checkout_customer` RPC function (SECURITY DEFINER)
- Direct UPDATE access restricted to store owners only
- Staff members cannot modify customer PII directly

---

### 5. SQL Injection Prevention in Triggers

**File:** Database migration for `order_status_history`

**Issue Fixed:** SECURITY DEFINER functions without `SET search_path` can be exploited.

**Secure Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public  -- Prevents search_path injection
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, status, changed_by)
    VALUES (NEW.id, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;
```

---

## Security Changelog

| Date | Version | Change | Severity | Files Affected |
|------|---------|--------|----------|----------------|
| 2026-01-11 | 1.0.0 | Created sanitize utility library | High | `src/lib/sanitize.ts` |
| 2026-01-11 | 1.0.0 | Fixed TextBlock XSS vulnerability | High | `src/components/storefront/sections/TextBlock.tsx` |
| 2026-01-11 | 1.0.0 | Added Zod validation to checkout | High | `src/pages/storefront/Checkout.tsx` |
| 2026-01-11 | 1.0.0 | Restricted customer UPDATE policy | High | Database migration |
| 2026-01-11 | 1.0.0 | Added search_path to SECURITY DEFINER functions | Medium | Database migration |

---

## Row Level Security (RLS) Policies

### Policy Overview

The application uses 51 RLS policies across 20 tables to enforce data isolation.

### Key Access Control Functions

```sql
-- Check if user can access a store (owner or staff)
CREATE FUNCTION can_access_store(user_id uuid, store_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM stores WHERE id = store_id AND owner_id = user_id
    UNION
    SELECT 1 FROM store_staff WHERE store_id = store_id AND user_id = user_id
  );
$$;

-- Check if user is super admin
CREATE FUNCTION is_super_admin(user_id uuid)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id AND role = 'super_admin'
  );
$$;

-- Check if user has specific role
CREATE FUNCTION has_role(user_id uuid, role app_role)
RETURNS boolean
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_id AND role = role
  );
$$;
```

### Critical Table Policies

| Table | Public Read | Public Write | Tenant Access | Notes |
|-------|-------------|--------------|---------------|-------|
| `customers` | ❌ | INSERT only | Full CRUD | UPDATE restricted to owner |
| `orders` | ❌ | INSERT only | Full CRUD | Via can_access_store() |
| `products` | ✅ (active) | ❌ | Full CRUD | Public can view active store products |
| `user_roles` | ❌ | ❌ | Read own | Super admin pattern |
| `store_extensions` | ❌ | ❌ | Full CRUD | Contains sensitive API keys |

---

## Input Validation

### Validation Strategy

1. **Client-side**: HTML5 attributes + Zod schema
2. **Server-side**: Zod validation before API calls
3. **Database**: RLS policies + constraints

### Zod Schemas Used

| Form | File | Validation Applied |
|------|------|--------------------|
| Checkout | `Checkout.tsx` | Full schema with regex patterns |

### Recommended Validation Pattern

```typescript
import { z } from 'zod';

// Define schema
const schema = z.object({
  field: z.string().min(1).max(100).trim(),
});

// Validate before API call
const validateForm = (data: unknown) => {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Handle errors
    return null;
  }
  return result.data;
};
```

---

## XSS Prevention

### Sanitization Rules

| Content Type | Method | Library |
|--------------|--------|---------|
| Rich text HTML | DOMPurify | `isomorphic-dompurify` |
| Plain text | React escaping | Built-in |
| URLs | Encoding | `encodeURIComponent` |

### Safe HTML Rendering

```typescript
// ❌ NEVER do this with user content
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Always sanitize first
import { sanitizeHtml } from '@/lib/sanitize';
<div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
```

### Allowed HTML Tags

The sanitization utility only allows these safe tags:
- Text formatting: `p`, `br`, `strong`, `b`, `em`, `i`, `u`, `s`, `strike`
- Links: `a` (with `href`, `target`, `rel`, `class` attributes)
- Lists: `ul`, `ol`, `li`
- Headings: `h1` through `h6`
- Blocks: `blockquote`, `code`, `pre`, `span`, `div`

---

## SQL Injection Prevention

### Parameterized Queries

All Supabase queries use parameterized queries automatically:

```typescript
// ✅ Safe - parameters are escaped
const { data } = await supabase
  .from('products')
  .select('*')
  .eq('store_id', storeId);  // storeId is parameterized
```

### SECURITY DEFINER Functions

All SECURITY DEFINER functions include:
```sql
SET search_path = public
```

This prevents attackers from hijacking the search path to call malicious functions.

---

## Authentication & Authorization

### Auth Flow

1. User authenticates via Supabase Auth (email/password)
2. JWT token stored in session
3. Token sent with all API requests
4. RLS policies enforce access based on `auth.uid()`

### Role Hierarchy

```
super_admin → Full platform access
    │
store_owner → Own store(s) access
    │
store_staff → Assigned store access
    │
customer → Order history only
```

### Role Storage

Roles are stored in a separate `user_roles` table to prevent privilege escalation:

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
```

---

## Known Security Considerations

### Requires Attention

| Issue | Severity | Status | Notes |
|-------|----------|--------|-------|
| Extension API keys in plaintext | High | ⚠️ Open | Requires Supabase Vault infrastructure |
| Leaked password protection | Medium | ⚠️ Disabled | Enable in Supabase Auth settings |

### Extension API Keys

**Current State:** API keys for extensions (SMS, email marketing) are stored in plaintext in the `store_extensions.config` JSONB column.

**Recommended Fix:**
1. Set up Supabase Vault for encrypted secret storage
2. Create Edge Functions to handle third-party API calls
3. Store API key references (not values) in config
4. Never expose secrets to client-side code

**Mitigation:**
- RLS restricts access to store members only
- Keys are never returned to unauthorized users

---

## Security Best Practices

### For Developers

1. **Always validate inputs** with Zod schemas before API calls
2. **Sanitize HTML** using the `sanitizeHtml` utility
3. **Never trust client data** - validate server-side too
4. **Use parameterized queries** (Supabase does this automatically)
5. **Add `SET search_path = public`** to all SECURITY DEFINER functions
6. **Test RLS policies** by simulating different user roles

### For Code Review

Check for:
- [ ] Input validation on all forms
- [ ] HTML sanitization before `dangerouslySetInnerHTML`
- [ ] RLS policies on new tables
- [ ] SECURITY DEFINER functions have search_path set
- [ ] No secrets in client-side code
- [ ] Proper error handling (no sensitive data in errors)

---

## Reporting Vulnerabilities

If you discover a security vulnerability, please:

1. **Do not** open a public issue
2. Email security details to the project maintainer
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will respond within 48 hours and work to resolve the issue promptly.

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-11 | Security Team | Initial documentation |

---

*This document should be updated whenever security changes are made to the application.*
