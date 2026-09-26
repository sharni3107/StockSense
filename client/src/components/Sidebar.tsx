import { NavLink } from "react-router-dom";

const groups = [
  {
    label: "Overview",
    links: [{ to: "/dashboard", label: "Dashboard" }],
  },
  {
    label: "Inventory",
    links: [
      { to: "/products", label: "Products" },
      { to: "/categories", label: "Categories" },
    ],
  },
  {
    label: "Operations",
    links: [
      { to: "/receipts", label: "Receipts" },
      { to: "/deliveries", label: "Delivery Orders" },
      { to: "/transfers", label: "Internal Transfers" },
      { to: "/adjustments", label: "Inventory Adjustments" },
      { to: "/ledger", label: "Move History" },
    ],
  },
  {
    label: "Warehouse",
    links: [
      { to: "/warehouses", label: "Warehouses" },
      { to: "/locations", label: "Locations" },
    ],
  },
  {
    label: "Settings",
    links: [{ to: "/reordering-rules", label: "Reordering Rules" }],
  },
];

const linkBase = "block rounded px-3 py-1.5 text-sm text-slate-600 hover:bg-primary/5 hover:text-primary";
const linkActive = "bg-primary/10 text-primary font-medium";

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-white h-screen sticky top-0 overflow-y-auto">
      <div className="h-14 flex items-center gap-2 px-4 border-b border-border">
        <div className="h-7 w-7 rounded bg-primary text-white text-sm font-bold flex items-center justify-center">
          S
        </div>
        <span className="font-semibold text-slate-900">StockSense</span>
      </div>

      <nav className="p-3 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {group.label}
            </div>
            <div className="space-y-0.5">
              {group.links.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => `${linkBase} ${isActive ? linkActive : ""}`}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
