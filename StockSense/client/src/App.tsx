import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedLayout } from "./components/ProtectedLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage";

// Main pages
import DashboardPage from "./pages/dashboard/DashboardPage";
import ProductsPage from "./pages/products/ProductsPage";
import CategoriesPage from "./pages/categories/CategoriesPage";
import WarehousesPage from "./pages/warehouses/WarehousesPage";
import LocationsPage from "./pages/locations/LocationsPage";
import ReceiptsPage from "./pages/receipts/ReceiptsPage";
import DeliveriesPage from "./pages/deliveries/DeliveriesPage";
import TransfersPage from "./pages/transfers/TransfersPage";
import AdjustmentsPage from "./pages/adjustments/AdjustmentsPage";
import LedgerPage from "./pages/ledger/LedgerPage";
import ReorderRulesPage from "./pages/reorder-rules/ReorderRulesPage";
import TasksPage from "./pages/tasks/TasksPage";
import ProfilePage from "./pages/profile/ProfilePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "#0f172a",
                color: "#f8fafc",
                fontSize: "13px",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.2)",
              },
            }}
          />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            {/* Protected App Routes */}
            <Route element={<ProtectedLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/warehouses" element={<WarehousesPage />} />
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/receipts" element={<ReceiptsPage />} />
              <Route path="/receive" element={<ReceiptsPage />} />
              <Route path="/deliveries" element={<DeliveriesPage />} />
              <Route path="/transfers" element={<TransfersPage />} />
              <Route path="/adjustments" element={<AdjustmentsPage />} />
              <Route path="/ledger" element={<LedgerPage />} />
              <Route path="/reordering-rules" element={<ReorderRulesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* Catch-all */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
