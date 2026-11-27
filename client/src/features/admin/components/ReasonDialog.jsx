import { useState } from "react";
import { ConfirmDialog } from "@/features/dashboard/components/ConfirmDialog";

export function ReasonDialog({ open, title, description, confirmLabel, loading, requireReason = false, onConfirm, onCancel }) {
  const [reason, setReason] = useState("");

  return (
    <ConfirmDialog
      open={open}
      title={title}
      description={description}
      confirmLabel={confirmLabel}
      loading={loading}
      confirmDisabled={requireReason && !reason.trim()}
      onCancel={() => {
        setReason("");
        onCancel();
      }}
      onConfirm={() => {
        onConfirm(reason);
        setReason("");
      }}
    >
      <label className="mt-4 block text-sm">
        <span className="mb-1.5 block font-medium">
          {requireReason ? "Reason (required)" : "Reason (optional)"}
        </span>
        <textarea
          rows={3}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className="w-full rounded-control border border-line bg-background px-3 py-2 text-sm"
          placeholder="Explain this decision…"
        />
      </label>
    </ConfirmDialog>
  );
}
