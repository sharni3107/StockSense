type Tone = "draft" | "waiting" | "ready" | "done" | "canceled" | "low" | "out" | "in" | "neutral";

const toneClasses: Record<Tone, string> = {
  draft: "bg-status-draft-bg text-status-draft-text border-status-draft-border",
  waiting: "bg-status-waiting-bg text-status-waiting-text border-status-waiting-border",
  ready: "bg-status-ready-bg text-status-ready-text border-status-ready-border",
  done: "bg-status-done-bg text-status-done-text border-status-done-border",
  canceled: "bg-status-canceled-bg text-status-canceled-text border-status-canceled-border",
  low: "bg-status-low-bg text-status-low-text border-status-low-border",
  out: "bg-status-out-bg text-status-out-text border-status-out-border",
  in: "bg-status-in-bg text-status-in-text border-status-in-border",
  neutral: "bg-slate-100 text-slate-600 border-slate-200",
};

const statusToTone: Record<string, Tone> = {
  IN_STOCK: "in",
  LOW_STOCK: "low",
  OUT_OF_STOCK: "out",
  DRAFT: "draft",
  WAITING: "waiting",
  READY: "ready",
  DONE: "done",
  CANCELED: "canceled",
};

const statusLabels: Record<string, string> = {
  IN_STOCK: "In Stock",
  LOW_STOCK: "Low Stock",
  OUT_OF_STOCK: "Out of Stock",
};

export function Badge({ status }: { status: string }) {
  const tone = statusToTone[status] || "neutral";
  const label = statusLabels[status] || status.replace(/_/g, " ");
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-xs font-semibold uppercase tracking-wide ${toneClasses[tone]}`}
    >
      {label}
    </span>
  );
}
