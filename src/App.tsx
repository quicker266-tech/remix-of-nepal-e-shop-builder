import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";

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
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import AdminOverview from "./pages/admin/AdminOverview";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <StoreProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Tenant Dashboard */}
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardHome />} />
                <Route path="create-store" element={<CreateStore />} />
                <Route path="products" element={<ProductsList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="orders" element={<OrdersList />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                <Route path="customers" element={<CustomersList />} />
                <Route path="discounts" element={<DiscountsList />} />
                <Route path="settings" element={<StoreSettings />} />
              </Route>
              
              {/* Super Admin Dashboard */}
              <Route path="/admin" element={<SuperAdminLayout />}>
                <Route index element={<AdminOverview />} />
              </Route>
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </StoreProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
