/**
 * ============================================================================
 * STOREFRONT ROUTES
 * ============================================================================
 * 
 * Route definitions for storefront pages.
 * Used in both subdomain mode and path-based mode.
 * 
 * SUBDOMAIN MODE: Routes are relative (e.g., /product/xyz)
 * PATH MODE: Routes are under /store/:storeSlug/
 * 
 * ============================================================================
 */

import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { BeeLoader } from '@/components/ui/bee-loader';

// Lazy load storefront pages for better performance
const StorePage = lazy(() => import('@/pages/storefront/StorePage'));
const ProductDetail = lazy(() => import('@/pages/storefront/ProductDetail'));
const Cart = lazy(() => import('@/pages/storefront/Cart'));
const Checkout = lazy(() => import('@/pages/storefront/Checkout'));
const StoreCatalog = lazy(() => import('@/pages/storefront/StoreCatalog'));
const NotFound = lazy(() => import('@/pages/NotFound'));

// Loading fallback with bee animation
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <BeeLoader size="lg" text="Loading store..." />
    </div>
  );
}

/**
 * Storefront route definitions
 * These routes work in both subdomain and path-based modes
 */
export function StorefrontRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Homepage */}
        <Route path="/" element={<StorePage />} />
        
        {/* Custom pages (about, contact, policy, etc.) */}
        <Route path="/page/:pageSlug" element={<StorePage />} />
        
        {/* Product catalog/listing */}
        <Route path="/catalog" element={<StoreCatalog />} />
        
        {/* Categories page */}
        <Route path="/categories" element={<StorePage />} />
        
        {/* Product detail */}
        <Route path="/product/:productSlug" element={<ProductDetail />} />
        
        {/* Shopping cart */}
        <Route path="/cart" element={<Cart />} />
        
        {/* Checkout */}
        <Route path="/checkout" element={<Checkout />} />
        
        {/* Catch-all for 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default StorefrontRoutes;
