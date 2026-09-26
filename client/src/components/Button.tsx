import { ButtonHTMLAttributes } from "react";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

const base = "h-9 px-4 rounded text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed";
const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-active",
  secondary: "bg-white text-slate-700 border border-border hover:bg-slate-50",
  ghost: "bg-transparent text-slate-500 hover:bg-primary/5 hover:text-primary",
};

export function Button({ variant = "primary", className = "", ...props }: Props) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
