import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";
import { Alert } from "../../components/ui";
import { BarChart2, Eye, EyeOff, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.message as string;
      if (msg.includes("email to confirm")) {
        setInfo(msg);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (info) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-heading-md font-bold text-navy mb-2">Check your email</h2>
          <p className="text-sm text-navy-400 mb-6">{info}</p>
          <Link to="/login">
            <Button className="w-full">Back to Sign In</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-[52%] bg-navy flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute bottom-10 -left-20 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">StockSense</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">
            Start managing<br />
            <span className="font-display text-5xl text-teal-300">smarter.</span>
          </h1>
          <p className="text-slate-400 text-base max-w-xs leading-relaxed">
            Join StockSense and replace spreadsheets with a real inventory management system.
          </p>
          <div className="mt-8 space-y-2 text-sm text-slate-400">
            {["No credit card required", "Works for any warehouse size", "Real-time stock tracking"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-teal-400 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center bg-surface px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <BarChart2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-navy">StockSense</span>
          </div>

          <div className="mb-8">
            <h2 className="text-heading-md font-bold text-navy">Create your account</h2>
            <p className="text-sm text-navy-400 mt-1">Start managing your inventory in minutes.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <Alert type="error">{error}</Alert>}

            <FieldWrapper label="Full name" required>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Smith"
                required
                minLength={2}
                autoFocus
              />
            </FieldWrapper>

            <FieldWrapper label="Email" required>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </FieldWrapper>

            <FieldWrapper label="Password" required>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
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

            <FieldWrapper label="Confirm password" required>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
                error={!!(confirmPassword && confirmPassword !== password)}
              />
              {confirmPassword && confirmPassword !== password && (
                <p className="text-xs text-red-600 mt-1">Passwords don't match</p>
              )}
            </FieldWrapper>

            <Button type="submit" className="w-full" size="lg" loading={loading}>
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-navy-400">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>

          <p className="mt-4 text-center text-xs text-navy-300">
            New accounts are created with <strong>Warehouse Staff</strong> role by default.
          </p>
        </div>
      </div>
    </div>
  );
}
