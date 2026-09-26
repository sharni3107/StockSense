import { useAuth } from "../../hooks/useAuth";
import { ManagerDashboard } from "./ManagerDashboard";
import { WarehouseStaffDashboard } from "./WarehouseStaffDashboard";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "WAREHOUSE_STAFF") {
    return <WarehouseStaffDashboard />;
  }

  return <ManagerDashboard />;
}
