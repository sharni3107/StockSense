import { ButtonHTMLAttributes, forwardRef } from "react";
import { Loader2 } from "lucide-react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active shadow-sm",
  secondary: "bg-white text-navy-600 border border-border hover:bg-surface active:bg-slate-100 shadow-sm",
  ghost: "bg-transparent text-navy-500 hover:bg-primary-50 hover:text-primary",
  danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm",
};

const sizes = {
  sm: "h-7 px-3 text-xs gap-1.5",
  md: "h-9 px-4 text-sm gap-2",
  lg: "h-10 px-5 text-sm gap-2",
};

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", size = "md", loading, icon, children, className = "", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={[
          "inline-flex items-center justify-center rounded-lg font-medium",
          "transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300",
          variants[variant],
          sizes[size],
          className,
        ].join(" ")}
        {...props}
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : icon}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
