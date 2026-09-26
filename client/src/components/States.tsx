export function LoadingState({ label = "Loading..." }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-slate-400">{label}</div>;
}

export function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="rounded border border-status-out-border bg-status-out-bg px-4 py-3 text-sm text-status-out-text">
      {message}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-white py-14 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
    </div>
  );
}
