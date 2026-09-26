import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("manager@stocksense.demo");
  const [password, setPassword] = useState("password123");
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
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-white font-bold mb-3">
            S
          </div>
          <h1 className="text-xl font-bold text-slate-900">Sign in to StockSense</h1>
          <p className="mt-1 text-sm text-slate-500">Manage stock, warehouses, and operations.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 space-y-4">
          {error && (
            <div className="rounded border border-status-out-border bg-status-out-bg px-3 py-2 text-sm text-status-out-text">
              {error}
            </div>
          )}
          <FieldWrapper label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FieldWrapper>
          <FieldWrapper label="Password">
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </FieldWrapper>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="text-primary font-medium hover:underline">
            Register
          </Link>
        </p>
        <p className="mt-2 text-center text-xs text-slate-400">
          Demo login is pre-filled — just click Sign in.
        </p>
      </div>
    </div>
  );
}
