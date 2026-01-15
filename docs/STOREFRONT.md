# Customer Storefront Documentation

**Project:** PasalHub Multi-Tenant E-Commerce Platform  
**Last Updated:** 2026-01-15  
**Version:** 1.0.0

---

## Table of Contents

1. [Overview](#overview)
2. [Routing Architecture](#routing-architecture)
3. [Context Providers](#context-providers)
4. [Page Components](#page-components)
5. [Section Rendering](#section-rendering)
6. [Customer Authentication](#customer-authentication)
7. [Shopping Cart](#shopping-cart)
8. [Checkout Flow](#checkout-flow)
9. [Customer Account](#customer-account)
10. [Subdomain & Custom Domain Support](#subdomain--custom-domain-support)
11. [SEO & Performance](#seo--performance)
12. [Styling & Theming](#styling--theming)

---

## Overview

The Customer Storefront is the public-facing e-commerce experience. It renders store pages dynamically based on configuration from the Store Builder, displays products, handles shopping cart, checkout, and customer accounts.

### Key Features

- **Dynamic Page Rendering** - Pages and sections from database
- **Theme Application** - Store-specific colors, fonts, layout
- **Shopping Cart** - Persistent cart with variants support
- **Customer Authentication** - Per-store customer accounts
- **Checkout** - Guest or authenticated checkout
- **Order History** - Customers can view past orders
- **Responsive Design** - Mobile-first approach
- **Subdomain Support** - Custom subdomains for stores

---

## Routing Architecture

### Path-Based Routes (Default)

```
/store/:storeSlug                           → Store Homepage
/store/:storeSlug/page/:pageSlug            → Custom Pages
/store/:storeSlug/catalog                   → All Products
/store/:storeSlug/category/:categorySlug    → Category Products
/store/:storeSlug/product/:productSlug      → Product Detail
/store/:storeSlug/cart                      → Shopping Cart
/store/:storeSlug/checkout                  → Checkout
/store/:storeSlug/auth                      → Customer Login/Register
/store/:storeSlug/account                   → Account Dashboard
/store/:storeSlug/account/profile           → Profile Settings
/store/:storeSlug/account/orders            → Order History
```

### Subdomain Routes (When Enabled)

```
mystore.pasalhub.com/                       → Store Homepage
mystore.pasalhub.com/page/:pageSlug         → Custom Pages
mystore.pasalhub.com/catalog                → All Products
mystore.pasalhub.com/category/:categorySlug → Category Products
mystore.pasalhub.com/product/:productSlug   → Product Detail
mystore.pasalhub.com/cart                   → Shopping Cart
mystore.pasalhub.com/checkout               → Checkout
mystore.pasalhub.com/auth                   → Customer Login/Register
mystore.pasalhub.com/account                → Account Dashboard
```

### Route Configuration

```typescript
// src/routes/StorefrontRoutes.tsx
export function StorefrontRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/page/:pageSlug" element={<StorePage />} />
      <Route path="/catalog" element={<StoreCatalog />} />
      <Route path="/category/:categorySlug" element={<StoreCatalog />} />
      <Route path="/product/:productSlug" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/auth" element={<CustomerAuth />} />
      <Route path="/account" element={<CustomerAccount />} />
      <Route path="/account/profile" element={<CustomerProfile />} />
      <Route path="/account/orders" element={<CustomerOrders />} />
    </Routes>
  );
}
```

---

## Context Providers

### Provider Hierarchy

```tsx
<StorefrontProvider storeSlug={storeSlug}>
  <StoreCustomerAuthProvider>
    <CartProvider>
      {/* Storefront routes */}
    </CartProvider>
  </StoreCustomerAuthProvider>
</StorefrontProvider>
```

### StorefrontContext

Provides store data to all storefront components:

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

**Usage:**
```tsx
const { store, theme, navItems, isSubdomainMode } = useStorefront();
```

### StoreCustomerAuthContext

Manages store-specific customer authentication:

```typescript
interface StoreCustomerAuthContextType {
  customer: Customer | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: ProfileUpdate) => Promise<void>;
  refreshSession: () => Promise<void>;
}
```

**Usage:**
```tsx
const { customer, isAuthenticated, login, logout } = useStoreCustomerAuth();
```

### CartContext

Manages shopping cart:

```typescript
interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity: number, variant?: Variant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  subtotal: number;
  itemCount: number;
}
```

**Cart Persistence:**
- Cart stored in localStorage with store-specific key
- Survives page refreshes
- Separate cart per store

---

## Page Components

### StorePage

Dynamic page renderer for all custom pages.

```typescript
// src/pages/storefront/StorePage.tsx

function StorePage() {
  const { pageSlug } = useParams();
  const { store, theme, headerFooter } = useStorefront();
  
  // Fetch page and sections
  const { data: page } = useQuery({
    queryKey: ['store-page', store?.id, pageSlug],
    queryFn: () => fetchPage(store.id, pageSlug || 'home'),
  });
  
  const { data: sections } = useQuery({
    queryKey: ['page-sections', page?.id],
    queryFn: () => fetchSections(page.id),
    enabled: !!page,
  });
  
  return (
    <div style={themeStyles}>
      {page?.show_header && <StorefrontHeader />}
      
      <main>
        {/* Before-content sections */}
        {sections?.filter(s => s.position === 'before_content').map(renderSection)}
        
        {/* Built-in content for system pages */}
        {renderBuiltInContent(page.page_type)}
        
        {/* After-content sections */}
        {sections?.filter(s => s.position === 'after_content').map(renderSection)}
      </main>
      
      {page?.show_footer && <StorefrontFooter />}
    </div>
  );
}
```

### StoreCatalog

Product listing with filters and sorting.

```typescript
// src/pages/storefront/StoreCatalog.tsx

function StoreCatalog() {
  const { categorySlug } = useParams();
  const { storeId } = useStorefront();
  
  const [filters, setFilters] = useState({
    search: '',
    priceMin: null,
    priceMax: null,
    sortBy: 'newest',
  });
  
  const { data: products } = useQuery({
    queryKey: ['products', storeId, categorySlug, filters],
    queryFn: () => fetchProducts(storeId, categorySlug, filters),
  });
  
  return (
    <div className="container mx-auto">
      <div className="flex gap-8">
        <aside className="w-64">
          <ProductFilters filters={filters} onChange={setFilters} />
        </aside>
        <main className="flex-1">
          <ProductGrid products={products} />
        </main>
      </div>
    </div>
  );
}
```

### ProductDetail

Individual product page.

```typescript
// src/pages/storefront/ProductDetail.tsx

function ProductDetail() {
  const { productSlug } = useParams();
  const { storeId } = useStorefront();
  const { addItem } = useCart();
  
  const { data: product } = useQuery({
    queryKey: ['product', storeId, productSlug],
    queryFn: () => fetchProduct(storeId, productSlug),
  });
  
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  
  const handleAddToCart = () => {
    addItem(product, quantity, selectedVariant);
    toast({ title: 'Added to cart!' });
  };
  
  return (
    <div className="container mx-auto">
      <div className="grid grid-cols-2 gap-12">
        <ProductImages images={product.images} />
        <div>
          <h1>{product.name}</h1>
          <ProductPrice product={product} variant={selectedVariant} />
          <VariantSelector 
            variants={product.variants}
            selected={selectedVariant}
            onSelect={setSelectedVariant}
          />
          <QuantitySelector value={quantity} onChange={setQuantity} />
          <Button onClick={handleAddToCart}>Add to Cart</Button>
        </div>
      </div>
    </div>
  );
}
```

---

## Section Rendering

### Section Components

All storefront sections are in `src/components/storefront/sections/`:

| Component | File | Data Source |
|-----------|------|-------------|
| `HeroBanner` | HeroBanner.tsx | Config only |
| `HeroSlider` | HeroSlider.tsx | Config only |
| `HeroVideo` | HeroVideo.tsx | Config only |
| `FeaturedProducts` | FeaturedProducts.tsx | Database |
| `ProductGrid` | ProductGrid.tsx | Database |
| `CategoryGrid` | CategoryGrid.tsx | Database |
| `Testimonials` | Testimonials.tsx | Config only |
| `FAQ` | FAQ.tsx | Config only |
| `Newsletter` | Newsletter.tsx | Config only |
| `TextBlock` | TextBlock.tsx | Config only |
| `ImageText` | ImageText.tsx | Config only |
| `Gallery` | Gallery.tsx | Config only |
| `TrustBadges` | TrustBadges.tsx | Config only |
| `BrandLogos` | BrandLogos.tsx | Config only |
| `Countdown` | Countdown.tsx | Config only |
| `PromoBanner` | PromoBanner.tsx | Config only |
| `AnnouncementBar` | AnnouncementBar.tsx | Config only |
| `Spacer` | Spacer.tsx | Config only |
| `Divider` | Divider.tsx | Config only |

### Rendering Flow

```typescript
function renderSection(section: PageSection) {
  const { section_type, config, store_id } = section;
  
  switch (section_type) {
    case 'hero_banner':
      return <HeroBanner config={config} />;
    case 'featured_products':
      return <FeaturedProducts config={config} storeId={store_id} />;
    case 'product_grid':
      return <ProductGrid config={config} storeId={store_id} />;
    // ... more cases
  }
}
```

### Data-Fetching Sections

Sections that display database data:

```typescript
// FeaturedProducts.tsx
function FeaturedProducts({ config, storeId }: FeaturedProductsProps) {
  const { data: products, isLoading } = useQuery({
    queryKey: ['featured-products', storeId],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', storeId)
        .eq('featured', true)
        .eq('status', 'active')
        .limit(config.limit || 8);
      return data;
    },
  });
  
  if (isLoading) return <ProductGridSkeleton />;
  
  return (
    <section className="py-12">
      {config.title && <h2 className="text-2xl font-bold">{config.title}</h2>}
      <div className="grid grid-cols-4 gap-6">
        {products?.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
```

---

## Customer Authentication

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    STORE CUSTOMER AUTH                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Registration:                                                   │
│  1. Customer fills form (email, password, name, phone)          │
│  2. Frontend calls edge function with action: 'register'        │
│  3. Edge function hashes password with bcrypt                   │
│  4. RPC creates store_customer_account linked to customer       │
│  5. Returns success with customer_id                            │
│                                                                  │
│  Login:                                                          │
│  1. Customer enters email + password                            │
│  2. Frontend generates session token (crypto.randomUUID)        │
│  3. Edge function verifies password hash                        │
│  4. RPC creates session in store_customer_sessions              │
│  5. Returns customer data + session expiry                      │
│  6. Frontend stores token in localStorage                       │
│                                                                  │
│  Session Validation (on page load):                              │
│  1. Frontend reads token from localStorage                      │
│  2. Edge function validates with RPC                            │
│  3. Returns customer data if valid                              │
│  4. Frontend sets authenticated state                           │
│                                                                  │
│  Logout:                                                         │
│  1. Frontend calls edge function with action: 'logout'          │
│  2. RPC deletes session from store_customer_sessions            │
│  3. Frontend clears localStorage                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CustomerAuth Component

```typescript
// src/pages/storefront/CustomerAuth.tsx

function CustomerAuth() {
  const { isAuthenticated, login, register } = useStoreCustomerAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  if (isAuthenticated) {
    return <Navigate to="./account" />;
  }
  
  return (
    <div className="max-w-md mx-auto">
      <Tabs value={mode} onValueChange={setMode}>
        <TabsList>
          <TabsTrigger value="login">Login</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <LoginForm onSubmit={login} />
        </TabsContent>
        
        <TabsContent value="register">
          <RegisterForm onSubmit={register} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Protected Routes

```typescript
// Require authentication
function CustomerAccount() {
  const { isAuthenticated, isLoading } = useStoreCustomerAuth();
  const { isSubdomainMode } = useStorefront();
  
  if (isLoading) return <LoadingSpinner />;
  
  if (!isAuthenticated) {
    const authPath = isSubdomainMode ? '/auth' : '../auth';
    return <Navigate to={authPath} />;
  }
  
  return <AccountDashboard />;
}
```

---

## Shopping Cart

### Cart Structure

```typescript
interface CartItem {
  id: string;           // Unique cart item ID
  product: Product;
  variant?: Variant;
  quantity: number;
  addedAt: Date;
}

interface CartState {
  items: CartItem[];
  storeId: string;
}
```

### Cart Operations

```typescript
// Add to cart
const addItem = (product: Product, quantity: number, variant?: Variant) => {
  const existingItem = items.find(
    item => item.product.id === product.id && item.variant?.id === variant?.id
  );
  
  if (existingItem) {
    updateQuantity(existingItem.id, existingItem.quantity + quantity);
  } else {
    const newItem = {
      id: crypto.randomUUID(),
      product,
      variant,
      quantity,
      addedAt: new Date(),
    };
    setItems([...items, newItem]);
  }
};

// Remove from cart
const removeItem = (itemId: string) => {
  setItems(items.filter(item => item.id !== itemId));
};

// Update quantity
const updateQuantity = (itemId: string, quantity: number) => {
  if (quantity <= 0) {
    removeItem(itemId);
    return;
  }
  setItems(items.map(item => 
    item.id === itemId ? { ...item, quantity } : item
  ));
};

// Clear cart
const clearCart = () => {
  setItems([]);
};
```

### Cart Page

```typescript
// src/pages/storefront/Cart.tsx

function Cart() {
  const { items, removeItem, updateQuantity, subtotal, itemCount } = useCart();
  const { isSubdomainMode } = useStorefront();
  
  if (items.length === 0) {
    return <EmptyCart />;
  }
  
  const checkoutPath = isSubdomainMode ? '/checkout' : '../checkout';
  
  return (
    <div className="container mx-auto">
      <h1>Shopping Cart ({itemCount} items)</h1>
      
      <div className="space-y-4">
        {items.map(item => (
          <CartItem
            key={item.id}
            item={item}
            onRemove={() => removeItem(item.id)}
            onQuantityChange={(qty) => updateQuantity(item.id, qty)}
          />
        ))}
      </div>
      
      <div className="mt-8">
        <div className="text-xl font-bold">Subtotal: ${subtotal}</div>
        <Link to={checkoutPath}>
          <Button size="lg">Proceed to Checkout</Button>
        </Link>
      </div>
    </div>
  );
}
```

---

## Checkout Flow

### Checkout Steps

```
1. Cart Review
   ↓
2. Customer Information (guest or logged in)
   ↓
3. Shipping Address
   ↓
4. Shipping Method (calculated by city/zone)
   ↓
5. Order Review
   ↓
6. Place Order
   ↓
7. Order Confirmation
```

### Checkout Component

```typescript
// src/pages/storefront/Checkout.tsx

function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const { store, storeId } = useStorefront();
  const { customer, isAuthenticated } = useStoreCustomerAuth();
  
  const [shippingAddress, setShippingAddress] = useState({
    fullName: customer?.full_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    city: customer?.city || '',
  });
  
  const [shippingRate, setShippingRate] = useState(0);
  
  // Calculate shipping based on city
  useEffect(() => {
    const rate = calculateShipping(shippingAddress.city, store.shipping_settings);
    setShippingRate(rate);
  }, [shippingAddress.city]);
  
  const handlePlaceOrder = async () => {
    // 1. Create/update customer
    const customerId = await createCheckoutCustomer(storeId, shippingAddress);
    
    // 2. Create order
    const order = await placeOrder({
      store_id: storeId,
      customer_id: customerId,
      items: items.map(formatOrderItem),
      shipping_address: shippingAddress,
      shipping_amount: shippingRate,
    });
    
    // 3. Clear cart
    clearCart();
    
    // 4. Redirect to confirmation
    navigate(`./order-confirmation/${order.order_number}`);
  };
  
  return (
    <div className="container mx-auto grid grid-cols-2 gap-12">
      <div>
        <CheckoutForm
          values={shippingAddress}
          onChange={setShippingAddress}
        />
      </div>
      <div>
        <OrderSummary
          items={items}
          subtotal={subtotal}
          shipping={shippingRate}
          total={subtotal + shippingRate}
        />
        <Button onClick={handlePlaceOrder}>
          Place Order
        </Button>
      </div>
    </div>
  );
}
```

### Shipping Calculation

```typescript
function calculateShipping(city: string, settings: ShippingSettings): number {
  if (!settings.enable_shipping) return 0;
  
  const { shipping_zones, free_shipping_threshold, default_shipping_rate } = settings;
  
  // Check for free shipping
  if (free_shipping_threshold && subtotal >= free_shipping_threshold) {
    return 0;
  }
  
  // Find matching zone
  const zone = shipping_zones?.find(z => 
    z.cities.some(c => c.toLowerCase() === city.toLowerCase())
  );
  
  return zone?.rate ?? default_shipping_rate ?? 0;
}
```

---

## Customer Account

### Account Pages

```typescript
// Account Dashboard
function CustomerAccount() {
  const { customer } = useStoreCustomerAuth();
  
  return (
    <div className="container mx-auto">
      <h1>My Account</h1>
      <div className="grid grid-cols-3 gap-6">
        <AccountCard
          title="Profile"
          description="Manage your personal information"
          link="./profile"
        />
        <AccountCard
          title="Orders"
          description="View your order history"
          link="./orders"
        />
        <AccountCard
          title="Addresses"
          description="Manage shipping addresses"
          link="./addresses"
        />
      </div>
    </div>
  );
}

// Profile Page
function CustomerProfile() {
  const { customer, updateProfile } = useStoreCustomerAuth();
  
  const handleSubmit = async (values: ProfileUpdate) => {
    await updateProfile(values);
    toast({ title: 'Profile updated!' });
  };
  
  return (
    <ProfileForm
      defaultValues={customer}
      onSubmit={handleSubmit}
    />
  );
}

// Orders Page
function CustomerOrders() {
  const { storeId } = useStorefront();
  const { customer } = useStoreCustomerAuth();
  
  const { data: orders } = useQuery({
    queryKey: ['customer-orders', storeId, customer?.id],
    queryFn: () => fetchCustomerOrders(storeId, sessionToken),
  });
  
  return (
    <div className="space-y-4">
      {orders?.map(order => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
}
```

---

## Subdomain & Custom Domain Support

### Detection Flow

```typescript
// src/lib/subdomain.ts

export function getStoreSlugFromSubdomain(): string | null {
  const hostname = window.location.hostname;
  
  // Check for custom domain
  // (Would need DNS/database lookup in production)
  
  // Check for subdomain
  const parts = hostname.split('.');
  if (parts.length >= 3) {
    const subdomain = parts[0];
    // Exclude www, app, etc.
    if (!['www', 'app', 'admin'].includes(subdomain)) {
      return subdomain;
    }
  }
  
  return null;
}

export function isStorefrontSubdomain(): boolean {
  return getStoreSlugFromSubdomain() !== null;
}
```

### Routing Mode

```typescript
// In StorefrontProvider
const subdomainSlug = getStoreSlugFromSubdomain();
const isSubdomainMode = subdomainSlug !== null;
const storeSlug = storeSlugOverride || subdomainSlug || params.storeSlug;
```

### Link Generation

```typescript
// src/hooks/useStoreLinks.ts

export function useStoreLinks() {
  const { isSubdomainMode, storeSlug } = useStorefront();
  
  const getStoreLink = (path: string) => {
    if (isSubdomainMode) {
      return path.startsWith('/') ? path : `/${path}`;
    }
    return `/store/${storeSlug}${path.startsWith('/') ? path : `/${path}`}`;
  };
  
  return {
    getStoreLink,
    getPageLink: (slug: string) => getStoreLink(`/page/${slug}`),
    getProductLink: (slug: string) => getStoreLink(`/product/${slug}`),
    getCategoryLink: (slug: string) => getStoreLink(`/category/${slug}`),
    cartLink: getStoreLink('/cart'),
    checkoutLink: getStoreLink('/checkout'),
    accountLink: getStoreLink('/account'),
  };
}
```

---

## SEO & Performance

### Meta Tags

```typescript
// Set per-page meta tags
function StorePage() {
  const { page, store } = useData();
  
  useEffect(() => {
    document.title = page.seo_title || `${page.title} | ${store.name}`;
    
    // Update meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', page.seo_description || '');
    }
    
    // Update OG tags
    updateOgTags({
      title: page.seo_title,
      description: page.seo_description,
      image: page.og_image_url,
    });
  }, [page]);
}
```

### Image Optimization

```typescript
// Lazy load images
<img
  src={product.images[0]}
  alt={product.name}
  loading="lazy"
  className="w-full h-64 object-cover"
/>

// Use appropriate sizes
<picture>
  <source media="(min-width: 1024px)" srcset={largeImage} />
  <source media="(min-width: 768px)" srcset={mediumImage} />
  <img src={smallImage} alt={product.name} />
</picture>
```

### Code Splitting

```typescript
// Lazy load heavy components
const ProductDetail = lazy(() => import('./ProductDetail'));

// Use Suspense
<Suspense fallback={<ProductDetailSkeleton />}>
  <ProductDetail />
</Suspense>
```

---

## Styling & Theming

### Theme Application

Themes are applied as CSS custom properties:

```tsx
function StorefrontLayout() {
  const { theme } = useStorefront();
  
  const themeStyle = theme ? {
    '--primary': theme.colors.primary,
    '--secondary': theme.colors.secondary,
    '--background': theme.colors.background,
    '--foreground': theme.colors.foreground,
    '--font-heading': theme.typography.headingFont,
    '--font-body': theme.typography.bodyFont,
  } : {};
  
  return (
    <div style={themeStyle} className="min-h-screen">
      {/* content */}
    </div>
  );
}
```

### Responsive Design

```css
/* Mobile-first approach */
.product-grid {
  @apply grid grid-cols-1 gap-4;
  @apply sm:grid-cols-2;
  @apply lg:grid-cols-3;
  @apply xl:grid-cols-4;
}
```

### Component Styling

```tsx
// Use semantic color tokens
<button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Add to Cart
</button>

// Theme-aware styling
<div className="bg-background text-foreground border-border">
  {/* content */}
</div>
```

---

*This documentation is maintained with the codebase. Last update: 2026-01-15*
