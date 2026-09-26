import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { BarChart2, Loader2 } from "lucide-react";

export function ProtectedLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-surface gap-4">
        <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <BarChart2 className="h-6 w-6 text-white" />
        </div>
        <div className="flex items-center gap-2 text-sm text-navy-400">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading StockSense...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
