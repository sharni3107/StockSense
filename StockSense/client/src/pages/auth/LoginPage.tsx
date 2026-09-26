import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";
import { Alert } from "../../components/ui";
import { BarChart2, Package, TrendingUp, Warehouse, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel (Brand) ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] bg-navy flex-col justify-between p-12 relative overflow-hidden">
        {/* Background shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-10 -left-20 h-64 w-64 rounded-full bg-cyan/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-purple/10 blur-3xl" />
        </div>

        <div className="relative z-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg tracking-tight">StockSense</span>
          </div>

          {/* Headline */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white leading-tight mb-3">
              One stock.
              <br />
              <span className="font-display text-5xl text-cyan-300"
                style={{ textDecoration: "underline", textDecorationStyle: "wavy", textDecorationColor: "#22d3ee60" }}>
                One source
              </span>
              <br />
              of truth.
            </h1>
            <p className="text-slate-400 text-base leading-relaxed max-w-xs">
              One centralized workspace for every inventory operation — receipts, transfers, deliveries, and more.
            </p>
          </div>

          {/* Mini feature cards */}
          <div className="space-y-3">
            {[
              { icon: <Package className="h-4 w-4" />, label: "Real-time stock tracking across all locations" },
              { icon: <TrendingUp className="h-4 w-4" />, label: "Automated low-stock alerts and reorder rules" },
              { icon: <Warehouse className="h-4 w-4" />, label: "Full warehouse and location management" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 text-slate-300">
                <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  {f.icon}
                </div>
                <span className="text-sm">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer quote */}
        <div className="relative z-10 border-t border-white/10 pt-6">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} StockSense · Built for modern warehouse teams
          </p>
        </div>
      </div>

      {/* ── Right Panel (Form) ─────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-navy">StockSense</span>
          </div>

          <div className="mb-8">
            <h2 className="text-heading-md font-bold text-navy">Welcome back</h2>
            <p className="text-sm text-navy-400 mt-1">Sign in to continue to StockSense.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}

            <FieldWrapper label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                autoComplete="email"
                autoFocus
              />
            </FieldWrapper>

            <FieldWrapper label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-500"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </FieldWrapper>

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-xs text-primary hover:underline font-medium">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary font-semibold hover:underline">
              Create account
            </Link>
          </p>

          {/* Demo credentials hint */}
          <div className="mt-8 rounded-xl bg-blue-50 border border-blue-100 p-4">
            <p className="text-xs font-semibold text-blue-700 mb-2">Demo accounts</p>
            <div className="space-y-1 text-xs text-blue-600">
              <p><span className="font-medium">Manager:</span> manager@stocksense.demo</p>
              <p><span className="font-medium">Staff:</span> staff@stocksense.demo</p>
              <p className="text-blue-500 mt-1">Password: StockSense123!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
