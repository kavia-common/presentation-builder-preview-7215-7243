import React, { useEffect, useMemo, useRef } from "react";

/**
 * Accessible, focus-trapped confirmation dialog.
 * - Uses role="dialog" + aria-modal="true"
 * - Traps focus within the dialog
 * - Closes on Escape
 * - Click outside can optionally close (default: true)
 */

// PUBLIC_INTERFACE
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger", // "danger" | "default"
  onConfirm,
  onCancel,
  closeOnBackdrop = true
}) {
  /** In-app confirmation modal used for destructive actions (e.g., delete slide). */

  const dialogRef = useRef(null);
  const confirmBtnRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  const titleId = useMemo(() => `cd_title_${Math.random().toString(16).slice(2)}`, []);
  const descId = useMemo(() => `cd_desc_${Math.random().toString(16).slice(2)}`, []);

  useEffect(() => {
    if (!open) return;

    // Save focus and then focus the confirm button for fast keyboard confirmation.
    lastActiveElementRef.current = document.activeElement;
    window.requestAnimationFrame(() => {
      confirmBtnRef.current?.focus?.();
    });

    // Prevent background scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
      const el = lastActiveElementRef.current;
      window.requestAnimationFrame(() => el?.focus?.());
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel?.();
        return;
      }

      if (e.key !== "Tab") return;

      // Focus trap
      const root = dialogRef.current;
      if (!root) return;

      const focusables = Array.from(
        root.querySelectorAll(
          'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((n) => !n.hasAttribute("disabled") && !n.getAttribute("aria-disabled"));

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (e.shiftKey) {
        if (active === first || !root.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="cdBackdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (!closeOnBackdrop) return;
        if (e.target === e.currentTarget) onCancel?.();
      }}
    >
      <div
        className="cdModal"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
      >
        <div className="cdHeader">
          <h2 className="cdTitle" id={titleId}>
            {title || "Confirm"}
          </h2>
        </div>

        <div className="cdBody" id={descId}>
          {typeof message === "string" ? <p className="cdMessage">{message}</p> : message}
        </div>

        <div className="cdActions">
          <button type="button" className="btn btnGhost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            ref={confirmBtnRef}
            className={`btn ${variant === "danger" ? "btnDanger" : ""}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
