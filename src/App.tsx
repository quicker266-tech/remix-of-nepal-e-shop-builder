/**
 * ============================================================================
 * MAIN APPLICATION ROUTER
 * ============================================================================
 * 
 * Supports two routing modes:
 * 1. SUBDOMAIN MODE: bombay.extendbee.com/* → Store-specific routes
 * 2. PATH MODE: extendbee.com/store/bombay/* → Legacy path-based routes
 * 
 * Subdomain detection happens at app initialization.
 * Platform routes (dashboard, admin) are always on the main domain.
 * 
 * ============================================================================
 */

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import { CartProvider } from "@/contexts/CartContext";
import { StorefrontProvider } from "@/contexts/StorefrontContext";
import { getStoreSlugFromSubdomain, isStorefrontSubdomain } from "@/lib/subdomain";

import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import CreateStore from "./pages/dashboard/CreateStore";
import ProductsList from "./pages/dashboard/products/ProductsList";
import ProductForm from "./pages/dashboard/products/ProductForm";
import OrdersList from "./pages/dashboard/orders/OrdersList";
import OrderDetails from "./pages/dashboard/orders/OrderDetails";
import CustomersList from "./pages/dashboard/customers/CustomersList";
import DiscountsList from "./pages/dashboard/discounts/DiscountsList";
import StoreSettings from "./pages/dashboard/settings/StoreSettings";
import ShippingSettings from "./pages/dashboard/shipping/ShippingSettings";
import ExtensionsList from "./pages/dashboard/extensions/ExtensionsList";
import CategoriesList from "./pages/dashboard/categories/CategoriesList";
import ProfilePage from "./pages/dashboard/profile/ProfilePage";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import AdminStores from "./pages/admin/AdminStores";
import AdminUsers from "./pages/admin/AdminUsers";
import StoreBuilder from "./components/store-builder/StoreBuilder";
import CustomerDetail from './pages/dashboard/customers/CustomerDetail';
import NotFound from "./pages/NotFound";

// Storefront components (standalone pages)
import StorePage from "./pages/storefront/StorePage";
import ProductDetail from "./pages/storefront/ProductDetail";
import StoreCatalog from "./pages/storefront/StoreCatalog";
import Cart from "./pages/storefront/Cart";
import Checkout from "./pages/storefront/Checkout";

const queryClient = new QueryClient();

/**
 * Storefront routes for subdomain mode
 * All routes are relative to the store subdomain
 */
function SubdomainStorefrontRoutes() {
  return (
    <Routes>
      <Route path="/" element={<StorePage />} />
      <Route path="/page/:pageSlug" element={<StorePage />} />
      <Route path="/catalog" element={<StoreCatalog />} />
      <Route path="/categories" element={<StorePage />} />
      <Route path="/product/:productSlug" element={<ProductDetail />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

/**
 * Main App component with conditional routing
 */
const App = () => {
  // Check if we're on a store subdomain
  const subdomainSlug = getStoreSlugFromSubdomain();
  const isSubdomain = isStorefrontSubdomain();

  // SUBDOMAIN MODE: Render storefront routes only
  // Pass storeSlug to CartProvider for store-specific cart isolation
  if (isSubdomain && subdomainSlug) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <StorefrontProvider storeSlugOverride={subdomainSlug} forceSubdomainMode={true}>
              <CartProvider storeSlug={subdomainSlug}>
                <SubdomainStorefrontRoutes />
              </CartProvider>
            </StorefrontProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // MAIN DOMAIN / PATH MODE: Full platform with all routes
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <StoreProvider>
              <CartProvider>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/auth" element={<AuthPage />} />
                  
                  {/* Customer Storefront (path-based - legacy & fallback) */}
                  <Route path="/store/:storeSlug" element={<StorePage />} />
                  <Route path="/store/:storeSlug/page/:pageSlug" element={<StorePage />} />
                  <Route path="/store/:storeSlug/catalog" element={<StoreCatalog />} />
                  <Route path="/store/:storeSlug/categories" element={<StorePage />} />
                  <Route path="/store/:storeSlug/product/:productSlug" element={<ProductDetail />} />
                  <Route path="/store/:storeSlug/cart" element={<Cart />} />
                  <Route path="/store/:storeSlug/checkout" element={<Checkout />} />
                  
                  {/* Tenant Dashboard */}
                  <Route path="/dashboard" element={<DashboardLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="create-store" element={<CreateStore />} />
                    <Route path="categories" element={<CategoriesList />} />
                    <Route path="products" element={<ProductsList />} />
                    <Route path="products/new" element={<ProductForm />} />
                    <Route path="products/:id/edit" element={<ProductForm />} />
                    <Route path="orders" element={<OrdersList />} />
                    <Route path="orders/:id" element={<OrderDetails />} />
                    <Route path="customers" element={<CustomersList />} />
                    <Route path="discounts" element={<DiscountsList />} />
                    <Route path="shipping" element={<ShippingSettings />} />
                    <Route path="extensions" element={<ExtensionsList />} />
                    <Route path="settings" element={<StoreSettings />} />
                    <Route path="store-builder" element={<StoreBuilder />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="customers/:id" element={<CustomerDetail />} />
                  </Route>
                  
                  {/* Super Admin Dashboard */}
                  <Route path="/admin" element={<SuperAdminLayout />}>
                    <Route index element={<AdminOverview />} />
                    <Route path="stores" element={<AdminStores />} />
                    <Route path="users" element={<AdminUsers />} />
                  </Route>
                  
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </CartProvider>
            </StoreProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
