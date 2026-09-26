import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { PageHeader } from "../../components/PageHeader";
import { Button } from "../../components/Button";
import { FormField } from "../../components/FormField";
import { StatusBadge, Card } from "../../components/ui";
import { toast } from "react-hot-toast";
import { User, Mail, Shield, Calendar, KeyRound, Check } from "lucide-react";
import { updateProfile, requestPasswordReset } from "../../api/auth";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || "");
  const [loading, setLoading] = useState(false);
  const [passwordEmailSent, setPasswordEmailSent] = useState(false);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await updateProfile({ name: name.trim() });
      await refreshUser();
      toast.success("Profile updated successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    try {
      const result = await requestPasswordReset(user.email);
      setPasswordEmailSent(true);
      if (result.reset_token) {
        toast.success("Reset link generated. Open the reset link from the Forgot Password page.");
      } else {
        toast.success("Password reset instructions sent to your email!");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reset link");
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-in">
      <PageHeader
        title="Account Profile & Settings"
        description="Manage your user identity and security preferences."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <div className="card p-6 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-2xl bg-primary text-white font-bold text-2xl flex items-center justify-center shadow-md mb-4">
            {user?.name?.charAt(0).toUpperCase() || "U"}
          </div>

          <h3 className="font-bold text-navy text-lg">{user?.name}</h3>
          <p className="text-xs text-navy-400 mt-0.5">{user?.email}</p>

          <div className="mt-3">
            <StatusBadge
              status={user?.role || "WAREHOUSE_STAFF"}
              label={
                user?.role === "INVENTORY_MANAGER"
                  ? "Inventory Manager"
                  : "Warehouse Staff"
              }
            />
          </div>

          <div className="w-full mt-6 pt-6 border-t border-border space-y-3 text-left text-xs">
            <div className="flex items-center gap-2 text-navy-600">
              <Mail className="h-4 w-4 text-navy-400" />
              <span className="truncate">{user?.email}</span>
            </div>
            <div className="flex items-center gap-2 text-navy-600">
              <Shield className="h-4 w-4 text-navy-400" />
              <span>Role: {user?.role || "Staff"}</span>
            </div>
            <div className="flex items-center gap-2 text-navy-600">
              <Calendar className="h-4 w-4 text-navy-400" />
              <span>Active User</span>
            </div>
          </div>
        </div>

        {/* Update Profile Form */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6">
            <h3 className="text-heading-sm font-semibold text-navy mb-4">
              Edit Personal Details
            </h3>

            <form onSubmit={handleUpdateName} className="space-y-4">
              <FormField label="Full Name" required>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FormField>

              <FormField label="Email Address" hint="Managed by StockSense">
                <input
                  type="email"
                  disabled
                  className="input-field bg-slate-50 opacity-80 cursor-not-allowed"
                  value={user?.email || ""}
                />
              </FormField>

              <div className="flex justify-end pt-2">
                <Button type="submit" loading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </div>

          {/* Security & Password */}
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-heading-sm font-semibold text-navy">
                  Password & Security
                </h3>
                <p className="text-xs text-navy-400 mt-1">
                  Request a secure password reset link sent directly to your registered email.
                </p>
              </div>

              <Button
                variant="secondary"
                onClick={handleSendResetPassword}
                icon={passwordEmailSent ? <Check className="h-4 w-4 text-emerald-600" /> : <KeyRound className="h-4 w-4" />}
              >
                {passwordEmailSent ? "Link Sent" : "Reset Password"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
