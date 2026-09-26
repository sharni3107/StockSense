import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register(name, email, password);
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
          <h1 className="text-xl font-bold text-slate-900">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Start managing your inventory in minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-border rounded-lg p-6 space-y-4">
          {error && (
            <div className="rounded border border-status-out-border bg-status-out-bg px-3 py-2 text-sm text-status-out-text">
              {error}
            </div>
          )}
          <FieldWrapper label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} />
          </FieldWrapper>
          <FieldWrapper label="Email">
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </FieldWrapper>
          <FieldWrapper label="Password">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </FieldWrapper>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
