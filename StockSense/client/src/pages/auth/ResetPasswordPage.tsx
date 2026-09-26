import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../api/auth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";
import { Alert } from "../../components/ui";
import { BarChart2, Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import toast from "react-hot-toast";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [sessionReady] = useState(Boolean(token));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

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
      if (!token) throw new Error("This reset link is missing or invalid.");
      await resetPassword(token, password);
      setDone(true);
      toast.success("Password updated successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm text-center">
          <div className="h-16 w-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-heading-md font-bold text-navy mb-2">Password updated!</h2>
          <p className="text-sm text-navy-400">Redirecting you to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart2 className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-navy">StockSense</span>
        </div>

        <div className="h-14 w-14 rounded-2xl bg-primary-50 flex items-center justify-center mb-6">
          <Lock className="h-7 w-7 text-primary" />
        </div>

        <div className="mb-8">
          <h2 className="text-heading-md font-bold text-navy">Set new password</h2>
          <p className="text-sm text-navy-400 mt-1">
            Choose a strong password for your account.
          </p>
        </div>

        {!sessionReady && (
          <Alert type="warning" className="mb-4">
            Waiting for authentication… If this persists, request a new reset link.
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <FieldWrapper label="New password" required>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                minLength={6}
                className="pr-10"
                autoFocus
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

          <FieldWrapper label="Confirm new password" required>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              required
              error={!!(confirmPassword && confirmPassword !== password)}
            />
          </FieldWrapper>

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={loading}
            disabled={!sessionReady}
          >
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
