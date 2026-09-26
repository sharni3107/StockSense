import { ReactNode } from "react";

// ─── Badge (status) ───────────────────────────────────────────────────────────
interface BadgeProps {
  status: string;
  label?: string;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  WAITING: "Waiting",
  READY: "Ready",
  DONE: "Done",
  CANCELED: "Canceled",
  healthy: "Healthy",
  low: "Low Stock",
  out: "Out of Stock",
  needs_reorder: "Needs Reorder",
  critical: "Critical",
  RECEIPT: "Receipt",
  DELIVERY: "Delivery",
  TRANSFER: "Transfer",
  ADJUSTMENT: "Adjustment",
};

export function StatusBadge({ status, label, className = "" }: BadgeProps) {
  const key = status.toLowerCase().replace("-", "_");
  return (
    <span className={`badge badge-${key} ${className}`}>
      {label ?? STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────────
interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div className={`card ${padding ? "p-5" : ""} ${className}`}>
      {children}
    </div>
  );
}

// ─── KPI Card ──────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  iconBg?: string;
  trend?: { value: number; label: string };
  link?: { label: string; onClick: () => void };
}

export function KPICard({ title, value, icon, iconBg = "bg-primary-50 text-primary", trend, link }: KPICardProps) {
  return (
    <div className="kpi-card">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-navy-400">{title}</p>
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      <div>
        <p className="text-2xl font-bold text-navy tabular-nums">{value}</p>
        {trend && (
          <p className={`text-xs mt-0.5 ${trend.value >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      {link && (
        <button
          onClick={link.onClick}
          className="text-xs text-primary hover:underline font-medium mt-auto self-start"
        >
          {link.label} →
        </button>
      )}
    </div>
  );
}

// ─── Empty State ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-in">
      {icon && (
        <div className="mb-4 h-16 w-16 rounded-2xl bg-surface flex items-center justify-center text-navy-300">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-navy-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-navy-400 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────
export function LoadingState({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-surface rounded-lg" />
      ))}
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────
interface SectionHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function SectionHeader({ title, description, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h2 className="text-heading-sm font-semibold text-navy">{title}</h2>
        {description && <p className="text-xs text-navy-400 mt-0.5">{description}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ─── Alert ────────────────────────────────────────────────────────────────────
interface AlertProps {
  type?: "error" | "warning" | "info" | "success";
  children: ReactNode;
  className?: string;
}

const alertStyles = {
  error: "bg-red-50 border-red-200 text-red-700",
  warning: "bg-amber-50 border-amber-200 text-amber-700",
  info: "bg-blue-50 border-blue-200 text-blue-700",
  success: "bg-emerald-50 border-emerald-200 text-emerald-700",
};

export function Alert({ type = "error", children, className = "" }: AlertProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${alertStyles[type]} ${className}`}>
      {children}
    </div>
  );
}
