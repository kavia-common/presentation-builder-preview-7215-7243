import React, { useCallback, useEffect, useMemo, useState } from "react";
import "./App.css";
import "./styles/theme.css";

import SlideList from "./components/SlideList";
import SlideForm from "./components/SlideForm";
import SlidePreview from "./components/SlidePreview";
import Toast from "./components/Toast";
import PresentationPreviewModal from "./components/PresentationPreviewModal";
import Breadcrumbs from "./components/Breadcrumbs";

import { createEmptySlide, validateSlides } from "./utils/slideModel";
import { exportSlidesToPptx } from "./utils/pptExport";
import { createDefaultCover, loadCoverFromStorage, revokeCoverObjectUrl, saveCoverToStorage } from "./utils/coverModel";
import {
  createDefaultLastSlide,
  loadLastSlideFromStorage,
  revokeLastSlideObjectUrls,
  saveLastSlideToStorage
} from "./utils/lastSlideModel";
import {
  createDefaultSkillFactory,
  createDefaultSkillFactoryState,
  loadSkillFactoriesFromStorage,
  saveSkillFactoriesToStorage,
  upsertSkillFactory
} from "./utils/skillFactoryModel";

const GLOBAL_COVER_ID = "__global_cover__";
const GLOBAL_LAST_ID = "__global_last__";
const SKILL_FACTORY_SLIDE1_PREFIX = "__skill_factory_slide1__:";
const SKILL_FACTORY_SLIDE2_PREFIX = "__skill_factory_slide2__:";
const SKILL_FACTORY_SLIDE3_PREFIX = "__skill_factory_slide3__:";

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
  const [globalLastSlide, setGlobalLastSlide] = useState(() => loadLastSlideFromStorage() || createDefaultLastSlide());

  const [skillFactoriesState, setSkillFactoriesState] = useState(
    () => loadSkillFactoriesFromStorage() || createDefaultSkillFactoryState()
  );

  const [slides, setSlides] = useState(() => [createEmptySlide()]);
  const [selectedId, setSelectedId] = useState(() => GLOBAL_COVER_ID);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toast, setToast] = useState({ open: false, variant: "info", title: "", message: "", autoHideMs: 0 });

  const isCoverSelected = selectedId === GLOBAL_COVER_ID;
  const isLastSelected = selectedId === GLOBAL_LAST_ID;
  const isSkillFactorySlide1Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE1_PREFIX);
  const isSkillFactorySlide2Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE2_PREFIX);
  const isSkillFactorySlide3Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE3_PREFIX);

  // Memoize to keep a stable reference for hook dependency lists (CI treats hook warnings as errors).
  const factories = useMemo(
    () => (Array.isArray(skillFactoriesState?.factories) ? skillFactoriesState.factories : []),
    [skillFactoriesState?.factories]
  );

  const selectedFactoryId = useMemo(() => {
    if (isSkillFactorySlide1Selected) return selectedId.slice(SKILL_FACTORY_SLIDE1_PREFIX.length) || null;
    if (isSkillFactorySlide2Selected) return selectedId.slice(SKILL_FACTORY_SLIDE2_PREFIX.length) || null;
    if (isSkillFactorySlide3Selected) return selectedId.slice(SKILL_FACTORY_SLIDE3_PREFIX.length) || null;
    return null;
  }, [selectedId, isSkillFactorySlide1Selected, isSkillFactorySlide2Selected, isSkillFactorySlide3Selected]);

  const selectedFactory = useMemo(() => {
    if (!selectedFactoryId) return null;
    return factories.find((f) => f.id === selectedFactoryId) || null;
  }, [factories, selectedFactoryId]);

  // Persist cover changes (excluding object URL).
  useEffect(() => {
    saveCoverToStorage(globalCoverSlide);
  }, [globalCoverSlide]);

  // Persist Global Last Page changes (excluding object URLs).
  useEffect(() => {
    saveLastSlideToStorage(globalLastSlide);
  }, [globalLastSlide]);

  // Persist skill factory changes.
  useEffect(() => {
    saveSkillFactoriesToStorage(skillFactoriesState);
  }, [skillFactoriesState]);

  // Keep selection valid if slides/factories change (e.g., delete).
  useEffect(() => {
    if (isCoverSelected || isLastSelected) return;

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected) {
      const ok = selectedFactoryId && factories.some((f) => f.id === selectedFactoryId);
      if (!ok) setSelectedId(GLOBAL_COVER_ID);
      return;
    }

    // If selection points to a deleted slide, reset to cover.
    if (slides.length === 0) {
      setSelectedId(GLOBAL_COVER_ID);
      return;
    }
    if (!selectedId || !slides.some((s) => s.id === selectedId)) {
      setSelectedId(GLOBAL_COVER_ID);
    }
  }, [
    slides,
    factories,
    selectedId,
    isCoverSelected,
    isLastSelected,
    isSkillFactorySlide1Selected,
    isSkillFactorySlide2Selected,
    isSkillFactorySlide3Selected,
    selectedFactoryId
  ]);

  // Cleanup: revoke object URLs on unmount.
  useEffect(() => {
    return () => {
      slides.forEach((s) => {
        if (s.image?.objectUrl) URL.revokeObjectURL(s.image.objectUrl);
      });
      // Note: skill factory slide 2 images are object URLs as well; we do not revoke on every change
      // to avoid breaking preview when persisted. They will be reclaimed when the tab closes.
      revokeCoverObjectUrl(globalCoverSlide);
      revokeLastSlideObjectUrls(globalLastSlide);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedIndex = useMemo(() => slides.findIndex((s) => s.id === selectedId), [slides, selectedId]);
  const selectedSlide = selectedIndex >= 0 ? slides[selectedIndex] : null;

  const validation = useMemo(() => validateSlides(slides), [slides]);

  // Allow exporting even if there are zero normal slides; still require titles if slides exist.
  const canGenerate = slides.length === 0 ? true : validation.valid;

  const helperText = useMemo(() => {
    if (slides.length === 0) return "No content slides. Export will include Global Cover + Global Last Page.";
    if (!validation.valid) {
      const nums = validation.invalidIndices.map((i) => i + 2).join(", ");
      // +2 because slide #1 is the global cover
      return `Please add a title to slide(s): ${nums}.`;
    }
    return "Ready to generate.";
  }, [slides.length, validation]);

  const addSkillFactory = useCallback(() => {
    const f = createDefaultSkillFactory();
    setSkillFactoriesState((prev) => ({
      factories: [...(Array.isArray(prev?.factories) ? prev.factories : []), f]
    }));
    // Immediately select the newly created factory's Slide 1 editor.
    setSelectedId(`${SKILL_FACTORY_SLIDE1_PREFIX}${f.id}`);
  }, []);

  const deleteSkillFactory = useCallback((factoryId) => {
    setSkillFactoriesState((prev) => ({
      factories: (Array.isArray(prev?.factories) ? prev.factories : []).filter((f) => f.id !== factoryId)
    }));
  }, []);

  const updateSkillFactorySlide1 = (factoryId, slide1Patch) => {
    setSkillFactoriesState((prev) =>
      upsertSkillFactory(prev, factoryId, (f) => ({
        ...f,
        slides: {
          ...(f.slides || {}),
          slide1: { ...(f.slides?.slide1 || {}), ...slide1Patch }
        }
      }))
    );
  };

  const updateSkillFactorySlide2 = (factoryId, slide2Patch) => {
    setSkillFactoriesState((prev) =>
      upsertSkillFactory(prev, factoryId, (f) => ({
        ...f,
        slides: {
          ...(f.slides || {}),
          slide2: { ...(f.slides?.slide2 || {}), ...slide2Patch }
        }
      }))
    );
  };

  const updateSkillFactorySlide3 = (factoryId, slide3Patch) => {
    setSkillFactoriesState((prev) =>
      upsertSkillFactory(prev, factoryId, (f) => ({
        ...f,
        slides: {
          ...(f.slides || {}),
          slide3: { ...(f.slides?.slide3 || {}), ...slide3Patch }
        }
      }))
    );
  };

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
      await exportSlidesToPptx({
        cover: globalCoverSlide,
        last: globalLastSlide,
        skillFactories: factories,
        slides,
        fileName
      });

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
  }, [canGenerate, isGenerating, buildSuggestedFileName, globalCoverSlide, globalLastSlide, factories, slides]);

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
    const totalSlides = 2 + factories.length * 3 + slides.length; // cover + (sf1+sf2+sf3 per factory) + normal slides + last

    if (isCoverSelected) {
      return {
        mode: "cover",
        cover: globalCoverSlide,
        last: globalLastSlide,
        slide: null,
        slideIndex: 0,
        totalSlides
      };
    }

    if (isLastSelected) {
      return {
        mode: "last",
        cover: globalCoverSlide,
        last: globalLastSlide,
        slide: null,
        slideIndex: totalSlides - 1,
        totalSlides
      };
    }

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected) {
      const sfIndex = selectedFactoryId ? factories.findIndex((f) => f.id === selectedFactoryId) : -1;
      const base = 1 + Math.max(0, sfIndex) * 3; // cover is 0; each factory contributes 3 slides
      const offset = isSkillFactorySlide2Selected ? 1 : isSkillFactorySlide3Selected ? 2 : 0;

      return {
        mode: isSkillFactorySlide2Selected ? "skillFactorySlide2" : isSkillFactorySlide3Selected ? "skillFactorySlide3" : "skillFactorySlide1",
        cover: globalCoverSlide,
        last: globalLastSlide,
        slide: null,
        skillFactory: selectedFactory,
        slideIndex: base + offset,
        totalSlides
      };
    }

    // Normal slide indices start after cover + all skill factory slides (3 per factory)
    return {
      mode: "slide",
      cover: globalCoverSlide,
      last: globalLastSlide,
      slide: selectedSlide,
      slideIndex: 1 + factories.length * 3 + Math.max(0, selectedIndex),
      totalSlides
    };
  }, [
    isCoverSelected,
    isLastSelected,
    isSkillFactorySlide1Selected,
    isSkillFactorySlide2Selected,
    isSkillFactorySlide3Selected,
    globalCoverSlide,
    globalLastSlide,
    factories,
    slides.length,
    selectedSlide,
    selectedIndex,
    selectedFactory,
    selectedFactoryId
  ]);

  const breadcrumbItems = useMemo(() => {
    // Slide number semantics here follow the same deck ordering as SlideList / previewProps:
    // Cover = #1, Skill Factory slides follow, then normal slides, then Last.
    const items = [{ label: "Cover", title: "Global Cover" }];

    if (isCoverSelected) return items;

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected) {
      const sfIndex = selectedFactoryId ? factories.findIndex((f) => f.id === selectedFactoryId) : -1;
      const displayFactoryIndex = sfIndex >= 0 ? sfIndex + 1 : 1;

      const factoryName =
        selectedFactory?.slides?.slide1?.factoryName?.trim() ||
        selectedFactory?.name?.trim?.() ||
        `Skill Factory ${displayFactoryIndex}`;

      const sfSlideNo = isSkillFactorySlide3Selected ? 3 : isSkillFactorySlide2Selected ? 2 : 1;

      items.push({
        label: factoryName,
        title: factoryName
      });
      items.push({
        label: `Slide ${sfSlideNo}`,
        title: `Skill Factory slide ${sfSlideNo}`
      });
      return items;
    }

    if (isLastSelected) {
      items.push({ label: "Last", title: "Global Last Page" });
      return items;
    }

    // Normal slide: show Slide N where N is deck slide number (Cover is Slide 1).
    // Normal slides start at 2 + factories*3 (because cover is #1).
    const safeIdx = Math.max(0, Number.isFinite(selectedIndex) ? selectedIndex : 0);
    const slideNumber = 2 + factories.length * 3 + safeIdx;
    items.push({ label: `Slide ${slideNumber}`, title: `Content slide ${slideNumber}` });
    return items;
  }, [
    factories,
    isCoverSelected,
    isLastSelected,
    isSkillFactorySlide1Selected,
    isSkillFactorySlide2Selected,
    isSkillFactorySlide3Selected,
    selectedFactory,
    selectedFactoryId,
    selectedIndex
  ]);

  const generateDisabled = !canGenerate || isGenerating;

  return (
    <div className="appShell">
      <Toast toast={toast} onClose={() => setToast((t) => ({ ...t, open: false }))} />

      <PresentationPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        cover={globalCoverSlide}
        last={globalLastSlide}
        skillFactories={factories}
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
              globalLast={{ id: GLOBAL_LAST_ID, data: globalLastSlide }}
              skillFactories={factories}
              slides={slides}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAdd={addSlide}
              onAddSkillFactory={addSkillFactory}
              onDelete={deleteSlide}
              onDeleteSkillFactory={deleteSkillFactory}
              onMoveUp={(idx) => moveSlide(idx, idx - 1)}
              onMoveDown={(idx) => moveSlide(idx, idx + 1)}
            />

            <div style={{ display: "grid", gap: 12, alignContent: "start", minWidth: 0 }}>
              <div className="editorBreadcrumbRow">
                <Breadcrumbs items={breadcrumbItems} ariaLabel="Editor breadcrumb" />
              </div>

              <SlidePreview {...previewProps} />
            </div>

            <div style={{ display: "grid", gap: 16 }}>
              <div className="editorBreadcrumbRow">
                <Breadcrumbs items={breadcrumbItems} ariaLabel="Editor breadcrumb" />
              </div>

              <SlideForm
                mode={
                  isCoverSelected
                    ? "cover"
                    : isLastSelected
                      ? "last"
                      : isSkillFactorySlide3Selected
                        ? "skillFactorySlide3"
                        : isSkillFactorySlide2Selected
                          ? "skillFactorySlide2"
                          : isSkillFactorySlide1Selected
                            ? "skillFactorySlide1"
                            : "slide"
                }
                slide={
                  isCoverSelected || isLastSelected || isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected
                    ? null
                    : selectedSlide
                }
                cover={globalCoverSlide}
                last={globalLastSlide}
                skillFactory={selectedFactory}
                onChange={updateSelected}
                onCoverChange={updateCover}
                onLastChange={setGlobalLastSlide}
                onSkillFactorySlide1Change={(patch) => selectedFactoryId && updateSkillFactorySlide1(selectedFactoryId, patch)}
                onSkillFactorySlide2Change={(patch) => selectedFactoryId && updateSkillFactorySlide2(selectedFactoryId, patch)}
                onSkillFactorySlide3Change={(patch) => selectedFactoryId && updateSkillFactorySlide3(selectedFactoryId, patch)}
              />

              <section className="card" aria-label="How to use">
                <div className="cardHeader">
                  <h2 className="cardTitle">How to use</h2>
                  <p className="cardHint">Quick workflow</p>
                </div>
                <div className="cardBody">
                  <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "#111827", fontSize: 13, lineHeight: 1.5 }}>
                    <li>Edit the fixed <strong>Global Cover</strong> (slide 1) for title, subtitle, tagline and background.</li>
                    <li>Edit the fixed <strong>Global Last Page</strong> (always the final slide) for a closing message and optional branding.</li>
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
