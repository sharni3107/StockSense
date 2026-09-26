import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Button } from "./Button";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-end gap-4 px-6 sticky top-0 z-10">
      <div className="text-right leading-tight">
        <div className="text-sm font-medium text-slate-800">{user?.name}</div>
        <div className="text-xs text-slate-400">{user?.role === "INVENTORY_MANAGER" ? "Inventory Manager" : "Warehouse Staff"}</div>
      </div>
      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
        {user?.name?.[0] ?? "?"}
      </div>
      <Button variant="secondary" onClick={handleLogout}>
        Logout
      </Button>
    </header>
  );
}
