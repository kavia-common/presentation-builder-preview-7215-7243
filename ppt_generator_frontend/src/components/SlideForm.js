import React, { useId, useMemo, useRef } from "react";
import { THEME_PRESETS } from "../utils/slideModel";

function ColorSwatch({ color, selected, onClick, label }) {
  return (
    <button
      type="button"
      className="btn btnGhost btnSmall"
      onClick={onClick}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      style={{
        padding: 6,
        borderRadius: 999,
        borderColor: selected ? "rgba(37,99,235,0.55)" : "rgba(17,24,39,0.12)",
        boxShadow: selected ? "0 0 0 3px rgba(37,99,235,0.20)" : "none"
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 18,
          height: 18,
          borderRadius: 999,
          background: color,
          border: "1px solid rgba(17,24,39,0.12)"
        }}
      />
    </button>
  );
}

// PUBLIC_INTERFACE
export default function SlideForm({
  mode = "slide",
  slide,
  onChange,
  cover,
  onCoverChange,
  last,
  onLastChange,
  skillFactory,
  onSkillFactorySlide1Change
}) {
  /** Form used to edit the currently selected slide OR pinned Global Cover OR pinned Global Last Page OR Skill Factory Slide 1. */
  const titleId = useId();
  const subtitleId = useId();
  const taglineId = useId();
  const fileInputRef = useRef(null);

  // Global Last Page editor ids/refs MUST be defined unconditionally (rules-of-hooks).
  const lastHeadlineId = useId();
  const lastSubheadId = useId();
  const lastBrandId = useId();
  const lastLogoInputRef = useRef(null);
  const lastBgInputRef = useRef(null);

  // Skill Factory Slide 1 editor ids MUST be defined unconditionally (rules-of-hooks).
  const sfFactoryNameId = useId();
  const sfSprintLabelId = useId();
  const sfHighlightsSeedId = useId();
  const sfLowlightsSeedId = useId();
  const sfPrevWeekSeedId = useId();
  const sfCurrentWeekSeedId = useId();

  const preset = useMemo(() => {
    const pid = slide?.theme?.backgroundPresetId || "surface";
    return THEME_PRESETS[pid] || THEME_PRESETS.surface;
  }, [slide?.theme?.backgroundPresetId]);

  // ---- Global Cover editor ----
  if (mode === "cover") {
    if (!cover) {
      return (
        <section className="card" aria-label="Cover editor">
          <div className="cardHeader">
            <h2 className="cardTitle">Global Cover</h2>
            <p className="cardHint">Cover data not available.</p>
          </div>
          <div className="cardBody">
            <div className="helper helperError">Unable to load global cover state.</div>
          </div>
        </section>
      );
    }

    const updateCover = (patch) => onCoverChange({ ...cover, ...patch });

    const onPickCoverImage = async (file) => {
      if (!file) return;

      // Revoke previous object URL if present to avoid memory leaks.
      if (cover.backgroundImage?.objectUrl) URL.revokeObjectURL(cover.backgroundImage.objectUrl);

      const objectUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = () => {
        updateCover({
          backgroundImage: {
            objectUrl,
            fileName: file.name,
            width: img.naturalWidth,
            height: img.naturalHeight
          }
        });
      };
      img.onerror = () => {
        updateCover({
          backgroundImage: {
            objectUrl,
            fileName: file.name,
            width: 0,
            height: 0
          }
        });
      };
      img.src = objectUrl;
    };

    const clearCoverImage = () => {
      if (cover.backgroundImage?.objectUrl) URL.revokeObjectURL(cover.backgroundImage.objectUrl);
      if (fileInputRef.current) fileInputRef.current.value = "";
      updateCover({
        backgroundImage: { objectUrl: "", fileName: "", width: 0, height: 0 }
      });
    };

    return (
      <section className="card" aria-label="Cover editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Global Cover</h2>
          <p className="cardHint">This is slide 1 and cannot be deleted or reordered.</p>
        </div>

        <div className="cardBody">
          <div className="row">
            <div>
              <label className="label" htmlFor={titleId}>
                Cover title
              </label>
              <input
                id={titleId}
                className="input"
                value={cover.title}
                onChange={(e) => updateCover({ title: e.target.value })}
                placeholder="e.g., TATA ELXSI"
              />
              <div className="helper">Bold headline shown on the cover.</div>
            </div>

            <div>
              <label className="label" htmlFor={subtitleId}>
                Subtitle
              </label>
              <input
                id={subtitleId}
                className="input"
                value={cover.subtitle}
                onChange={(e) => updateCover({ subtitle: e.target.value })}
                placeholder="e.g., Name : Subrata B"
              />
            </div>

            <div>
              <label className="label" htmlFor={taglineId}>
                Tagline / supporting text
              </label>
              <textarea
                id={taglineId}
                className="textarea"
                value={cover.tagline}
                onChange={(e) => updateCover({ tagline: e.target.value })}
                placeholder={"e.g., Date : 2 Dec 2023\nDigital KRG Weekly Metrics"}
              />
              <div className="helper">Supports multiple lines (use line breaks).</div>
            </div>

            <div className="divider" />

            <div className="row2">
              <div>
                <div className="label">Primary color</div>
                <input
                  className="input"
                  type="color"
                  value={cover.primaryColor || "#2563EB"}
                  onChange={(e) => updateCover({ primaryColor: e.target.value })}
                  aria-label="Primary color"
                  style={{ padding: 6, height: 42 }}
                />
                <div className="helper">Used for the Ocean Professional overlay.</div>
              </div>

              <div>
                <div className="label">Secondary color</div>
                <input
                  className="input"
                  type="color"
                  value={cover.secondaryColor || "#F59E0B"}
                  onChange={(e) => updateCover({ secondaryColor: e.target.value })}
                  aria-label="Secondary color"
                  style={{ padding: 6, height: 42 }}
                />
                <div className="helper">Accent used in the overlay blend.</div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span className="label">Cover background image</span>
                {cover.backgroundImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearCoverImage}>
                    Remove
                  </button>
                ) : null}
              </div>

              <input
                ref={fileInputRef}
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => onPickCoverImage(e.target.files?.[0])}
                aria-label="Upload background image for cover (local only)"
              />
              <div className="helper">Local-only: used for preview and PPT export.</div>

              {cover.backgroundImage?.objectUrl ? (
                <div className="coverUploadPreview">
                  <img
                    src={cover.backgroundImage.objectUrl}
                    alt={cover.backgroundImage.fileName ? `Cover background: ${cover.backgroundImage.fileName}` : "Cover background"}
                    className="coverUploadPreviewImg"
                  />
                </div>
              ) : (
                <div className="coverUploadEmpty">
                  <div className="badge">Optional</div>
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                    Add a background photo to match the screenshot’s hero image.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- Global Last Page editor ----
  if (mode === "last") {
    if (!last) {
      return (
        <section className="card" aria-label="Global last page editor">
          <div className="cardHeader">
            <h2 className="cardTitle">Global Last Page</h2>
            <p className="cardHint">Last page data not available.</p>
          </div>
          <div className="cardBody">
            <div className="helper helperError">Unable to load global last page state.</div>
          </div>
        </section>
      );
    }

    const updateLast = (patch) => onLastChange?.({ ...last, ...patch });

    const onPickLastLogo = async (file) => {
      if (!file) return;
      if (last.logoImage?.objectUrl) URL.revokeObjectURL(last.logoImage.objectUrl);
      const objectUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = () => {
        updateLast({
          logoImage: { objectUrl, fileName: file.name, width: img.naturalWidth, height: img.naturalHeight }
        });
      };
      img.onerror = () => {
        updateLast({
          logoImage: { objectUrl, fileName: file.name, width: 0, height: 0 }
        });
      };
      img.src = objectUrl;
    };

    const clearLastLogo = () => {
      if (last.logoImage?.objectUrl) URL.revokeObjectURL(last.logoImage.objectUrl);
      if (lastLogoInputRef.current) lastLogoInputRef.current.value = "";
      updateLast({ logoImage: { objectUrl: "", fileName: "", width: 0, height: 0 } });
    };

    const onPickLastBg = async (file) => {
      if (!file) return;
      if (last.backgroundImage?.objectUrl) URL.revokeObjectURL(last.backgroundImage.objectUrl);
      const objectUrl = URL.createObjectURL(file);

      const img = new Image();
      img.onload = () => {
        updateLast({
          backgroundImage: { objectUrl, fileName: file.name, width: img.naturalWidth, height: img.naturalHeight }
        });
      };
      img.onerror = () => {
        updateLast({
          backgroundImage: { objectUrl, fileName: file.name, width: 0, height: 0 }
        });
      };
      img.src = objectUrl;
    };

    const clearLastBg = () => {
      if (last.backgroundImage?.objectUrl) URL.revokeObjectURL(last.backgroundImage.objectUrl);
      if (lastBgInputRef.current) lastBgInputRef.current.value = "";
      updateLast({ backgroundImage: { objectUrl: "", fileName: "", width: 0, height: 0 } });
    };

    return (
      <section className="card" aria-label="Global last page editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Global Last Page</h2>
          <p className="cardHint">This slide is always last and cannot be deleted or reordered.</p>
        </div>

        <div className="cardBody">
          <div className="row">
            <div>
              <label className="label" htmlFor={lastHeadlineId}>
                Headline
              </label>
              <input
                id={lastHeadlineId}
                className="input"
                value={last.headline}
                onChange={(e) => updateLast({ headline: e.target.value })}
                placeholder="e.g., THANK YOU"
              />
              <div className="helper">Large centered closing headline.</div>
            </div>

            <div>
              <label className="label" htmlFor={lastBrandId}>
                Brand / tagline (line under headline)
              </label>
              <input
                id={lastBrandId}
                className="input"
                value={last.tagline}
                onChange={(e) => updateLast({ tagline: e.target.value })}
                placeholder="e.g., TATA ELXSI"
              />
            </div>

            <div>
              <label className="label" htmlFor={lastSubheadId}>
                Supporting text (multi-line)
              </label>
              <textarea
                id={lastSubheadId}
                className="textarea"
                value={last.subhead}
                onChange={(e) => updateLast({ subhead: e.target.value })}
                placeholder={"e.g., FIND OUT MORE\nhttps://example.com"}
              />
              <div className="helper">Use line breaks for stacked text, like the reference image.</div>
            </div>

            <div className="divider" />

            <div className="row2">
              <div>
                <div className="label">Background color</div>
                <input
                  className="input"
                  type="color"
                  value={last.backgroundColor || "#FFFFFF"}
                  onChange={(e) => updateLast({ backgroundColor: e.target.value })}
                  aria-label="Last page background color"
                  style={{ padding: 6, height: 42 }}
                />
              </div>

              <div>
                <div className="label">Accent / brand color</div>
                <input
                  className="input"
                  type="color"
                  value={last.accentColor || "#2563EB"}
                  onChange={(e) => updateLast({ accentColor: e.target.value })}
                  aria-label="Last page accent color"
                  style={{ padding: 6, height: 42 }}
                />
                <div className="helper">Used for the brand line and accent marks.</div>
              </div>

              <div>
                <div className="label">Headline color</div>
                <input
                  className="input"
                  type="color"
                  value={last.headlineColor || "#111827"}
                  onChange={(e) => updateLast({ headlineColor: e.target.value })}
                  aria-label="Last page headline color"
                  style={{ padding: 6, height: 42 }}
                />
              </div>

              <div>
                <div className="label">Supporting text color</div>
                <input
                  className="input"
                  type="color"
                  value={last.subheadColor || "#6B7280"}
                  onChange={(e) => updateLast({ subheadColor: e.target.value })}
                  aria-label="Last page supporting text color"
                  style={{ padding: 6, height: 42 }}
                />
              </div>
            </div>

            <div className="divider" />

            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span className="label">Optional logo</span>
                {last.logoImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearLastLogo}>
                    Remove
                  </button>
                ) : null}
              </div>

              <input
                ref={lastLogoInputRef}
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => onPickLastLogo(e.target.files?.[0])}
                aria-label="Upload logo for Global Last Page (local only)"
              />
              <div className="helper">Local-only: used for preview and PPT export.</div>

              {last.logoImage?.objectUrl ? (
                <div className="coverUploadPreview">
                  <img
                    src={last.logoImage.objectUrl}
                    alt={last.logoImage.fileName ? `Logo: ${last.logoImage.fileName}` : "Logo"}
                    className="coverUploadPreviewImg"
                  />
                </div>
              ) : (
                <div className="coverUploadEmpty">
                  <div className="badge">Optional</div>
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                    Upload a logo if you want it centered below the text.
                  </div>
                </div>
              )}
            </div>

            <div className="divider" />

            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span className="label">Optional background image</span>
                {last.backgroundImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearLastBg}>
                    Remove
                  </button>
                ) : null}
              </div>

              <input
                ref={lastBgInputRef}
                className="input"
                type="file"
                accept="image/*"
                onChange={(e) => onPickLastBg(e.target.files?.[0])}
                aria-label="Upload background image for Global Last Page (local only)"
              />
              <div className="helper">Local-only: used for preview and PPT export.</div>

              {last.backgroundImage?.objectUrl ? (
                <div className="coverUploadPreview">
                  <img
                    src={last.backgroundImage.objectUrl}
                    alt={last.backgroundImage.fileName ? `Background: ${last.backgroundImage.fileName}` : "Background"}
                    className="coverUploadPreviewImg"
                  />
                </div>
              ) : (
                <div className="coverUploadEmpty">
                  <div className="badge">Optional</div>
                  <div style={{ marginTop: 10, fontSize: 12, opacity: 0.85, lineHeight: 1.4 }}>
                    Add a subtle architectural/brand image like the reference.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- Skill Factory Slide 1 editor ----
  if (mode === "skillFactorySlide1") {
    const slide1 = skillFactory?.slides?.slide1;

    if (!slide1) {
      return (
        <section className="card" aria-label="Skill Factory Slide 1 editor">
          <div className="cardHeader">
            <h2 className="cardTitle">Skill Factory – Slide 1</h2>
            <p className="cardHint">Skill Factory data not available.</p>
          </div>
          <div className="cardBody">
            <div className="helper helperError">Unable to load Skill Factory Slide 1 state.</div>
          </div>
        </section>
      );
    }

    const update = (patch) => onSkillFactorySlide1Change?.({ ...slide1, ...patch });

    const ensureMinOne = (arr) => {
      const safe = Array.isArray(arr) ? arr : [];
      return safe.length ? safe : [""];
    };

    const updateBulletListItem = (key, idx, value) => {
      const next = [...ensureMinOne(slide1[key])];
      next[idx] = value;
      update({ [key]: next });
    };

    const addBulletListItem = (key) => update({ [key]: [...ensureMinOne(slide1[key]), ""] });

    const removeBulletListItem = (key, idx) => {
      const next = [...ensureMinOne(slide1[key])];
      next.splice(idx, 1);
      update({ [key]: next.length ? next : [""] });
    };

    const team = Array.isArray(slide1.teamMembers) ? slide1.teamMembers : [];
    const updateTeamMember = (idx, patch) => {
      const next = team.map((m, i) => (i === idx ? { ...m, ...patch } : m));
      update({ teamMembers: next });
    };

    const addTeamMember = () => update({ teamMembers: [...team, { name: "", role: "" }] });

    const removeTeamMember = (idx) => {
      const next = [...team];
      next.splice(idx, 1);
      update({ teamMembers: next.length ? next : [{ name: "", role: "" }] });
    };

    return (
      <section className="card" aria-label="Skill Factory Slide 1 editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Skill Factory – Slide 1</h2>
          <p className="cardHint">Update fields for highlights, lowlights, team, and weekly activities.</p>
        </div>

        <div className="cardBody">
          <div className="row">
            <div className="row2">
              <div>
                <label className="label" htmlFor={sfFactoryNameId}>
                  Skill Factory name
                </label>
                <input
                  id={sfFactoryNameId}
                  className="input"
                  value={slide1.factoryName || ""}
                  onChange={(e) => update({ factoryName: e.target.value })}
                  placeholder="e.g., Digital Applications: Data Engineering Skill Factory"
                />
              </div>

              <div>
                <label className="label" htmlFor={sfSprintLabelId}>
                  Sprint label / date
                </label>
                <input
                  id={sfSprintLabelId}
                  className="input"
                  value={slide1.sprintLabel || ""}
                  onChange={(e) => update({ sprintLabel: e.target.value })}
                  placeholder="e.g., Sprint 12 (25-Dec - 01-Jan)"
                />
              </div>
            </div>

            <div className="divider" />

            <div className="row2">
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span className="label">Project highlights</span>
                  <button type="button" className="btn btnSmall btnSecondary" onClick={() => addBulletListItem("highlights")}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {ensureMinOne(slide1.highlights).map((b, idx) => (
                    <div key={`${sfHighlightsSeedId}_${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                      <input
                        className="input"
                        value={b}
                        onChange={(e) => updateBulletListItem("highlights", idx, e.target.value)}
                        placeholder={`Highlight ${idx + 1}`}
                        aria-label={`Highlight ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => removeBulletListItem("highlights", idx)}
                        disabled={ensureMinOne(slide1.highlights).length <= 1}
                        aria-label={`Remove highlight ${idx + 1}`}
                        title="Remove"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span className="label">Project lowlights</span>
                  <button type="button" className="btn btnSmall btnSecondary" onClick={() => addBulletListItem("lowlights")}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {ensureMinOne(slide1.lowlights).map((b, idx) => (
                    <div key={`${sfLowlightsSeedId}_${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                      <input
                        className="input"
                        value={b}
                        onChange={(e) => updateBulletListItem("lowlights", idx, e.target.value)}
                        placeholder={`Lowlight ${idx + 1}`}
                        aria-label={`Lowlight ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => removeBulletListItem("lowlights", idx)}
                        disabled={ensureMinOne(slide1.lowlights).length <= 1}
                        aria-label={`Remove lowlight ${idx + 1}`}
                        title="Remove"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="divider" />

            <div>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                <span className="label">Team members</span>
                <button type="button" className="btn btnSmall btnSecondary" onClick={addTeamMember}>
                  + Add row
                </button>
              </div>

              <div style={{ marginTop: 10, overflowX: "auto" }}>
                <table className="sfEditorTable" aria-label="Team members table">
                  <thead>
                    <tr>
                      <th style={{ width: "45%" }}>Name</th>
                      <th style={{ width: "45%" }}>Role</th>
                      <th style={{ width: "10%" }} aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {team.map((m, idx) => (
                      <tr key={idx}>
                        <td>
                          <input
                            className="input"
                            value={m?.name || ""}
                            onChange={(e) => updateTeamMember(idx, { name: e.target.value })}
                            placeholder="Name"
                            aria-label={`Team member ${idx + 1} name`}
                          />
                        </td>
                        <td>
                          <input
                            className="input"
                            value={m?.role || ""}
                            onChange={(e) => updateTeamMember(idx, { role: e.target.value })}
                            placeholder="Role"
                            aria-label={`Team member ${idx + 1} role`}
                          />
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn btnSmall btnGhost"
                            onClick={() => removeTeamMember(idx)}
                            aria-label={`Remove team member ${idx + 1}`}
                            title="Remove row"
                          >
                            −
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="helper">Tip: keep 3–6 rows for best slide density.</div>
              </div>
            </div>

            <div className="divider" />

            <div className="row2">
              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span className="label">Key activities completed (previous week)</span>
                  <button type="button" className="btn btnSmall btnSecondary" onClick={() => addBulletListItem("prevWeekActivities")}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {ensureMinOne(slide1.prevWeekActivities).map((b, idx) => (
                    <div key={`${sfPrevWeekSeedId}_${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                      <input
                        className="input"
                        value={b}
                        onChange={(e) => updateBulletListItem("prevWeekActivities", idx, e.target.value)}
                        placeholder={`Activity ${idx + 1}`}
                        aria-label={`Previous week activity ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => removeBulletListItem("prevWeekActivities", idx)}
                        disabled={ensureMinOne(slide1.prevWeekActivities).length <= 1}
                        aria-label={`Remove previous week activity ${idx + 1}`}
                        title="Remove"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
                  <span className="label">Key activities planned (current week)</span>
                  <button type="button" className="btn btnSmall btnSecondary" onClick={() => addBulletListItem("currentWeekActivities")}>
                    + Add
                  </button>
                </div>
                <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                  {ensureMinOne(slide1.currentWeekActivities).map((b, idx) => (
                    <div key={`${sfCurrentWeekSeedId}_${idx}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                      <input
                        className="input"
                        value={b}
                        onChange={(e) => updateBulletListItem("currentWeekActivities", idx, e.target.value)}
                        placeholder={`Planned activity ${idx + 1}`}
                        aria-label={`Current week activity ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => removeBulletListItem("currentWeekActivities", idx)}
                        disabled={ensureMinOne(slide1.currentWeekActivities).length <= 1}
                        aria-label={`Remove current week activity ${idx + 1}`}
                        title="Remove"
                      >
                        −
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="helper">
              Slide preview updates live. Export will place Skill Factory slides after the Global Cover.
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ---- Normal slide editor (existing behavior) ----
  if (!slide) {
    return (
      <section className="card" aria-label="Slide editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Editor</h2>
          <p className="cardHint">Select a slide to start editing.</p>
        </div>
        <div className="cardBody">
          <div className="badge">Tip</div>
          <p style={{ margin: "10px 0 0 0", color: "#6b7280", fontSize: 13, lineHeight: 1.5 }}>
            Use the slide list to add/select a slide, then edit content here.
          </p>
        </div>
      </section>
    );
  }

  const update = (patch) => onChange({ ...slide, ...patch });

  const updateBullet = (idx, value) => {
    const next = [...(slide.bullets || [])];
    next[idx] = value;
    update({ bullets: next });
  };

  const addBullet = () => update({ bullets: [...(slide.bullets || []), ""] });

  const removeBullet = (idx) => {
    const next = [...(slide.bullets || [])];
    next.splice(idx, 1);
    update({ bullets: next.length ? next : [""] });
  };

  const onPickImage = async (file) => {
    if (!file) return;

    // Revoke previous object URL if present to avoid memory leaks.
    if (slide.image?.objectUrl) URL.revokeObjectURL(slide.image.objectUrl);

    const objectUrl = URL.createObjectURL(file);

    // Determine dimensions for export sizing.
    const img = new Image();
    img.onload = () => {
      update({
        image: {
          objectUrl,
          fileName: file.name,
          width: img.naturalWidth,
          height: img.naturalHeight
        }
      });
    };
    img.onerror = () => {
      update({
        image: {
          objectUrl,
          fileName: file.name,
          width: 0,
          height: 0
        }
      });
    };
    img.src = objectUrl;
  };

  const clearImage = () => {
    if (slide.image?.objectUrl) URL.revokeObjectURL(slide.image.objectUrl);
    if (fileInputRef.current) fileInputRef.current.value = "";
    update({
      image: { objectUrl: "", fileName: "", width: 0, height: 0 }
    });
  };

  const bgOptions = Object.values(THEME_PRESETS);

  return (
    <section className="card" aria-label="Slide editor">
      <div className="cardHeader">
        <h2 className="cardTitle">Editor</h2>
        <p className="cardHint">Update the slide content and theme. Changes reflect instantly in preview.</p>
      </div>

      <div className="cardBody">
        <div className="row">
          <div>
            <label className="label" htmlFor={titleId}>
              Slide title <span aria-hidden="true" style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id={titleId}
              className="input"
              value={slide.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder="e.g., Quarterly Results"
              required
            />
            <div className="helper">Required for export.</div>
          </div>

          <div>
            <label className="label" htmlFor={subtitleId}>
              Subtitle
            </label>
            <input
              id={subtitleId}
              className="input"
              value={slide.subtitle}
              onChange={(e) => update({ subtitle: e.target.value })}
              placeholder="e.g., Highlights and next steps"
            />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <span className="label">Bullet points</span>
              <button type="button" className="btn btnSmall btnSecondary" onClick={addBullet}>
                + Add bullet
              </button>
            </div>

            <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
              {(slide.bullets || []).map((b, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8 }}>
                  <input
                    className="input"
                    value={b}
                    onChange={(e) => updateBullet(idx, e.target.value)}
                    placeholder={`Bullet ${idx + 1}`}
                    aria-label={`Bullet ${idx + 1}`}
                  />
                  <button
                    type="button"
                    className="btn btnSmall btnGhost"
                    onClick={() => removeBullet(idx)}
                    aria-label={`Remove bullet ${idx + 1}`}
                    title="Remove bullet"
                    disabled={(slide.bullets || []).length <= 1}
                  >
                    −
                  </button>
                </div>
              ))}
            </div>

            <div className="helper">Tip: leave bullet empty to omit it from export.</div>
          </div>

          <div className="divider" />

          <div className="row2">
            <div>
              <div className="label">Background</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {bgOptions.map((opt) => (
                  <ColorSwatch
                    key={opt.id}
                    color={opt.background}
                    selected={slide.theme?.backgroundPresetId === opt.id}
                    onClick={() =>
                      update({
                        theme: {
                          ...slide.theme,
                          backgroundPresetId: opt.id
                        }
                      })
                    }
                    label={`Background: ${opt.label}`}
                  />
                ))}
              </div>
              <div className="helper">
                Selected: <strong>{preset.label}</strong>
              </div>
            </div>

            <div>
              <div className="label">Text color</div>
              <input
                className="input"
                type="color"
                value={slide.theme?.textColor || preset.text}
                onChange={(e) =>
                  update({
                    theme: {
                      ...slide.theme,
                      textColor: e.target.value
                    }
                  })
                }
                aria-label="Text color"
                style={{ padding: 6, height: 42 }}
              />
              <div className="helper">Use darker text on light backgrounds for readability.</div>
            </div>
          </div>

          <div className="divider" />

          <div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
              <span className="label">Optional image</span>
              {slide.image?.objectUrl ? (
                <button type="button" className="btn btnSmall btnGhost" onClick={clearImage}>
                  Remove
                </button>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => onPickImage(e.target.files?.[0])}
              aria-label="Upload image for this slide (local only)"
            />
            <div className="helper">Local-only: your file never leaves your browser.</div>

            {slide.image?.objectUrl ? (
              <div
                style={{
                  marginTop: 10,
                  borderRadius: 14,
                  border: "1px solid rgba(17,24,39,0.12)",
                  overflow: "hidden",
                  background: "rgba(17,24,39,0.02)"
                }}
              >
                <img
                  src={slide.image.objectUrl}
                  alt={slide.image.fileName ? `Preview: ${slide.image.fileName}` : "Uploaded preview"}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
