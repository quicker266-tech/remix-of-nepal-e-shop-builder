# Frontend Architecture Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-15  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Routing Architecture](#routing-architecture)
5. [Context Providers](#context-providers)
6. [Component Library](#component-library)
7. [Styling System](#styling-system)
8. [Data Fetching Patterns](#data-fetching-patterns)
9. [Form Handling](#form-handling)
10. [State Management](#state-management)
11. [Key Hooks](#key-hooks)
12. [Best Practices](#best-practices)

---

## Overview

PasalHub is a multi-tenant e-commerce platform built with React 18 and TypeScript. The frontend serves three distinct user groups:

1. **Store Owners** - Dashboard for managing stores, products, orders
2. **Platform Admins** - Super admin dashboard for platform management
3. **Customers** - Storefront for browsing and purchasing

---

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.3.1 | UI Framework |
| TypeScript | Latest | Type Safety |
| Vite | Latest | Build Tool & Dev Server |
| Tailwind CSS | Latest | Utility-First Styling |
| shadcn/ui | Latest | Component Library |
| React Router | 6.30.1 | Client-Side Routing |
| TanStack Query | 5.83.0 | Server State Management |
| React Hook Form | 7.61.1 | Form Management |
| Zod | 3.25.76 | Schema Validation |
| Lucide React | 0.462.0 | Icon Library |

---

## Project Structure

```
src/
├── components/                    # Reusable UI components
│   ├── ui/                       # shadcn/ui base components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   └── ... (50+ components)
│   ├── dashboard/                # Dashboard layout components
│   │   ├── DashboardHeader.tsx   # Top header with user menu
│   │   ├── DashboardSidebar.tsx  # Navigation sidebar
│   │   └── StoreSwitcher.tsx     # Store selection dropdown
│   ├── admin/                    # Super admin components
│   │   ├── SuperAdminHeader.tsx
│   │   └── SuperAdminSidebar.tsx
│   ├── products/                 # Product management
│   │   ├── ImageUpload.tsx       # Image upload with preview
│   │   ├── ProductVariantsSection.tsx
│   │   └── QuickCategoryModal.tsx
│   ├── store-builder/            # Visual page editor
│   │   ├── StoreBuilder.tsx      # Main container
│   │   ├── types.ts              # TypeScript definitions
│   │   ├── constants.ts          # Section definitions
│   │   ├── editor/               # Editor components
│   │   └── utils/                # Helper functions
│   └── storefront/               # Customer-facing components
│       ├── StorefrontHeader.tsx  # Store header
│       ├── StorefrontFooter.tsx  # Store footer
│       ├── sections/             # Section renderers (19 types)
│       └── pages/                # Page content components
│
├── contexts/                     # React Context providers
│   ├── AuthContext.tsx           # Authentication state
│   ├── StoreContext.tsx          # Current store selection
│   ├── CartContext.tsx           # Shopping cart state
│   ├── StorefrontContext.tsx     # Storefront data provider
│   └── StoreCustomerAuthContext.tsx # Store-specific customer auth
│
├── hooks/                        # Custom React hooks
│   ├── useStoreBuilder.ts        # Store builder data hooks
│   ├── useStoreLinks.ts          # Store URL generation
│   ├── use-mobile.tsx            # Responsive detection
│   └── use-toast.ts              # Toast notifications
│
├── layouts/                      # Page layout wrappers
│   ├── DashboardLayout.tsx       # Store owner dashboard
│   └── SuperAdminLayout.tsx      # Admin dashboard
│
├── pages/                        # Route page components
│   ├── Index.tsx                 # Router entry point
│   ├── LandingPage.tsx           # Marketing homepage
│   ├── AuthPage.tsx              # Login/Signup
│   ├── NotFound.tsx              # 404 page
│   ├── admin/                    # Super admin pages
│   ├── dashboard/                # Store owner pages
│   └── storefront/               # Customer pages
│
├── routes/                       # Route configuration
│   └── StorefrontRoutes.tsx      # Storefront route definitions
│
├── integrations/                 # External integrations
│   └── supabase/
│       ├── client.ts             # Supabase client (auto-generated)
│       └── types.ts              # Database types (auto-generated)
│
├── lib/                          # Utility functions
│   ├── utils.ts                  # General utilities (cn, etc.)
│   ├── sanitize.ts               # HTML sanitization
│   └── subdomain.ts              # Subdomain detection
│
├── App.tsx                       # Root component with routes
├── App.css                       # Global styles
├── index.css                     # Tailwind & CSS variables
└── main.tsx                      # Application entry point
```

---

## Routing Architecture

### Route Groups

#### 1. Public Routes
```typescript
/                    → LandingPage (marketing)
/auth                → AuthPage (login/signup)
```

#### 2. Dashboard Routes (Authenticated Store Owners)
```typescript
/dashboard                      → DashboardHome
/dashboard/create-store         → CreateStore
/dashboard/categories           → CategoriesList
/dashboard/products             → ProductsList
/dashboard/products/new         → ProductForm (create)
/dashboard/products/:id/edit    → ProductForm (edit)
/dashboard/orders               → OrdersList
/dashboard/orders/:id           → OrderDetails
/dashboard/customers            → CustomersList
/dashboard/customers/:id        → CustomerDetail
/dashboard/discounts            → DiscountsList
/dashboard/shipping             → ShippingSettings
/dashboard/extensions           → ExtensionsList
/dashboard/settings             → StoreSettings
/dashboard/store-builder        → StoreBuilder
/dashboard/profile              → ProfilePage
```

#### 3. Admin Routes (Super Admins Only)
```typescript
/admin                → AdminOverview
/admin/stores         → AdminStores
/admin/users          → AdminUsers
```

#### 4. Storefront Routes (Customer-Facing)
```typescript
/store/:storeSlug                           → StorePage (homepage)
/store/:storeSlug/page/:pageSlug            → StorePage (custom)
/store/:storeSlug/catalog                   → StoreCatalog
/store/:storeSlug/category/:categorySlug    → StoreCatalog (filtered)
/store/:storeSlug/product/:productSlug      → ProductDetail
/store/:storeSlug/cart                      → Cart
/store/:storeSlug/checkout                  → Checkout
/store/:storeSlug/account                   → CustomerAccount
/store/:storeSlug/account/profile           → CustomerProfile
/store/:storeSlug/account/orders            → CustomerOrders
/store/:storeSlug/auth                      → CustomerAuth
```

### Route Protection

```typescript
// Dashboard routes wrap with AuthContext check
<Route element={<DashboardLayout />}>
  {/* Protected routes */}
</Route>

// Admin routes check for super_admin role
<Route element={<SuperAdminLayout />}>
  {/* Admin only routes */}
</Route>
```

---

## Context Providers

### AuthContext
Manages platform-level authentication for store owners and admins.

```typescript
interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}
```

**Usage:**
```tsx
const { user, loading, signOut } = useAuth();
```

### StoreContext
Manages current store selection for dashboard.

```typescript
interface StoreContextType {
  currentStore: Store | null;
  stores: Store[];
  loading: boolean;
  setCurrentStore: (store: Store) => void;
  refetchStores: () => void;
}
```

**Usage:**
```tsx
const { currentStore, setCurrentStore } = useStore();
```

### CartContext
Manages shopping cart state per store.

```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variant?: Variant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}
```

**Usage:**
```tsx
const { items, addItem, total } = useCart();
```

### StorefrontContext
Provides unified store data to all storefront pages.

```typescript
interface StorefrontContextType {
  store: Store | null;
  storeSlug: string | null;
  storeId: string | null;
  theme: Theme | null;
  headerFooter: HeaderFooterConfig | null;
  navItems: NavItem[];
  loading: boolean;
  error: string | null;
  isSubdomainMode: boolean;
  refetch: () => Promise<void>;
}
```

**Features:**
- Automatic store detection (subdomain or path-based)
- Single data fetch for store, theme, header/footer, navigation
- Reduces duplicate API calls across storefront pages

**Usage:**
```tsx
const { store, theme, loading, isSubdomainMode } = useStorefront();
```

### StoreCustomerAuthContext
Manages store-specific customer authentication.

```typescript
interface StoreCustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
}
```

**Key Features:**
- Per-store customer isolation
- Session stored in localStorage with store-specific key
- Automatic session validation on mount
- Password hashing via edge function

**Usage:**
```tsx
const { customer, isAuthenticated, login, logout } = useStoreCustomerAuth();
```

---

## Component Library

### shadcn/ui Components
All base UI components from shadcn/ui are in `src/components/ui/`:

| Component | Usage |
|-----------|-------|
| `Button` | Primary action buttons |
| `Input` | Text inputs |
| `Select` | Dropdown selection |
| `Dialog` | Modal dialogs |
| `Sheet` | Slide-out panels |
| `Card` | Content containers |
| `Table` | Data tables |
| `Form` | Form wrappers |
| `Toast` | Notifications |
| `Tabs` | Tab navigation |
| `Accordion` | Collapsible content |

### Custom Components

#### Dashboard Components
- `DashboardHeader` - Top bar with store switcher and user menu
- `DashboardSidebar` - Navigation with collapsible sections
- `StoreSwitcher` - Dropdown to switch between stores

#### Storefront Components
- `StorefrontHeader` - Customer-facing header with nav, cart, account
- `StorefrontFooter` - Footer with links, social, newsletter
- 19 Section Components (HeroBanner, ProductGrid, etc.)

#### Product Components
- `ImageUpload` - Drag-and-drop image uploader
- `ProductVariantsSection` - Variant management
- `QuickCategoryModal` - Inline category creation

---

## Styling System

### Design Tokens

All colors use semantic tokens defined in `index.css`:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --muted: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
  --destructive: 0 84.2% 60.2%;
  --border: 214.3 31.8% 91.4%;
  /* ... more tokens */
}
```

### Usage Rules

```tsx
// ✅ CORRECT - Use semantic tokens
<div className="bg-background text-foreground border-border" />
<button className="bg-primary text-primary-foreground" />

// ❌ WRONG - Never use direct colors
<div className="bg-white text-black" />
<button className="bg-blue-500 text-white" />
```

### Utility Classes

Common patterns:
```tsx
// Card container
<div className="rounded-lg border bg-card text-card-foreground shadow-sm" />

// Muted text
<p className="text-sm text-muted-foreground" />

// Destructive action
<button className="bg-destructive text-destructive-foreground" />
```

---

## Data Fetching Patterns

### TanStack Query for Server State

```typescript
// Fetch products for a store
const { data: products, isLoading, error } = useQuery({
  queryKey: ['products', storeId],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*, category:categories(*)')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  enabled: !!storeId,
});
```

### Mutations with Cache Invalidation

```typescript
const queryClient = useQueryClient();

const createProduct = useMutation({
  mutationFn: async (product: ProductInput) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    toast({ title: 'Product created!' });
  },
});
```

### RPC Function Calls

```typescript
const { data } = await supabase.rpc('store_customer_validate_session', {
  p_store_id: storeId,
  p_token_hash: tokenHash,
});
```

---

## Form Handling

### React Hook Form + Zod Pattern

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().optional(),
});

type ProductForm = z.infer<typeof productSchema>;

// Use in component
function ProductForm() {
  const form = useForm<ProductForm>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      price: 0,
      description: '',
    },
  });

  const onSubmit = async (values: ProductForm) => {
    // Handle submission
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}
```

---

## State Management

### State Type Selection

| State Type | Solution | Example |
|------------|----------|---------|
| Server State | TanStack Query | Products, Orders |
| Global UI State | React Context | Current Store, Auth |
| Local UI State | useState | Form fields, modals |
| URL State | React Router | Filters, pagination |

### Avoid These Patterns

```tsx
// ❌ DON'T store server data in useState
const [products, setProducts] = useState([]);
useEffect(() => {
  fetchProducts().then(setProducts);
}, []);

// ✅ DO use TanStack Query
const { data: products } = useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
});
```

---

## Key Hooks

### useStoreBuilder
Manages all store builder state and operations.

```typescript
const {
  // Data
  theme,
  pages,
  activePage,
  sections,
  headerFooter,
  navItems,
  
  // Loading states
  loadingTheme,
  loadingPages,
  loadingSections,
  
  // Actions
  setActivePage,
  updateTheme,
  createPage,
  updatePage,
  deletePage,
  addSection,
  updateSectionConfig,
  deleteSection,
  reorderSections,
  updateHeaderFooter,
  addNavItem,
  updateNavItem,
  deleteNavItem,
} = useStoreBuilder(storeId);
```

### useStoreLinks
Generates correct URLs based on routing mode.

```typescript
const { getStoreLink, getPageLink, getProductLink } = useStoreLinks();

// In subdomain mode: /page/about
// In path mode: /store/mystore/page/about
const aboutUrl = getPageLink('about');
```

### useMobile
Detects mobile viewport.

```typescript
const isMobile = useMobile();
```

### useToast
Shows toast notifications.

```typescript
const { toast } = useToast();

toast({
  title: 'Success!',
  description: 'Product saved.',
});

toast({
  title: 'Error',
  description: 'Something went wrong.',
  variant: 'destructive',
});
```

---

## Best Practices

### 1. Component Organization

```
// Feature-based structure
components/
└── products/
    ├── ProductCard.tsx       # Display component
    ├── ProductForm.tsx       # Form component
    ├── ProductList.tsx       # List container
    └── index.ts              # Exports
```

### 2. TypeScript Usage

```typescript
// Define prop types
interface ProductCardProps {
  product: Product;
  onEdit?: (id: string) => void;
  showActions?: boolean;
}

// Use type inference where possible
const [products, setProducts] = useState<Product[]>([]);
```

### 3. Error Handling

```typescript
// Wrap async operations
try {
  await createProduct(data);
  toast({ title: 'Success!' });
} catch (error) {
  console.error('Failed to create product:', error);
  toast({
    title: 'Error',
    description: error.message,
    variant: 'destructive',
  });
}
```

### 4. Performance

```typescript
// Memoize expensive computations
const sortedProducts = useMemo(
  () => products.sort((a, b) => a.name.localeCompare(b.name)),
  [products]
);

// Memoize callbacks passed to children
const handleClick = useCallback((id: string) => {
  // Handle click
}, []);
```

### 5. Accessibility

```tsx
// Always include aria labels
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Use semantic HTML
<nav aria-label="Main navigation">
  {/* nav items */}
</nav>
```

---

*This documentation is maintained with the codebase. Last update: 2026-01-15*
