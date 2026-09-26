import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./hooks/useAuth";
import { ProtectedLayout } from "./components/ProtectedLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ComingSoonPage from "./pages/ComingSoonPage";

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
              <Route path="/products" element={<ComingSoonPage title="Products" />} />
              <Route path="/categories" element={<ComingSoonPage title="Categories" />} />
              <Route path="/receipts" element={<ComingSoonPage title="Receipts" />} />
              <Route path="/deliveries" element={<ComingSoonPage title="Delivery Orders" />} />
              <Route path="/transfers" element={<ComingSoonPage title="Internal Transfers" />} />
              <Route path="/adjustments" element={<ComingSoonPage title="Inventory Adjustments" />} />
              <Route path="/ledger" element={<ComingSoonPage title="Move History" />} />
              <Route path="/warehouses" element={<ComingSoonPage title="Warehouses" />} />
              <Route path="/locations" element={<ComingSoonPage title="Locations" />} />
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
