import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./styles/theme.css";

import SlideList from "./components/SlideList";
import SlideForm from "./components/SlideForm";
import SlidePreview from "./components/SlidePreview";
import Toast from "./components/Toast";
import PresentationPreviewModal from "./components/PresentationPreviewModal";

import { createEmptySlide, validateSlides } from "./utils/slideModel";
import { exportSlidesToPptx } from "./utils/pptExport";
import { createDefaultCover, loadCoverFromStorage, revokeCoverObjectUrl, saveCoverToStorage } from "./utils/coverModel";

const GLOBAL_COVER_ID = "__global_cover__";

function makeTimestamp(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}_${hh}${min}`;
}

function safeFileBaseName(name) {
  return (name || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

// PUBLIC_INTERFACE
function App() {
  /** Main UI entry point: slide editor + preview + export (frontend-only). */
  const [globalCoverSlide, setGlobalCoverSlide] = useState(() => loadCoverFromStorage() || createDefaultCover());
  const [slides, setSlides] = useState(() => [createEmptySlide()]);
  const [selectedId, setSelectedId] = useState(() => GLOBAL_COVER_ID);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, variant: "info", title: "", message: "", autoHideMs: 0 });

  const isCoverSelected = selectedId === GLOBAL_COVER_ID;

  // Persist cover changes (excluding object URL).
  useEffect(() => {
    saveCoverToStorage(globalCoverSlide);
  }, [globalCoverSlide]);

  // Keep selection valid if slides change (e.g., delete).
  useEffect(() => {
    if (isCoverSelected) return;
    if (slides.length === 0) {
      setSelectedId(GLOBAL_COVER_ID);
      return;
    }
    if (!selectedId || !slides.some((s) => s.id === selectedId)) {
      setSelectedId(GLOBAL_COVER_ID);
    }
  }, [slides, selectedId, isCoverSelected]);

  // Cleanup: revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      slides.forEach((s) => {
        if (s.image?.objectUrl) URL.revokeObjectURL(s.image.objectUrl);
      });
      revokeCoverObjectUrl(globalCoverSlide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIndex = useMemo(() => slides.findIndex((s) => s.id === selectedId), [slides, selectedId]);
  const selectedSlide = selectedIndex >= 0 ? slides[selectedIndex] : null;

  const validation = useMemo(() => validateSlides(slides), [slides]);

  // Allow exporting even if there are zero normal slides; still require titles if slides exist.
  const canGenerate = slides.length === 0 ? true : validation.valid;

  const helperText = useMemo(() => {
    if (slides.length === 0) return "No content slides. Export will include only the Global Cover.";
    if (!validation.valid) {
      const nums = validation.invalidIndices.map((i) => i + 2).join(", ");
      // +2 because slide #1 is the global cover
      return `Please add a title to slide(s): ${nums}.`;
    }
    return "Ready to generate.";
  }, [slides.length, validation]);

  const addSlide = () => {
    const newSlide = createEmptySlide();
    setSlides((prev) => [...prev, newSlide]);
    setSelectedId(newSlide.id);
  };

  const deleteSlide = (id) => {
    setSlides((prev) => {
      const toDelete = prev.find((s) => s.id === id);
      if (toDelete?.image?.objectUrl) URL.revokeObjectURL(toDelete.image.objectUrl);
      return prev.filter((s) => s.id !== id);
    });
  };

  const moveSlide = (from, to) => {
    setSlides((prev) => {
      if (to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const updateSelected = (updatedSlide) => {
    setSlides((prev) => prev.map((s) => (s.id === updatedSlide.id ? updatedSlide : s)));
  };

  const updateCover = (updatedCover) => {
    setGlobalCoverSlide(updatedCover);
  };

  const buildSuggestedFileName = useCallback(() => {
    const coverTitle = safeFileBaseName(globalCoverSlide?.title);
    return `${coverTitle || "Presentation"}_${makeTimestamp()}.pptx`;
  }, [globalCoverSlide?.title]);

  const onDownloadFromPreview = useCallback(async () => {
    if (!canGenerate || isGenerating) return;

    const fileName = buildSuggestedFileName();

    setIsGenerating(true);
    setToast({
      open: true,
      variant: "info",
      title: "Generating PPTX…",
      message: "Please keep this tab open while we build your presentation.",
      autoHideMs: 0
    });

    try {
      // Ensure we await the promise and catch errors reliably.
      await exportSlidesToPptx({ cover: globalCoverSlide, slides, fileName });

      setToast({
        open: true,
        variant: "info",
        title: "Download started",
        message: "Your .pptx should download shortly. If blocked, check your browser’s download settings.",
        autoHideMs: 2500
      });
    } catch (e) {
      setToast({
        open: true,
        variant: "error",
        title: "Export failed",
        message: e?.message || "Unable to generate PPTX. Please try again.",
        autoHideMs: 8000
      });
    } finally {
      setIsGenerating(false);
    }
  }, [canGenerate, isGenerating, buildSuggestedFileName, globalCoverSlide, slides]);

  const onGenerate = () => {
    // Preview-first UX: open the full-deck preview (cover + all slides) before download.
    if (!canGenerate || isGenerating) return;
    setIsPreviewOpen(true);
  };

  const onDirectExport = async () => {
    // Secondary action: keep the legacy behavior available if users want one-click download.
    await onDownloadFromPreview();
  };

  const previewProps = useMemo(() => {
    if (isCoverSelected) {
      return {
        mode: "cover",
        cover: globalCoverSlide,
        slide: null,
        slideIndex: 0,
        totalSlides: slides.length + 1
      };
    }
    return {
      mode: "slide",
      cover: globalCoverSlide,
      slide: selectedSlide,
      slideIndex: Math.max(0, selectedIndex) + 1, // +1 because cover is slide 1
      totalSlides: slides.length + 1
    };
  }, [isCoverSelected, globalCoverSlide, slides.length, selectedSlide, selectedIndex]);

  const generateDisabled = !canGenerate || isGenerating;

  return (
    <div className="appShell">
      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <PresentationPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        cover={globalCoverSlide}
        slides={slides}
        onDownload={onDownloadFromPreview}
        canDownload={canGenerate}
        isDownloading={isGenerating}
        fileNameHint={buildSuggestedFileName()}
      />

      <header className="appHeader">
        <div className="container headerInner">
          <div className="headerTitle">
            <h1>PPT Generator</h1>
            <p>Create slides, preview instantly, then download a .pptx — no backend required.</p>
          </div>

          <div className="headerActions">
            <span className="badge" title="Ocean Professional theme">
              Ocean Professional
            </span>
            <button className="btn btnSecondary" type="button" onClick={addSlide} disabled={isGenerating} aria-disabled={isGenerating}>
              + Add slide
            </button>

            <button
              className="btn"
              type="button"
              onClick={onGenerate}
              disabled={generateDisabled}
              aria-disabled={generateDisabled}
              title={generateDisabled ? (isGenerating ? "Generating…" : helperText) : "Open presentation preview"}
            >
              {isGenerating ? "Generating…" : "Generate PPT"}
            </button>

            <button
              className="btn btnGhost"
              type="button"
              onClick={onDirectExport}
              disabled={generateDisabled}
              aria-disabled={generateDisabled}
              title={generateDisabled ? (isGenerating ? "Generating…" : helperText) : "Directly generate and download without preview"}
            >
              Direct download
            </button>
          </div>
        </div>
      </header>

      <main className="appMain">
        <div className="container">
          <div className="grid">
            <SlideList
              globalCover={{ id: GLOBAL_COVER_ID, data: globalCoverSlide }}
              slides={slides}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addSlide}
              onDelete={deleteSlide}
              onMoveUp={(idx) => moveSlide(idx, idx - 1)}
              onMoveDown={(idx) => moveSlide(idx, idx + 1)}
            />

            <SlidePreview {...previewProps} />

            <div style={{ display: "grid", gap: 16 }}>
              <SlideForm
                mode={isCoverSelected ? "cover" : "slide"}
                slide={isCoverSelected ? null : selectedSlide}
                cover={globalCoverSlide}
                onChange={updateSelected}
                onCoverChange={updateCover}
              />

              <section className="card" aria-label="How to use">
                <div className="cardHeader">
                  <h2 className="cardTitle">How to use</h2>
                  <p className="cardHint">Quick workflow</p>
                </div>
                <div className="cardBody">
                  <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "#111827", fontSize: 13, lineHeight: 1.5 }}>
                    <li>Edit the fixed <strong>Global Cover</strong> (slide 1) for title, subtitle, tagline and background.</li>
                    <li>Add slides with <strong>+ Add</strong>.</li>
                    <li>Fill in a <strong>title</strong> (required), subtitle, bullets, and optional image.</li>
                    <li>Pick theme colors and confirm in <strong>Preview</strong>.</li>
                    <li>
                      Click <strong>Generate PPT</strong> to preview the full deck and download.
                      <div className="kbdHint" style={{ marginTop: 6 }}>
                        In preview: use ←/→ to navigate, Esc to close.
                      </div>
                    </li>
                  </ol>

                  <div className="divider" />

                  <div className={`helper ${canGenerate ? "" : "helperError"}`} role="status" aria-live="polite">
                    {helperText}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <footer className="appFooter">
        <div className="container" style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>Frontend-only PPT builder. Images stay local (Object URLs).</div>
          <div>Tip: Use short titles and ~3–6 bullets for best slide density.</div>
        </div>
      </footer>
    </div>
  );
}

export default App;
