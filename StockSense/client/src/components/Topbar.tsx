import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Bell, Search, User, Moon, Sun, ChevronDown, LogOut, Settings } from "lucide-react";

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  async function handleLogout() {
    setMenuOpen(false);
    await logout();
    navigate("/login");
  }

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 sticky top-0 z-10 flex-shrink-0">
      {/* Left: Search */}
      <div className="flex items-center gap-3">
        <div className="relative hidden md:flex items-center">
          <Search className="absolute left-3 h-3.5 w-3.5 text-navy-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="h-8 pl-9 pr-4 rounded-lg border border-border bg-surface text-sm text-navy placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary w-56 transition-all"
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="h-8 w-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-surface hover:text-navy transition-colors"
          title={dark ? "Light mode" : "Dark mode"}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button className="h-8 w-8 rounded-lg flex items-center justify-center text-navy-400 hover:bg-surface hover:text-navy transition-colors relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Profile dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 h-8 pl-2 pr-2.5 rounded-lg hover:bg-surface transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-navy leading-none">{user?.name}</p>
              <p className="text-[10px] text-navy-400 leading-none mt-0.5">
                {user?.role === "INVENTORY_MANAGER" ? "Manager" : "Staff"}
              </p>
            </div>
            <ChevronDown className="h-3 w-3 text-navy-400 hidden md:block" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl border border-border shadow-modal animate-in z-50">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-semibold text-navy">{user?.name}</p>
                <p className="text-[11px] text-navy-400 truncate">{user?.email}</p>
              </div>
              <div className="p-1">
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-navy-600 hover:bg-surface transition-colors"
                >
                  <User className="h-4 w-4" />
                  My Profile
                </Link>
                <button
                  onClick={toggleDark}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-navy-600 hover:bg-surface transition-colors"
                >
                  {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  {dark ? "Light Mode" : "Dark Mode"}
                </button>
                <div className="border-t border-border my-1" />
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
