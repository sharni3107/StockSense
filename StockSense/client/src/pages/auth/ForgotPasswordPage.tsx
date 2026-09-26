import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";
import { Button } from "../../components/Button";
import { FieldWrapper, Input } from "../../components/FormField";
import { Alert } from "../../components/ui";
import { BarChart2, Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.reset_token) {
        // Local/hackathon fallback when SMTP is not configured.
        navigate(`/reset-password?token=${encodeURIComponent(result.reset_token)}`);
        return;
      }
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send recovery email.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <div className="w-full max-w-sm text-center">
          <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-heading-md font-bold text-navy mb-2">Check your inbox</h2>
          <p className="text-sm text-navy-400 mb-2">
            We've generated a password reset link for <strong className="text-navy">{email}</strong>.
          </p>
          <p className="text-xs text-navy-300 mb-8">
            The reset link expires shortly. If email delivery is configured, check your inbox or spam folder.
          </p>
          <Link to="/login">
            <Button variant="secondary" className="w-full" icon={<ArrowLeft className="h-4 w-4" />}>
              Back to Sign In
            </Button>
          </Link>
          <button
            onClick={() => setSent(false)}
            className="mt-4 text-sm text-primary hover:underline"
          >
            Try a different email
          </button>
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

        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>

        <div className="mb-8">
          <h2 className="text-heading-md font-bold text-navy">Reset your password</h2>
          <p className="text-sm text-navy-400 mt-1">
            Enter your email and we'll send a recovery link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <Alert type="error">{error}</Alert>}

          <FieldWrapper label="Email address" required>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              autoFocus
            />
          </FieldWrapper>

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}
