import React, { useMemo } from "react";
import { THEME_PRESETS } from "../utils/slideModel";

function normalizeMultiline(text) {
  return (text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

// PUBLIC_INTERFACE
export default function SlidePreview({ mode = "slide", cover, last, slide, skillFactory, slideIndex, totalSlides }) {
  /** Center preview "canvas" for the selected item (Global Cover, Global Last Page, Skill Factory Slide 1, or a regular slide). */
  const preset = useMemo(() => {
    const pid = slide?.theme?.backgroundPresetId || "surface";
    return THEME_PRESETS[pid] || THEME_PRESETS.surface;
  }, [slide?.theme?.backgroundPresetId]);

  const sf1 = skillFactory?.slides?.slide1;

  // Empty state
  if (mode !== "cover" && mode !== "last" && !slide) {
    return (
      <section className="card" aria-label="Slide preview">
        <div className="cardHeader">
          <h2 className="cardTitle">Preview</h2>
          <p className="cardHint">Nothing selected yet.</p>
        </div>
        <div className="cardBody">
          <div
            style={{
              borderRadius: 16,
              border: "1px dashed rgba(17,24,39,0.20)",
              padding: 18,
              background: "rgba(37,99,235,0.04)"
            }}
          >
            <div className="badge">Preview</div>
            <p style={{ margin: "10px 0 0 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Select a slide from the left to see a live preview here.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const headerLabel = mode === "cover" ? "Cover Preview" : "Preview";

  return (
    <section className="card" aria-label="Slide preview">
      <div className="cardHeader">
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <h2 className="cardTitle">{headerLabel}</h2>
          <span className="kbdHint" aria-label="Slide position">
            Slide {slideIndex + 1} of {totalSlides}
          </span>
        </div>
        <p className="cardHint">This is an on-screen approximation of the exported layout.</p>
      </div>

      <div className="cardBody">
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

                  <div className="coverCornerAccent" aria-hidden="true" />
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

              {/* Soft white wash to match the bright screenshot */}
              <div className="lastPreviewWash" aria-hidden="true" />

              {/* Centered lockup */}
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

              {/* Accent squares like the reference (small colorful blocks) */}
              <div
                className="lastAccentRow"
                aria-hidden="true"
                style={{
                  "--lastAccent": last?.accentColor || "#2563EB"
                }}
              >
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
                      {((sf1?.highlights || []).map((t) => (t || "").trim()).filter(Boolean).length === 0) ? (
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
                      {((sf1?.lowlights || []).map((t) => (t || "").trim()).filter(Boolean).length === 0) ? (
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
                          {((sf1?.teamMembers || []).length === 0) ? (
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
                      {((sf1?.prevWeekActivities || []).map((t) => (t || "").trim()).filter(Boolean).length === 0) ? (
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
                      {((sf1?.currentWeekActivities || []).map((t) => (t || "").trim()).filter(Boolean).length === 0) ? (
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
        ) : (
          // Normal slide preview (existing)
          <div
            style={{
              width: "100%",
              aspectRatio: "16 / 9",
              borderRadius: 18,
              border: "1px solid rgba(17,24,39,0.12)",
              overflow: "hidden",
              background: preset.previewGradient,
              position: "relative",
              boxShadow: "0 20px 45px rgba(17,24,39,0.08)",
              transition: "transform 200ms ease, box-shadow 200ms ease"
            }}
          >
            {/* Inner surface mimicking slide background */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: preset.background,
                opacity: 0.92
              }}
            />

            <div
              style={{
                position: "absolute",
                inset: 0,
                padding: 24,
                color: slide.theme?.textColor || preset.text,
                display: "grid",
                gridTemplateColumns: "1.25fr 0.75fr",
                gap: 18
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                  {slide.title?.trim() ? slide.title : "Untitled slide"}
                </div>
                {slide.subtitle?.trim() ? (
                  <div style={{ marginTop: 10, fontSize: 15, opacity: 0.9, lineHeight: 1.3 }}>{slide.subtitle}</div>
                ) : null}

                <ul style={{ marginTop: 16, paddingLeft: 18, display: "grid", gap: 8 }}>
                  {(slide.bullets || [])
                    .map((b) => (b || "").trim())
                    .filter(Boolean)
                    .slice(0, 8)
                    .map((b, idx) => (
                      <li key={idx} style={{ fontSize: 14, lineHeight: 1.35, opacity: 0.95 }}>
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
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px solid rgba(17,24,39,0.12)",
                      overflow: "hidden",
                      background: "rgba(17,24,39,0.04)"
                    }}
                  >
                    <img
                      src={slide.image.objectUrl}
                      alt={slide.image.fileName ? `Slide image: ${slide.image.fileName}` : "Slide image"}
                      style={{ display: "block", width: "100%", height: "auto" }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      borderRadius: 14,
                      border: "1px dashed rgba(17,24,39,0.18)",
                      padding: 14,
                      background: "rgba(37,99,235,0.06)"
                    }}
                  >
                    <div className="badge">Optional</div>
                    <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                      Add an image in the editor to show it here.
                    </div>
                  </div>
                )}

                <div
                  style={{
                    borderRadius: 14,
                    border: "1px solid rgba(17,24,39,0.10)",
                    padding: 12,
                    background: "rgba(255,255,255,0.55)",
                    color: "#111827"
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 800 }}>Theme</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: "#6b7280", lineHeight: 1.4 }}>
                    Background: <strong>{preset.label}</strong>
                    <br />
                    Text: <strong>{slide.theme?.textColor || preset.text}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Small corner mark */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                right: 14,
                bottom: 14,
                width: 12,
                height: 12,
                borderRadius: 999,
                background: "rgba(245,158,11,0.95)",
                boxShadow: "0 6px 20px rgba(245,158,11,0.25)"
              }}
            />
          </div>
        )}
      </div>
    </section>
  );
}
