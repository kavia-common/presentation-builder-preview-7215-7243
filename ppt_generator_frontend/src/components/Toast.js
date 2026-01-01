import React, { useEffect } from "react";

/**
 * Simple, dependency-free toast component.
 * - Non-blocking status updates during PPT generation
 * - Error messages on failures
 */

// PUBLIC_INTERFACE
export default function Toast({ toast, onClose }) {
  /** Renders a toast notification (status or error) and optionally auto-hides it. */
  useEffect(() => {
    if (!toast?.open) return;
    if (!toast.autoHideMs) return;

    const t = window.setTimeout(() => onClose?.(), toast.autoHideMs);
    return () => window.clearTimeout(t);
  }, [toast?.open, toast?.autoHideMs, onClose]);

  if (!toast?.open) return null;

  const variant = toast.variant || "info";
  const isError = variant === "error";

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 1000,
        maxWidth: 420,
        width: "calc(100% - 36px)"
      }}
    >
      <div
        role={isError ? "alert" : "status"}
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: 12,
          alignItems: "start",
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${isError ? "rgba(239,68,68,0.35)" : "rgba(37,99,235,0.25)"}`,
          background: isError ? "rgba(239,68,68,0.10)" : "rgba(37,99,235,0.08)",
          boxShadow: "0 18px 45px rgba(17,24,39,0.18)",
          backdropFilter: "blur(8px)"
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.02em", color: isError ? "#991b1b" : "#1d4ed8" }}>
            {toast.title || (isError ? "Export failed" : "Working")}
          </div>
          {toast.message ? (
            <div style={{ marginTop: 6, fontSize: 13, color: "#111827", lineHeight: 1.35, wordBreak: "break-word" }}>
              {toast.message}
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="btn btnSmall btnGhost"
          onClick={() => onClose?.()}
          aria-label="Dismiss notification"
          title="Dismiss"
          style={{ alignSelf: "start" }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
