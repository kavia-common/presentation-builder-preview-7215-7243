import React from "react";

/**
 * Minimal breadcrumb component.
 * - Accessible via nav/ol semantics
 * - Truncates long labels with title tooltips
 * - Purely presentational: does not change selection or keyboard behavior
 */

// PUBLIC_INTERFACE
export default function Breadcrumbs({ items, ariaLabel = "Breadcrumb" }) {
  /** Render a breadcrumb list with truncation and tooltip support. */
  const safeItems = Array.isArray(items) ? items.filter(Boolean) : [];

  return (
    <nav className="bcNav" aria-label={ariaLabel}>
      <ol className="bcList">
        {safeItems.map((it, idx) => {
          const isLast = idx === safeItems.length - 1;
          const label = (it?.label || "").trim() || "Untitled";
          const title = (it?.title || label || "").trim();

          return (
            <li key={`${idx}_${label}`} className="bcItem">
              <span
                className={`bcCrumb ${isLast ? "bcCrumbCurrent" : ""}`}
                title={title}
                aria-current={isLast ? "page" : undefined}
              >
                {label}
              </span>
              {!isLast ? (
                <span className="bcSep" aria-hidden="true">
                  →
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
