import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SlidePreview from "./SlidePreview";

/**
 * Full-deck presentation preview modal.
 * - Renders Global Cover + all content slides + Global Last Page in sequence
 * - Supports keyboard navigation (left/right), Esc to close
 * - Supports "zoom to fit" behavior and manual zoom
 * - Includes a prominent Download button that triggers PPTX export
 */

// PUBLIC_INTERFACE
export default function PresentationPreviewModal({
  open,
  onClose,
  cover,
  last,
  skillFactories,
  slides,
  onDownload,
  canDownload,
  isDownloading,
  fileNameHint
}) {
  /** Modal that previews the entire presentation and provides download/export actions. */
  const [activeIndex, setActiveIndex] = useState(0); // 0 = cover, ... last = final
  const [zoomMode, setZoomMode] = useState("fit"); // "fit" | "100" | "125" | "150"
  const [fitScale, setFitScale] = useState(1);

  const modalRef = useRef(null);
  const contentRef = useRef(null);
  const stripRef = useRef(null);
  const activeThumbRef = useRef(null);

  const deck = useMemo(() => {
    const safeFactories = Array.isArray(skillFactories) ? skillFactories : [];
    const safeSlides = Array.isArray(slides) ? slides : [];
    return [
      { id: "__cover__", kind: "cover", data: cover },
      ...safeFactories.map((f) => ({ id: `__sf1__${f.id}`, kind: "skillFactorySlide1", data: f })),
      ...safeSlides.map((s) => ({ id: s.id, kind: "slide", data: s })),
      { id: "__last__", kind: "last", data: last }
    ];
  }, [cover, last, slides, skillFactories]);

  const total = deck.length;

  // Reset to first slide when opening (so user sees cover first).
  useEffect(() => {
    if (!open) return;
    setActiveIndex(0);
    setZoomMode("fit");
  }, [open]);

  const clampIndex = useCallback(
    (idx) => Math.max(0, Math.min(total - 1, idx)),
    [total]
  );

  const goTo = useCallback(
    (idx) => setActiveIndex(clampIndex(idx)),
    [clampIndex]
  );

  const goPrev = useCallback(() => goTo(activeIndex - 1), [goTo, activeIndex]);
  const goNext = useCallback(() => goTo(activeIndex + 1), [goTo, activeIndex]);

  // Focus management: focus modal on open so keyboard navigation works.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      modalRef.current?.focus?.();
    }, 0);
    return () => window.clearTimeout(t);
  }, [open]);

  // Keyboard navigation: Esc closes; arrows switch slides.
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
        return;
      }
      // Don't override arrow behavior when focus is in an input/textarea/select.
      const tag = (e.target?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, goPrev, goNext]);

  // Ensure the active thumbnail is visible in the strip when selection changes.
  useEffect(() => {
    if (!open) return;
    const el = activeThumbRef.current;
    if (!el) return;
    el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [open, activeIndex]);

  const active = deck[activeIndex];

  // "Zoom to fit" computation: scale the 16:9 slide area to available space.
  useEffect(() => {
    if (!open) return;
    if (zoomMode !== "fit") return;

    const computeFit = () => {
      const wrap = contentRef.current;
      if (!wrap) return;

      // Available space inside preview body
      const rect = wrap.getBoundingClientRect();
      const availW = Math.max(0, rect.width);
      const availH = Math.max(0, rect.height);

      // "Base" slide size in CSS px (independent of actual 16:9 ratio).
      // These numbers are just a baseline for scaling; aspect-ratio is enforced via CSS.
      const baseW = 1280;
      const baseH = 720;

      const margin = 14; // avoid edge collisions
      const scale = Math.min((availW - margin) / baseW, (availH - margin) / baseH);

      // Clamp so it doesn't get comically large on wide screens
      const clamped = Math.max(0.35, Math.min(1.2, Number.isFinite(scale) ? scale : 1));
      setFitScale(clamped);
    };

    computeFit();
    window.addEventListener("resize", computeFit);
    return () => window.removeEventListener("resize", computeFit);
  }, [open, zoomMode]);

  const effectiveScale = useMemo(() => {
    if (zoomMode === "fit") return fitScale;
    if (zoomMode === "100") return 1;
    if (zoomMode === "125") return 1.25;
    if (zoomMode === "150") return 1.5;
    return 1;
  }, [zoomMode, fitScale]);

  const onBackdropMouseDown = (e) => {
    // close on backdrop click only
    if (e.target === e.currentTarget) onClose?.();
  };

  if (!open) return null;

  return (
    <div className="ppBackdrop" role="presentation" onMouseDown={onBackdropMouseDown}>
      <div
        className="ppModal"
        role="dialog"
        aria-modal="true"
        aria-label="Presentation preview"
        tabIndex={-1}
        ref={modalRef}
      >
        <div className="ppHeader">
          <div className="ppTitleBlock">
            <div className="ppTitle">Presentation preview</div>
            <div className="ppSubTitle">
              Slide {activeIndex + 1} of {total} •{" "}
              {active?.kind === "cover"
                ? "Global Cover"
                : active?.kind === "last"
                  ? "Global Last Page"
                  : active?.kind === "skillFactorySlide1"
                    ? "Skill Factory – Slide 1"
                    : "Content slide"}
            </div>
          </div>

          <div className="ppHeaderActions">
            <div className="ppZoom">
              <label className="ppZoomLabel" htmlFor="ppZoomSelect">
                Zoom
              </label>
              <select
                id="ppZoomSelect"
                className="select"
                value={zoomMode}
                onChange={(e) => setZoomMode(e.target.value)}
                aria-label="Zoom control"
              >
                <option value="fit">Fit</option>
                <option value="100">100%</option>
                <option value="125">125%</option>
                <option value="150">150%</option>
              </select>
            </div>

            <button
              type="button"
              className="btn"
              onClick={() => onDownload?.()}
              disabled={!canDownload || isDownloading}
              aria-disabled={!canDownload || isDownloading}
              title={
                !canDownload
                  ? "Fix validation errors before exporting"
                  : isDownloading
                    ? "Generating…"
                    : fileNameHint
                      ? `Download as ${fileNameHint}`
                      : "Download PPTX"
              }
            >
              {isDownloading ? "Generating…" : "Download PPT"}
            </button>

            <button type="button" className="btn btnGhost" onClick={onClose} aria-label="Close preview" title="Close">
              ✕
            </button>
          </div>
        </div>

        <div className="ppBody">
          {/* Thumbnails strip */}
          <aside className="ppThumbs" aria-label="Slide thumbnails">
            <div className="ppThumbsHeader">
              <div className="badge" title="Use thumbnails to jump">
                Slides
              </div>
              <div className="kbdHint">←/→ to navigate</div>
            </div>

            <div className="ppThumbsList" ref={stripRef}>
              {deck.map((item, idx) => {
                const selected = idx === activeIndex;
                const label =
                  item.kind === "cover"
                    ? "Cover"
                    : item.kind === "last"
                      ? "Last"
                      : item.kind === "skillFactorySlide1"
                        ? "Skill Factory – Slide 1"
                        : `Slide ${idx + 1}`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`ppThumb ${selected ? "ppThumbActive" : ""}`}
                    onClick={() => goTo(idx)}
                    aria-current={selected ? "true" : "false"}
                    aria-label={`Go to ${label}`}
                    ref={selected ? activeThumbRef : null}
                  >
                    <div className="ppThumbNo">{idx + 1}</div>
                    <div className="ppThumbLabel">{label}</div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main preview */}
          <section className="ppPreviewArea" aria-label="Slide preview area">
            <div className="ppNav">
              <button type="button" className="btn btnGhost btnSmall" onClick={goPrev} disabled={activeIndex === 0}>
                ← Prev
              </button>
              <button
                type="button"
                className="btn btnGhost btnSmall"
                onClick={goNext}
                disabled={activeIndex === total - 1}
              >
                Next →
              </button>
            </div>

            <div className="ppPreviewFrame" ref={contentRef}>
              <div
                className="ppScaled"
                style={{
                  transform: `scale(${effectiveScale})`
                }}
              >
                {/* We reuse the existing SlidePreview component as the slide renderer. */}
                <div className="ppSlideCard">
                  <SlidePreview
                    mode={
                      active.kind === "cover" ? "cover" : active.kind === "last" ? "last" : active.kind === "skillFactorySlide1" ? "skillFactorySlide1" : "slide"
                    }
                    cover={cover}
                    last={last}
                    slide={active.kind === "slide" ? active.data : null}
                    skillFactory={active.kind === "skillFactorySlide1" ? active.data : null}
                    slideIndex={activeIndex}
                    totalSlides={total}
                  />
                </div>
              </div>
            </div>

            <div className="ppFooterHint">
              Tip: Use <strong>Fit</strong> on smaller screens. Use <strong>Esc</strong> to close.
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
