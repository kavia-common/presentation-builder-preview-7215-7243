import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import "./styles/theme.css";

import SlideForm from "./components/SlideForm";
import SlidePreview from "./components/SlidePreview";
import Toast from "./components/Toast";
import PresentationPreviewModal from "./components/PresentationPreviewModal";

import { createEmptySlide, validateSlides } from "./utils/slideModel";
import { exportSlidesToPptx } from "./utils/pptExport";
import { createDefaultCover, loadCoverFromStorage, revokeCoverObjectUrl, saveCoverToStorage } from "./utils/coverModel";
import { createDefaultLastSlide, loadLastSlideFromStorage, revokeLastSlideObjectUrls, saveLastSlideToStorage } from "./utils/lastSlideModel";
import {
  createDefaultSkillFactory,
  createDefaultSkillFactoryState,
  loadSkillFactoriesFromStorage,
  saveSkillFactoriesToStorage,
  upsertSkillFactory
} from "./utils/skillFactoryModel";
import useLocalStorageState from "./utils/useLocalStorageState";

const GLOBAL_COVER_ID = "__global_cover__";
const GLOBAL_LAST_ID = "__global_last__";
const SKILL_FACTORY_SLIDE1_PREFIX = "__skill_factory_slide1__:";
const SKILL_FACTORY_SLIDE2_PREFIX = "__skill_factory_slide2__:";
const SKILL_FACTORY_SLIDE3_PREFIX = "__skill_factory_slide3__:";
const SKILL_FACTORY_SLIDE4_PREFIX = "__skill_factory_slide4__:";

const LS_SPLIT_KEY = "pptgen_right_split_pct_v1";

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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * @typedef {object} SlideOption
 * @property {string} value
 * @property {string} label
 * @property {boolean=} disabled
 * @property {"separator"=} kind
 */

/** @returns {string} */
function getFactoryDisplayName(factory, idx1Based) {
  const n = factory?.slides?.slide1?.factoryName?.trim() || factory?.name?.trim?.() || `Skill Factory ${idx1Based}`;
  return n;
}

/** @returns {SlideOption[]} */
function buildSlideDropdownOptions({ factories, slides, globalCoverSlide, globalLastSlide }) {
  const opts = [];

  opts.push({ value: GLOBAL_COVER_ID, label: "Global Cover" });
  opts.push({ value: "__sep__cover__", label: "—", disabled: true, kind: "separator" });

  (Array.isArray(factories) ? factories : []).forEach((f, idx) => {
    const baseName = getFactoryDisplayName(f, idx + 1);

    // Group label is implemented as the prefix of each slide label (no nested <optgroup> so we can insert separators reliably).
    opts.push({ value: `${SKILL_FACTORY_SLIDE1_PREFIX}${f.id}`, label: `${baseName} – Slide 1` });
    opts.push({ value: `${SKILL_FACTORY_SLIDE2_PREFIX}${f.id}`, label: `${baseName} – Slide 2` });
    opts.push({ value: `${SKILL_FACTORY_SLIDE3_PREFIX}${f.id}`, label: `${baseName} – Slide 3` });
    opts.push({ value: `${SKILL_FACTORY_SLIDE4_PREFIX}${f.id}`, label: `${baseName} – Slide 4` });

    // Separator between factories, but not after the last one (keeps the list compact).
    if (idx !== factories.length - 1) {
      opts.push({ value: `__sep__sf__${f.id}`, label: "—", disabled: true, kind: "separator" });
    }
  });

  opts.push({ value: "__sep__normal__", label: "—", disabled: true, kind: "separator" });

  const safeSlides = Array.isArray(slides) ? slides : [];
  const normalStartNo = 2 + (Array.isArray(factories) ? factories.length : 0) * 4;

  safeSlides.forEach((s, idx) => {
    const n = normalStartNo + idx;
    const title = s?.title?.trim() ? s.title : `Untitled slide ${n}`;
    opts.push({ value: s.id, label: `Slide ${n} – ${title}` });
  });

  opts.push({ value: "__sep__last__", label: "—", disabled: true, kind: "separator" });
  opts.push({ value: GLOBAL_LAST_ID, label: "Global Last Page" });

  // Keep args referenced (avoid future lint unused if we expand labels)
  void globalCoverSlide;
  void globalLastSlide;

  return opts;
}

// PUBLIC_INTERFACE
function App() {
  /** Main UI entry point: top slide dropdown + side-by-side preview/editor + export (frontend-only). */
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

  // Right pane divider: percentage width for preview (left) vs editor (right).
  const [splitPct, setSplitPct] = useLocalStorageState(LS_SPLIT_KEY, 50);

  const isCoverSelected = selectedId === GLOBAL_COVER_ID;
  const isLastSelected = selectedId === GLOBAL_LAST_ID;
  const isSkillFactorySlide1Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE1_PREFIX);
  const isSkillFactorySlide2Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE2_PREFIX);
  const isSkillFactorySlide3Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE3_PREFIX);
  const isSkillFactorySlide4Selected = selectedId?.startsWith(SKILL_FACTORY_SLIDE4_PREFIX);

  const rightPaneRef = useRef(null);
  const splitWrapRef = useRef(null);
  const dragStateRef = useRef({ dragging: false });

  // Memoize to keep a stable reference for hook dependency lists (CI treats hook warnings as errors).
  const factories = useMemo(
    () => (Array.isArray(skillFactoriesState?.factories) ? skillFactoriesState.factories : []),
    [skillFactoriesState?.factories]
  );

  const selectedFactoryId = useMemo(() => {
    if (isSkillFactorySlide1Selected) return selectedId.slice(SKILL_FACTORY_SLIDE1_PREFIX.length) || null;
    if (isSkillFactorySlide2Selected) return selectedId.slice(SKILL_FACTORY_SLIDE2_PREFIX.length) || null;
    if (isSkillFactorySlide3Selected) return selectedId.slice(SKILL_FACTORY_SLIDE3_PREFIX.length) || null;
    if (isSkillFactorySlide4Selected) return selectedId.slice(SKILL_FACTORY_SLIDE4_PREFIX.length) || null;
    return null;
  }, [selectedId, isSkillFactorySlide1Selected, isSkillFactorySlide2Selected, isSkillFactorySlide3Selected, isSkillFactorySlide4Selected]);

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

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected || isSkillFactorySlide4Selected) {
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
    isSkillFactorySlide4Selected,
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

  const updateSkillFactorySlide4 = (factoryId, slide4Patch) => {
    setSkillFactoriesState((prev) =>
      upsertSkillFactory(prev, factoryId, (f) => ({
        ...f,
        slides: {
          ...(f.slides || {}),
          slide4: { ...(f.slides?.slide4 || {}), ...slide4Patch }
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
    const totalSlides = 2 + factories.length * 4 + slides.length; // cover + (sf1..sf4 per factory) + normal slides + last

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

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected || isSkillFactorySlide4Selected) {
      const sfIndex = selectedFactoryId ? factories.findIndex((f) => f.id === selectedFactoryId) : -1;
      const base = 1 + Math.max(0, sfIndex) * 4; // cover is 0; each factory contributes 4 slides
      const offset = isSkillFactorySlide2Selected ? 1 : isSkillFactorySlide3Selected ? 2 : isSkillFactorySlide4Selected ? 3 : 0;

      return {
        mode: isSkillFactorySlide2Selected
          ? "skillFactorySlide2"
          : isSkillFactorySlide3Selected
            ? "skillFactorySlide3"
            : isSkillFactorySlide4Selected
              ? "skillFactorySlide4"
              : "skillFactorySlide1",
        cover: globalCoverSlide,
        last: globalLastSlide,
        slide: null,
        skillFactory: selectedFactory,
        slideIndex: base + offset,
        totalSlides
      };
    }

    // Normal slide indices start after cover + all skill factory slides (4 per factory)
    return {
      mode: "slide",
      cover: globalCoverSlide,
      last: globalLastSlide,
      slide: selectedSlide,
      slideIndex: 1 + factories.length * 4 + Math.max(0, selectedIndex),
      totalSlides
    };
  }, [
    isCoverSelected,
    isLastSelected,
    isSkillFactorySlide1Selected,
    isSkillFactorySlide2Selected,
    isSkillFactorySlide3Selected,
    isSkillFactorySlide4Selected,
    globalCoverSlide,
    globalLastSlide,
    factories,
    slides.length,
    selectedSlide,
    selectedIndex,
    selectedFactory,
    selectedFactoryId
  ]);

  // Internal breadcrumbs retained for other components (e.g., modal); main header must stay minimal (dropdown only).
  const breadcrumbItems = useMemo(() => {
    const items = [{ label: "Cover", title: "Global Cover" }];

    if (isCoverSelected) return items;

    if (isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected || isSkillFactorySlide4Selected) {
      const sfIndex = selectedFactoryId ? factories.findIndex((f) => f.id === selectedFactoryId) : -1;
      const displayFactoryIndex = sfIndex >= 0 ? sfIndex + 1 : 1;

      const factoryName = getFactoryDisplayName(selectedFactory, displayFactoryIndex);

      const sfSlideNo = isSkillFactorySlide4Selected ? 4 : isSkillFactorySlide3Selected ? 3 : isSkillFactorySlide2Selected ? 2 : 1;

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

    const safeIdx = Math.max(0, Number.isFinite(selectedIndex) ? selectedIndex : 0);
    const slideNumber = 2 + factories.length * 4 + safeIdx;
    items.push({ label: `Slide ${slideNumber}`, title: `Content slide ${slideNumber}` });
    return items;
  }, [
    factories.length,
    isCoverSelected,
    isLastSelected,
    isSkillFactorySlide1Selected,
    isSkillFactorySlide2Selected,
    isSkillFactorySlide3Selected,
    isSkillFactorySlide4Selected,
    selectedFactory,
    selectedFactoryId,
    selectedIndex
  ]);

  // Ensure the side-by-side pane is visible when selection changes (dropdown / any future navigation).
  useEffect(() => {
    rightPaneRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
  }, [selectedId]);

  const generateDisabled = !canGenerate || isGenerating;

  // Resizable divider handlers (preserved).
  const startDrag = (e) => {
    e.preventDefault();
    dragStateRef.current.dragging = true;
    document.body.classList.add("noSelect");

    const onMove = (ev) => {
      if (!dragStateRef.current.dragging) return;
      const wrap = splitWrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = ev.clientX - rect.left;
      const pct = (x / rect.width) * 100;
      setSplitPct(clamp(pct, 28, 72)); // keep both panes usable
    };

    const onUp = () => {
      dragStateRef.current.dragging = false;
      document.body.classList.remove("noSelect");
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const slideDropdownOptions = useMemo(
    () => buildSlideDropdownOptions({ factories, slides, globalCoverSlide, globalLastSlide }),
    [factories, slides, globalCoverSlide, globalLastSlide]
  );

  // If selectedId is not present in options (e.g., removed factory), keep select controlled safely.
  const dropdownValue = useMemo(() => {
    const ok = slideDropdownOptions.some((o) => o.value === selectedId);
    return ok ? selectedId : GLOBAL_COVER_ID;
  }, [slideDropdownOptions, selectedId]);

  // PUBLIC_INTERFACE
  const handleDropdownChange = useCallback((e) => {
    /** Update current selection from top dropdown and keep editor/preview in view. */
    const next = e.target.value;
    // Ignore separator rows (disabled options won't fire change in most browsers, but keep safe)
    if (!next || next.startsWith("__sep__")) return;
    setSelectedId(next);
    // Extra nudge in case browser doesn't run the selection effect soon enough
    window.requestAnimationFrame(() => {
      rightPaneRef.current?.scrollIntoView?.({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  // Keep internal breadcrumbs "warm" (unused variable otherwise); other components may rely on the same memo logic pattern.
  void breadcrumbItems;

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

      {/* Minimal header: dropdown only (per requirements). */}
      <header className="appHeader appHeaderMinimal">
        <div className="container headerInner headerInnerMinimal">
          <label className="topSlideSelectLabel" htmlFor="topSlideSelect">
            Slide
          </label>
          <select
            id="topSlideSelect"
            className="select topSlideSelect"
            value={dropdownValue}
            onChange={handleDropdownChange}
            aria-label="Select slide"
          >
            {slideDropdownOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={Boolean(opt.disabled)}>
                {opt.kind === "separator" ? "──────────" : opt.label}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="appMain">
        <div className="container">
          <div className="gridMainSolo">
            <section className="rightPane" aria-label="Preview and editor" ref={rightPaneRef}>
              <div className="splitWrap" ref={splitWrapRef} style={{ ["--splitPct"]: `${splitPct}%` }}>
                <div className="splitPane splitPaneLeft" aria-label="Preview pane">
                  <SlidePreview {...previewProps} />
                </div>

                <div
                  className="splitDivider"
                  role="separator"
                  aria-orientation="vertical"
                  aria-label="Resize preview/editor"
                  tabIndex={0}
                  onMouseDown={startDrag}
                  onKeyDown={(e) => {
                    // Keyboard resize for accessibility
                    if (e.key === "ArrowLeft") setSplitPct((p) => clamp(Number(p) - 2, 28, 72));
                    if (e.key === "ArrowRight") setSplitPct((p) => clamp(Number(p) + 2, 28, 72));
                  }}
                >
                  <div className="splitGrip" aria-hidden="true" />
                </div>

                <div className="splitPane splitPaneRight" aria-label="Editor pane">
                  <SlideForm
                    mode={
                      isCoverSelected
                        ? "cover"
                        : isLastSelected
                          ? "last"
                          : isSkillFactorySlide4Selected
                            ? "skillFactorySlide4"
                            : isSkillFactorySlide3Selected
                              ? "skillFactorySlide3"
                              : isSkillFactorySlide2Selected
                                ? "skillFactorySlide2"
                                : isSkillFactorySlide1Selected
                                  ? "skillFactorySlide1"
                                  : "slide"
                    }
                    slide={
                      isCoverSelected ||
                      isLastSelected ||
                      isSkillFactorySlide1Selected ||
                      isSkillFactorySlide2Selected ||
                      isSkillFactorySlide3Selected ||
                      isSkillFactorySlide4Selected
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
                    onSkillFactorySlide4Change={(patch) => selectedFactoryId && updateSkillFactorySlide4(selectedFactoryId, patch)}
                  />

                  {/* Existing actions kept reachable (not in header). */}
                  <section className="card" aria-label="Actions">
                    <div className="cardHeader">
                      <h2 className="cardTitle">Actions</h2>
                      <p className="cardHint">Export, add slides, and manage groups.</p>
                    </div>
                    <div className="cardBody" style={{ display: "grid", gap: 10 }}>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="btn btnSecondary"
                          type="button"
                          onClick={addSlide}
                          disabled={isGenerating}
                          aria-disabled={isGenerating}
                        >
                          + Add slide
                        </button>

                        <button
                          className="btn btnGhost"
                          type="button"
                          onClick={addSkillFactory}
                          disabled={isGenerating}
                          aria-disabled={isGenerating}
                          title="Add Skill Factory group"
                        >
                          + Skill Factory
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

                      <div className={`helper ${canGenerate ? "" : "helperError"}`} role="status" aria-live="polite">
                        {helperText}
                      </div>

                      {/* Minimal management helpers: keep behavior unchanged, but without the left hierarchy UI. */}
                      {isSkillFactorySlide1Selected || isSkillFactorySlide2Selected || isSkillFactorySlide3Selected || isSkillFactorySlide4Selected ? (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <div className="badge">Skill Factory</div>
                          <button
                            type="button"
                            className="btn btnSmall btnDanger"
                            onClick={() => selectedFactoryId && deleteSkillFactory(selectedFactoryId)}
                            disabled={!selectedFactoryId}
                            aria-disabled={!selectedFactoryId}
                            title="Delete current Skill Factory group"
                          >
                            Delete group
                          </button>
                        </div>
                      ) : null}

                      {!isCoverSelected && !isLastSelected && !isSkillFactorySlide1Selected && !isSkillFactorySlide2Selected && !isSkillFactorySlide3Selected && !isSkillFactorySlide4Selected ? (
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                          <div className="badge">Normal slide</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                            <button
                              type="button"
                              className="btn btnSmall btnGhost"
                              onClick={() => selectedIndex >= 0 && moveSlide(selectedIndex, selectedIndex - 1)}
                              disabled={selectedIndex <= 0}
                              aria-disabled={selectedIndex <= 0}
                              title={selectedIndex <= 0 ? "Already at top" : "Move up"}
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              className="btn btnSmall btnGhost"
                              onClick={() => selectedIndex >= 0 && moveSlide(selectedIndex, selectedIndex + 1)}
                              disabled={selectedIndex < 0 || selectedIndex >= slides.length - 1}
                              aria-disabled={selectedIndex < 0 || selectedIndex >= slides.length - 1}
                              title={selectedIndex >= slides.length - 1 ? "Already at bottom" : "Move down"}
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              className="btn btnSmall btnDanger"
                              onClick={() => selectedId && deleteSlide(selectedId)}
                              disabled={!selectedSlide}
                              aria-disabled={!selectedSlide}
                              title="Delete slide"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </section>

                  <section className="card" aria-label="How to use">
                    <div className="cardHeader">
                      <h2 className="cardTitle">How to use</h2>
                      <p className="cardHint">Quick workflow</p>
                    </div>
                    <div className="cardBody">
                      <ol style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "#111827", fontSize: 13, lineHeight: 1.5 }}>
                        <li>
                          Use the <strong>Slide</strong> dropdown to switch between Global Cover, Skill Factory slides, normal slides, and Global Last Page.
                        </li>
                        <li>
                          Confirm layout in <strong>Preview</strong> (fit-to-width by default). Use −, 100%, + (and Fit) for detail.
                        </li>
                        <li>
                          Click <strong>Generate PPT</strong> to preview the full deck and download.
                          <div className="kbdHint" style={{ marginTop: 6 }}>
                            In preview: use ←/→ to navigate, Esc to close.
                          </div>
                        </li>
                      </ol>
                    </div>
                  </section>
                </div>
              </div>
            </section>
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
