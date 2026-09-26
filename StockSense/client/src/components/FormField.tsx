import { ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

// ─── FieldWrapper ─────────────────────────────────────────────────────────────
interface FieldWrapperProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function FieldWrapper({ label, error, hint, required, children }: FieldWrapperProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-navy-700">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export const FormField = FieldWrapper;

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function Input({ error, className = "", ...props }: InputProps) {
  return (
    <input
      className={[
        "input-base",
        error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  placeholder?: string;
  options: { value: string; label: string }[];
}

export function Select({ error, placeholder, options, className = "", ...props }: SelectProps) {
  return (
    <select
      className={[
        "input-base",
        error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "",
        className,
      ].join(" ")}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function Textarea({ error, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      rows={3}
      className={[
        "input-base resize-none",
        error ? "border-red-400 focus:ring-red-200 focus:border-red-400" : "",
        className,
      ].join(" ")}
      {...props}
    />
  );
}
