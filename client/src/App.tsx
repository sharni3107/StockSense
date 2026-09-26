import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedLayout } from "./components/ProtectedLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";
import CategoriesPage from "./pages/CategoriesPage";
import WarehousesPage from "./pages/WarehousesPage";
import LocationsPage from "./pages/LocationsPage";
import ProductsPage from "./pages/products/ProductsPage";
import ProductNewPage from "./pages/products/ProductNewPage";
import ProductDetailPage from "./pages/products/ProductDetailPage";
import ProductEditPage from "./pages/products/ProductEditPage";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/new" element={<ProductNewPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products/:id/edit" element={<ProductEditPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/receipts" element={<ComingSoonPage title="Receipts" />} />
              <Route path="/deliveries" element={<ComingSoonPage title="Delivery Orders" />} />
              <Route path="/transfers" element={<ComingSoonPage title="Internal Transfers" />} />
              <Route path="/adjustments" element={<ComingSoonPage title="Inventory Adjustments" />} />
              <Route path="/ledger" element={<ComingSoonPage title="Move History" />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/reordering-rules" element={<ComingSoonPage title="Reordering Rules" />} />
              <Route path="/profile" element={<ComingSoonPage title="My Profile" />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
