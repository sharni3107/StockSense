import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, Tags, RefreshCcw, ArrowDownCircle,
  Truck, ArrowLeftRight, ClipboardList, History, Warehouse,
  MapPin, User, CheckSquare, RotateCcw, ClipboardCheck,
  LogOut, BarChart2, ChevronRight
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const managerNav: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { to: "/categories", label: "Categories", icon: <Tags className="h-4 w-4" /> },
      { to: "/reordering-rules", label: "Reordering Rules", icon: <RefreshCcw className="h-4 w-4" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/receipts", label: "Receipts", icon: <ArrowDownCircle className="h-4 w-4" /> },
      { to: "/deliveries", label: "Delivery Orders", icon: <Truck className="h-4 w-4" /> },
      { to: "/transfers", label: "Internal Transfers", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { to: "/adjustments", label: "Inventory Adjustments", icon: <ClipboardList className="h-4 w-4" /> },
      { to: "/ledger", label: "Move History", icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    label: "Warehouse",
    items: [
      { to: "/warehouses", label: "Warehouses", icon: <Warehouse className="h-4 w-4" /> },
      { to: "/locations", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    label: "Profile",
    items: [
      { to: "/profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
    ],
  },
];

const staffNav: NavGroup[] = [
  {
    label: "My Work",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
      { to: "/tasks", label: "My Tasks", icon: <CheckSquare className="h-4 w-4" /> },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/receive", label: "Receive", icon: <ArrowDownCircle className="h-4 w-4" /> },
      { to: "/transfers", label: "Transfer", icon: <ArrowLeftRight className="h-4 w-4" /> },
      { to: "/adjustments", label: "Stock Count", icon: <ClipboardCheck className="h-4 w-4" /> },
    ],
  },
  {
    label: "Inventory",
    items: [
      { to: "/products", label: "Products", icon: <Package className="h-4 w-4" /> },
      { to: "/locations", label: "Locations", icon: <MapPin className="h-4 w-4" /> },
    ],
  },
  {
    label: "Profile",
    items: [
      { to: "/profile", label: "My Profile", icon: <User className="h-4 w-4" /> },
    ],
  },
];

interface SidebarProps {
  collapsed?: boolean;
  onCollapse?: () => void;
}

export function Sidebar({ collapsed = false, onCollapse }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const groups = user?.role === "INVENTORY_MANAGER" ? managerNav : staffNav;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <aside
      className={[
        "flex flex-col h-screen sticky top-0 overflow-y-auto shrink-0 z-20",
        "bg-white border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Logo */}
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border flex-shrink-0">
        <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <BarChart2 className="h-4 w-4 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-bold text-navy text-sm tracking-tight">StockSense</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-3 mb-1 text-[10px] font-bold uppercase tracking-widest text-navy-300">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    [
                      "sidebar-link",
                      isActive ? "active" : "",
                      collapsed ? "justify-center px-2" : "",
                    ].join(" ")
                  }
                >
                  {item.icon}
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-border p-2 flex-shrink-0">
        {!collapsed && user && (
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-semibold text-navy truncate">{user.name}</p>
            <p className="text-[11px] text-navy-400 truncate">
              {user.role === "INVENTORY_MANAGER" ? "Inventory Manager" : "Warehouse Staff"}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          title="Sign out"
          className="sidebar-link w-full text-red-500 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
