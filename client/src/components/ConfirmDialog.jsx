import { useEffect, useRef } from "react";

export default function ConfirmDialog({ open, title, children, confirmLabel, cancelLabel = "Keep investigating", busy, danger, onConfirm, onCancel }) {
  const cancelRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink-950/80 p-4" onMouseDown={(e) => e.target === e.currentTarget && !busy && onCancel()}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="dlg-title" className="panel w-full max-w-md p-6 shadow-2xl">
        <h2 id="dlg-title" className="text-xl font-bold">{title}</h2>
        <div className="mt-3 text-sm text-mute">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button ref={cancelRef} className="btn btn-ghost" onClick={onCancel} disabled={busy}>{cancelLabel}</button>
          <button className={"btn " + (danger ? "btn-danger" : "btn-gold")} onClick={onConfirm} disabled={busy}>{busy ? "Working…" : confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
