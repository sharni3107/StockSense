import { Modal } from "./Modal";
import { Button } from "./Button";

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDialog({ title, message, confirmLabel = "Delete", onConfirm, onCancel, loading }: Props) {
  return (
    <Modal title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="bg-status-out-text hover:opacity-90"
          style={{ backgroundColor: "#BE123C" }}
        >
          {loading ? "Deleting..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
