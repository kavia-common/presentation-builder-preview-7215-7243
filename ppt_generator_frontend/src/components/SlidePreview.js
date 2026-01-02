import React, { useEffect, useMemo, useRef, useState } from "react";
import { THEME_PRESETS } from "../utils/slideModel";

function normalizeMultiline(text) {
  return (text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

const ZOOM_LEVELS = [0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5];

function nearestZoomIndex(value) {
  let best = 0;
  let bestDist = Infinity;
  ZOOM_LEVELS.forEach((z, idx) => {
    const d = Math.abs(z - value);
    if (d < bestDist) {
      best = idx;
      bestDist = d;
    }
  });
  return best;
}

/**
 * PUBLIC_INTERFACE
 */
export default function SlidePreview({
  mode = "slide",
  cover,
  last,
  slide,
  skillFactory,
  slideIndex = 0,
  totalSlides = 1,
  /**
   * Optional: allow parent containers to turn off header/controls (e.g., modal wrapper).
   * Default keeps current behavior.
   */
  showChrome = true
}) {
  /** Preview renderer for a single slide-like entity with fit-to-width + zoom controls. */

  const preset = useMemo(() => {
    const pid = slide?.theme?.backgroundPresetId || "surface";
    return THEME_PRESETS[pid] || THEME_PRESETS.surface;
  }, [slide?.theme?.backgroundPresetId]);

  const sf1 = skillFactory?.slides?.slide1;
  const sf2 = skillFactory?.slides?.slide2;
  const sf3 = skillFactory?.slides?.slide3;
  const sf4 = skillFactory?.slides?.slide4;

  const safeSlideIndex = Number.isFinite(slideIndex) ? slideIndex : 0;
  const safeTotalSlides = Number.isFinite(totalSlides) && totalSlides > 0 ? totalSlides : 1;

  // Zoom state:
  // We still expose manual zoom controls, but the LIVE preview must *always* be fully visible.
  // Therefore we always compute an "auto-fit" scale based on BOTH width and height, and then
  // additionally apply user zoom on top (without allowing overflow).
  const [zoomIdx, setZoomIdx] = useState(() => nearestZoomIndex(0.9));

  const wrapRef = useRef(null);
  const stageRef = useRef(null);

  // If the component is remounted (e.g., switching selection), default to 90% zoom.
  useEffect(() => {
    setZoomIdx(nearestZoomIndex(0.9));
  }, [mode, slide?.id, skillFactory?.id]);

  // Recompute on container resize/relayout by forcing a state tick.
  const [layoutTick, setLayoutTick] = useState(0);
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const ro = new ResizeObserver(() => setLayoutTick((x) => x + 1));
    ro.observe(wrap);

    // Also respond to viewport changes.
    const onResize = () => setLayoutTick((x) => x + 1);
    window.addEventListener("resize", onResize);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, []);

  /**
   * Compute the *inner* available space for the stage (after padding).
   * This fixes the common “leftover empty space / corner anchoring” bug caused
   * by measuring the wrong element (the padded wrapper instead of the actual stage).
   */
  const stageBox = useMemo(() => {
    const stage = stageRef.current;
    if (!stage) return { w: 0, h: 0 };

    const rect = stage.getBoundingClientRect();
    return {
      w: Math.max(0, rect.width),
      h: Math.max(0, rect.height)
    };
  }, [layoutTick]);

  const autoFitScale = useMemo(() => {
    const availW = stageBox.w;
    const availH = stageBox.h;
    if (!availW || !availH) return 1;

    // Base 16:9 canvas size used by SlidePreview (matches pvScaled/pvSlide: 1280x720).
    const baseW = 1280;
    const baseH = 720;

    // Auto-fit must consider BOTH dimensions; pick the limiting factor.
    const scaleW = availW / baseW;
    const scaleH = availH / baseH;
    const scale = Math.min(scaleW, scaleH);

    // Allow a small up-scale on large panes, but keep the canvas always fully visible.
    return Math.max(0.25, Math.min(1.25, Number.isFinite(scale) ? scale : 1));
  }, [stageBox.w, stageBox.h]);

  // Manual zoom multiplies the auto-fit scale, but we MUST clamp to avoid overflow.
  const manualScale = ZOOM_LEVELS[zoomIdx] || 1;

  const effectiveScale = useMemo(() => {
    const availW = stageBox.w;
    const availH = stageBox.h;
    if (!availW || !availH) return manualScale;

    const baseW = 1280;
    const baseH = 720;

    const maxAllowed = Math.min(availW / baseW, availH / baseH);

    // Start with auto-fit then apply manual zoom, but never exceed available space.
    const desired = autoFitScale * manualScale;

    return Math.max(0.25, Math.min(maxAllowed, desired));
  }, [autoFitScale, manualScale, stageBox.w, stageBox.h]);

  const canZoomOut = zoomIdx > 0;
  const canZoomIn = zoomIdx < ZOOM_LEVELS.length - 1;

  const onZoomOut = () => {
    setZoomIdx((i) => Math.max(0, i - 1));
  };

  const onZoomIn = () => {
    setZoomIdx((i) => Math.min(ZOOM_LEVELS.length - 1, i + 1));
  };

  const onZoomReset = () => {
    // Reset defaults to 90% (requested).
    setZoomIdx(nearestZoomIndex(0.9));
  };

  // Empty state:
  const needsNormalSlide = mode === "slide";
  if (needsNormalSlide && !slide) {
    return (
      <section className={showChrome ? "card" : ""} aria-label="Slide preview">
        {showChrome ? (
          <div className="cardHeader">
            <h2 className="cardTitle">Preview</h2>
            <p className="cardHint">Nothing selected yet.</p>
          </div>
        ) : null}
        <div className={showChrome ? "cardBody" : ""}>
          <div className="previewEmpty">
            <div className="badge">Preview</div>
            <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "var(--ocean-muted)", lineHeight: 1.5 }}>
              Select a slide from the left to see a live preview here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const headerLabel = mode === "cover" ? "Cover Preview" : "Preview";

  const ZoomControls = showChrome ? (
    <div className="pvZoom" aria-label="Preview zoom controls">
      <button type="button" className="btn btnSmall btnGhost" onClick={onZoomOut} disabled={!canZoomOut} aria-disabled={!canZoomOut}>
        −
      </button>
      <button type="button" className="btn btnSmall btnGhost" onClick={onZoomReset} title="Reset to 90%">
        90%
      </button>
      <button type="button" className="btn btnSmall btnGhost" onClick={onZoomIn} disabled={!canZoomIn} aria-disabled={!canZoomIn}>
        +
      </button>
    </div>
  ) : null;

  return (
    <section className={showChrome ? "card" : ""} aria-label="Slide preview">
      {showChrome ? (
        <div className="cardHeader">
          <div className="previewHeaderRow">
            <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
              <h2 className="cardTitle">{headerLabel}</h2>
              <span className="kbdHint" aria-label="Slide position">
                Slide {safeSlideIndex + 1} of {safeTotalSlides}
              </span>
            </div>
            {ZoomControls}
          </div>
          <p className="cardHint">Auto-fit (width + height) always on. Use zoom controls for detail.</p>
        </div>
      ) : null}

      <div className={showChrome ? "cardBody pvBody" : "pvBody"} ref={wrapRef}>
        <div className="pvStage" ref={stageRef}>
          <div
            className="pvScaled"
            style={{
              transform: `scale(${effectiveScale})`
            }}
          >
            <div className="pvSlide">
              {mode === "cover" ? (
              <div className="coverPreviewFrame">
                <div className="coverPreviewBg">
                  {cover?.backgroundImage?.objectUrl ? (
                    <div
                      className="coverPreviewHero"
                      style={{
                        backgroundImage: `url(${cover.backgroundImage.objectUrl})`
                      }}
                      aria-label="Cover background image"
                    />
                  ) : (
                    <div className="coverPreviewHero coverPreviewHeroFallback" aria-label="Cover background placeholder" />
                  )}

                  <div
                    className="coverPreviewOverlay"
                    style={{
                      "--coverPrimary": cover?.primaryColor || "#2563EB",
                      "--coverSecondary": cover?.secondaryColor || "#F59E0B"
                    }}
                  />

                  <div className="coverPreviewContent">
                    <div className="coverPreviewLeft">
                      <div className="coverLockup">
                        <div className="coverTitle">{cover?.title?.trim() ? cover.title : "Cover Title"}</div>
                        {cover?.subtitle?.trim() ? <div className="coverSubtitle">{cover.subtitle}</div> : null}

                        {normalizeMultiline(cover?.tagline).length ? (
                          <div className="coverTagline">
                            {normalizeMultiline(cover?.tagline).map((line, idx) => (
                              <div key={idx}>{line}</div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="coverLeftFooter">
                        <div className="coverMetaDot" aria-hidden="true" />
                        <div className="coverMetaText">Ocean Professional • Global Cover</div>
                      </div>
                    </div>

                    <div className="coverPreviewRight">
                      <div className="coverBrandMark" title="Brand mark (preview placeholder)">
                        <div className="coverBrandCircle">TATA</div>
                        <div className="coverBrandText">TATA</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : mode === "last" ? (
              <div className="lastPreviewFrame">
                <div
                  className="lastPreviewBg"
                  style={{
                    backgroundColor: last?.backgroundColor || "#FFFFFF"
                  }}
                >
                  {last?.backgroundImage?.objectUrl ? (
                    <div
                      className="lastPreviewHero"
                      style={{
                        backgroundImage: `url(${last.backgroundImage.objectUrl})`
                      }}
                      aria-label="Last page background image"
                    />
                  ) : (
                    <div className="lastPreviewHero lastPreviewHeroFallback" aria-label="Last page background placeholder" />
                  )}

                  <div className="lastPreviewWash" aria-hidden="true" />

                  <div className="lastPreviewContent">
                    <div className="lastLockup">
                      <div className="lastHeadline" style={{ color: last?.headlineColor || "#111827" }}>
                        {last?.headline?.trim() ? last.headline : "THANK YOU"}
                      </div>

                      {last?.tagline?.trim() ? (
                        <div className="lastTagline" style={{ color: last?.taglineColor || last?.accentColor || "#2563EB" }}>
                          {last.tagline}
                        </div>
                      ) : null}

                      {normalizeMultiline(last?.subhead).length ? (
                        <div className="lastSubhead" style={{ color: last?.subheadColor || "#6B7280" }}>
                          {normalizeMultiline(last?.subhead).map((line, idx) => (
                            <div key={idx}>{line}</div>
                          ))}
                        </div>
                      ) : null}

                      {last?.logoImage?.objectUrl ? (
                        <div className="lastLogoWrap">
                          <img
                            className="lastLogo"
                            src={last.logoImage.objectUrl}
                            alt={last.logoImage.fileName ? `Logo: ${last.logoImage.fileName}` : "Logo"}
                          />
                        </div>
                      ) : null}

                      <div className="lastMicro" style={{ color: "rgba(17,24,39,0.48)" }}>
                        Ocean Professional • Global Last Page
                      </div>
                    </div>
                  </div>

                  <div className="lastAccentRow" aria-hidden="true">
                    <span className="lastAccentSq" style={{ background: last?.accentColor || "#2563EB" }} />
                    <span className="lastAccentSq" style={{ background: "#F59E0B" }} />
                    <span className="lastAccentSq" style={{ background: "#111827" }} />
                    <span className="lastAccentSq" style={{ background: "rgba(17,24,39,0.25)" }} />
                  </div>
                </div>
              </div>
            ) : mode === "skillFactorySlide1" ? (
              <div className="sfPreviewFrame" aria-label="Skill Factory Slide 1 preview">
                <div className="sfPreviewBg">
                  <div className="sfHeader">
                    <div className="sfHeaderLeft">
                      <div className="sfHeaderTitle">{sf1?.factoryName?.trim() ? sf1.factoryName : "Skill Factory name"}</div>
                    </div>
                    <div className="sfHeaderRight">
                      <div className="sfHeaderSprint">{sf1?.sprintLabel?.trim() ? sf1.sprintLabel : "Sprint label / date"}</div>
                    </div>
                  </div>

                  <div className="sfBody">
                    <div className="sfTopGrid">
                      <section className="sfPanel">
                        <div className="sfPanelHeader">
                          <div className="sfPanelTitle">PROJECT HIGHLIGHTS</div>
                          <div className="sfPanelBar" aria-hidden="true" />
                        </div>
                        <ul className="sfList">
                          {(sf1?.highlights || []).map((t, idx) =>
                            (t || "").trim() ? (
                              <li key={idx} className="sfListItem">
                                {t}
                              </li>
                            ) : null
                          )}
                          {(sf1?.highlights || []).map((t) => (t || "").trim()).filter(Boolean).length === 0 ? (
                            <li className="sfListItem sfListMuted">Add highlights in the editor.</li>
                          ) : null}
                        </ul>
                      </section>

                      <section className="sfPanel">
                        <div className="sfPanelHeader">
                          <div className="sfPanelTitle">PROJECT LOWLIGHTS</div>
                          <div className="sfPanelBar" aria-hidden="true" />
                        </div>
                        <ul className="sfList">
                          {(sf1?.lowlights || []).map((t, idx) =>
                            (t || "").trim() ? (
                              <li key={idx} className="sfListItem">
                                {t}
                              </li>
                            ) : null
                          )}
                          {(sf1?.lowlights || []).map((t) => (t || "").trim()).filter(Boolean).length === 0 ? (
                            <li className="sfListItem sfListMuted">Add lowlights in the editor.</li>
                          ) : null}
                        </ul>
                      </section>

                      <section className="sfPanel sfTeamPanel">
                        <div className="sfPanelHeader">
                          <div className="sfPanelTitle">TEAM MEMBERS</div>
                          <div className="sfPanelBar" aria-hidden="true" />
                        </div>

                        <div className="sfTableWrap">
                          <table className="sfTable" aria-label="Team members">
                            <thead>
                              <tr>
                                <th>Name</th>
                                <th>Role</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(sf1?.teamMembers || []).slice(0, 6).map((m, idx) => (
                                <tr key={idx}>
                                  <td>{m?.name?.trim() ? m.name : "—"}</td>
                                  <td>{m?.role?.trim() ? m.role : "—"}</td>
                                </tr>
                              ))}
                              {(sf1?.teamMembers || []).length === 0 ? (
                                <tr>
                                  <td colSpan={2} className="sfTableEmpty">
                                    Add team members in the editor.
                                  </td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    </div>

                    <div className="sfBottomGrid">
                      <section className="sfPanel">
                        <div className="sfPanelHeader">
                          <div className="sfPanelTitle">Key Activities completed in previous week</div>
                          <div className="sfPanelBar" aria-hidden="true" />
                        </div>
                        <ul className="sfList">
                          {(sf1?.prevWeekActivities || []).map((t, idx) =>
                            (t || "").trim() ? (
                              <li key={idx} className="sfListItem">
                                {t}
                              </li>
                            ) : null
                          )}
                          {(sf1?.prevWeekActivities || []).map((t) => (t || "").trim()).filter(Boolean).length === 0 ? (
                            <li className="sfListItem sfListMuted">Add previous week activities.</li>
                          ) : null}
                        </ul>
                      </section>

                      <section className="sfPanel">
                        <div className="sfPanelHeader">
                          <div className="sfPanelTitle">Key Activities planned for current week</div>
                          <div className="sfPanelBar" aria-hidden="true" />
                        </div>
                        <ul className="sfList">
                          {(sf1?.currentWeekActivities || []).map((t, idx) =>
                            (t || "").trim() ? (
                              <li key={idx} className="sfListItem">
                                {t}
                              </li>
                            ) : null
                          )}
                          {(sf1?.currentWeekActivities || []).map((t) => (t || "").trim()).filter(Boolean).length === 0 ? (
                            <li className="sfListItem sfListMuted">Add current week activities.</li>
                          ) : null}
                        </ul>
                      </section>
                    </div>

                    <div className="sfFooter">
                      <div className="sfFooterLine" aria-hidden="true" />
                      <div className="sfFooterText">Ocean Professional • Skill Factory</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : mode === "skillFactorySlide2" ? (
              <div className="sf2PreviewFrame" aria-label="Skill Factory Slide 2 preview">
                <div className="sf2PreviewBg">
                  <div className="sf2TitleRow">
                    <div className="sf2TitleText">{sf1?.factoryName?.trim() ? sf1.factoryName : "Skill Factory"}</div>
                  </div>

                  <div className="sf2Body">
                    {Array.isArray(sf2?.metricsImages) && sf2.metricsImages.length ? (
                      <div className="sf2MasonryPreview" aria-label="Skill Factory Slide 2 masonry preview">
                        {(sf2.metricsImages || []).map((m, idx) => (
                          <div key={`${m.objectUrl || "img"}_${m.fileName || "file"}_${idx}`} className="sf2MasonryPreviewItem">
                            <div className="sf2MasonryPreviewTile">
                              {m?.objectUrl ? (
                                <img className="sf2MasonryPreviewImg" src={m.objectUrl} alt={m.fileName || `Metrics ${idx + 1}`} />
                              ) : (
                                <div className="sf2ImgPlaceholder">
                                  <div className="badge">Upload</div>
                                  <div style={{ marginTop: 8 }}>Metrics #{idx + 1}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="coverUploadEmpty" style={{ marginTop: 10 }}>
                        <div className="badge">Upload</div>
                        <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                          Add metrics images in the editor to populate Skill Factory Slide 2.
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sf2BottomBand" aria-hidden="true" />
                </div>
              </div>
            ) : mode === "skillFactorySlide3" ? (
              <div className="sf3PreviewFrame" aria-label="Skill Factory Slide 3 preview">
                <div className="sf3PreviewBg">
                  <div className="sf3TitleRow">
                    <div className="sf3TitleText">{sf3?.title?.trim() ? sf3.title : "Continuous Assessment"}</div>
                  </div>

                  {Array.isArray(sf3?.columns) && sf3.columns.length ? (
                    <div className="sf3TableWrap">
                      <div className="sf3TableCard">
                        <div className="sf3TableHeaderBand" aria-hidden="true" />
                        <div className="sf3TableInner" role="table" aria-label="Continuous assessment table">
                          <div className="sf3TableHead" role="rowgroup">
                            <div
                              className="sf3Row sf3RowHead"
                              role="row"
                              style={{
                                gridTemplateColumns: `repeat(${sf3.columns.length}, minmax(0, 1fr))`
                              }}
                            >
                              {(sf3.columns || []).map((c, idx) => (
                                <div key={idx} className="sf3Cell sf3CellHead" role="columnheader">
                                  {(c || "").trim() || `Column ${idx + 1}`}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="sf3TableBody" role="rowgroup">
                            {(Array.isArray(sf3?.rows) ? sf3.rows : []).length ? (
                              (sf3.rows || []).slice(0, 6).map((r, idx) => {
                                const row = Array.isArray(r) ? r : [];
                                return (
                                  <div
                                    key={idx}
                                    className="sf3Row"
                                    role="row"
                                    style={{
                                      gridTemplateColumns: `repeat(${sf3.columns.length}, minmax(0, 1fr))`
                                    }}
                                  >
                                    {sf3.columns.map((_c, colIdx) => (
                                      <div key={colIdx} className="sf3Cell" role="cell">
                                        {(row[colIdx] || "").toString().trim() || "—"}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="sf3Empty">
                                <div className="badge">Table</div>
                                <div style={{ marginTop: 8, fontSize: 12, color: "rgba(17,24,39,0.65)", lineHeight: 1.4 }}>
                                  Add rows in the editor to populate Slide 3.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="coverUploadEmpty" style={{ margin: "0 16px", flex: 1 }}>
                      <div className="badge">Table</div>
                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                        Add at least one column header in the editor to start building the table.
                      </div>
                    </div>
                  )}

                  <div className="sf3BottomBand" aria-hidden="true" style={{ background: (sf3?.bottomBandColor || "#2F78A8").toString() }} />
                </div>
              </div>
            ) : mode === "skillFactorySlide4" ? (
              <div className="sf3PreviewFrame" aria-label="Skill Factory Slide 4 preview">
                <div className="sf3PreviewBg">
                  <div className="sf3TitleRow">
                    <div className="sf3TitleText">{sf4?.title?.trim() ? sf4.title : "Feedback & Revised Rating"}</div>
                  </div>

                  {Array.isArray(sf4?.columns) && sf4.columns.length ? (
                    <div className="sf3TableWrap">
                      <div className="sf3TableCard">
                        <div className="sf3TableHeaderBand" aria-hidden="true" />
                        <div className="sf3TableInner" role="table" aria-label="Feedback & revised rating table">
                          <div className="sf3TableHead" role="rowgroup">
                            <div
                              className="sf3Row sf3RowHead"
                              role="row"
                              style={{
                                gridTemplateColumns: `repeat(${sf4.columns.length}, minmax(0, 1fr))`
                              }}
                            >
                              {(sf4.columns || []).map((c, idx) => (
                                <div key={idx} className="sf3Cell sf3CellHead" role="columnheader">
                                  {(c || "").trim() || `Column ${idx + 1}`}
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="sf3TableBody" role="rowgroup">
                            {(Array.isArray(sf4?.rows) ? sf4.rows : []).length ? (
                              (sf4.rows || []).slice(0, 6).map((r, idx) => {
                                const row = Array.isArray(r) ? r : [];
                                return (
                                  <div
                                    key={idx}
                                    className="sf3Row"
                                    role="row"
                                    style={{
                                      gridTemplateColumns: `repeat(${sf4.columns.length}, minmax(0, 1fr))`
                                    }}
                                  >
                                    {sf4.columns.map((_c, colIdx) => (
                                      <div key={colIdx} className="sf3Cell" role="cell">
                                        {(row[colIdx] || "").toString().trim() || "—"}
                                      </div>
                                    ))}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="sf3Empty">
                                <div className="badge">Table</div>
                                <div style={{ marginTop: 8, fontSize: 12, color: "rgba(17,24,39,0.65)", lineHeight: 1.4 }}>
                                  Add rows in the editor to populate Slide 4.
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="coverUploadEmpty" style={{ margin: "0 16px", flex: 1 }}>
                      <div className="badge">Table</div>
                      <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                        Add at least one column header in the editor to start building the table.
                      </div>
                    </div>
                  )}

                  <div className="sf3BottomBand" aria-hidden="true" style={{ background: (sf4?.bottomBandColor || "#2F78A8").toString() }} />
                </div>
              </div>
            ) : (
              // Normal slide preview
              <div className="previewCanvas" style={{ background: preset.previewGradient, position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: preset.background,
                    opacity: 0.94
                  }}
                />

                <div
                  className="previewSlideGrid"
                  style={{
                    color: slide.theme?.textColor || preset.text
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div className="previewSlideTitle">{slide.title?.trim() ? slide.title : "Untitled slide"}</div>

                    {slide.subtitle?.trim() ? <div className="previewSlideSubtitle">{slide.subtitle}</div> : null}

                    <ul className="previewBullets">
                      {(slide.bullets || [])
                        .map((b) => (b || "").trim())
                        .filter(Boolean)
                        .slice(0, 8)
                        .map((b, idx) => (
                          <li key={idx} className="previewBullet">
                            {b}
                          </li>
                        ))}
                    </ul>

                    {(slide.bullets || []).map((b) => (b || "").trim()).filter(Boolean).length === 0 ? (
                      <div style={{ marginTop: 14, fontSize: 13, opacity: 0.75 }}>Add bullet points in the editor to populate this area.</div>
                    ) : null}
                  </div>

                  <div style={{ display: "grid", gap: 10, alignContent: "start" }}>
                    {slide.image?.objectUrl ? (
                      <div className="previewPanel">
                        <img
                          src={slide.image.objectUrl}
                          alt={slide.image.fileName ? `Slide image: ${slide.image.fileName}` : "Slide image"}
                          style={{ display: "block", width: "100%", height: "auto" }}
                        />
                      </div>
                    ) : (
                      <div className="previewPanel">
                        <div className="previewPanelBody">
                          <div className="badge">Optional</div>
                          <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                            Add an image in the editor to show it here.
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="previewPanel">
                      <div className="previewPanelBody">
                        <div className="previewSmallLabel">Theme</div>
                        <div className="previewThemeMeta">
                          Background: <strong>{preset.label}</strong>
                          <br />
                          Text: <strong>{slide.theme?.textColor || preset.text}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
