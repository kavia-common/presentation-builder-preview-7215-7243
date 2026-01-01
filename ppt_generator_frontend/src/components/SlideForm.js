import React, { useId, useMemo, useRef, useState } from "react";
import { THEME_PRESETS } from "../utils/slideModel";
import MasonryDnD from "./MasonryDnD";

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
        borderColor: selected ? "rgba(37,99,235,0.45)" : "var(--ocean-border)"
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
          border: "1px solid var(--ocean-border)"
        }}
      />
    </button>
  );
}

function Section({ title, hint, defaultOpen = true, actions, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="formSection">
      <button
        type="button"
        className="formSectionHeader"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <div className="formSectionHeaderLeft" style={{ minWidth: 0 }}>
          <div className="formSectionTitleRow">
            <div className="formSectionTitle">{title}</div>
            <span className="formSectionChevron" aria-hidden="true">
              {open ? "▾" : "▸"}
            </span>
          </div>
          {hint ? <div className="formSectionHint">{hint}</div> : null}
        </div>

        {actions ? (
          <div className="formSectionHeaderActions" onClick={(e) => e.stopPropagation()}>
            {actions}
          </div>
        ) : null}
      </button>

      {open ? <div className="formSectionBody">{children}</div> : null}
    </section>
  );
}

function EmptyState({ badge = "Optional", title, description }) {
  return (
    <div className="formEmptyState">
      <div className="badge">{badge}</div>
      {title ? <div className="formEmptyTitle">{title}</div> : null}
      {description ? <div className="formEmptyDesc">{description}</div> : null}
    </div>
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
  onSkillFactorySlide1Change,
  onSkillFactorySlide2Change,
  onSkillFactorySlide3Change
}) {
  /** Form used to edit the currently selected slide OR pinned Global Cover OR pinned Global Last Page OR Skill Factory Slide 1/2/3. */

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

  // Skill Factory Slide 2 editor ids/refs MUST be defined unconditionally (rules-of-hooks).
  const sf2UploadId = useId();
  const sf2FileInputRef = useRef(null);

  // Skill Factory Slide 3 editor ids MUST be defined unconditionally (rules-of-hooks).
  const sf3TitleId = useId();
  const sf3BandColorId = useId();
  const sf3ColSeedId = useId();
  const sf3RowSeedId = useId();

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
          <p className="cardHint">Slide 1. Fixed position (can’t be deleted or reordered).</p>
        </div>

        <div className="cardBody">
          <div className="formStack">
            <Section title="Text" hint="Headline + supporting text shown on the cover." defaultOpen>
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
                    Supporting text (multi-line)
                  </label>
                  <textarea
                    id={taglineId}
                    className="textarea"
                    value={cover.tagline}
                    onChange={(e) => updateCover({ tagline: e.target.value })}
                    placeholder={"e.g., Date : 2 Dec 2023\nDigital KRG Weekly Metrics"}
                  />
                  <div className="helper">Use line breaks for stacked lines.</div>
                </div>
              </div>
            </Section>

            <Section title="Colors" hint="Primary/secondary overlay colors." defaultOpen={false}>
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
            </Section>

            <Section
              title="Background image"
              hint="Local-only: used for preview and PPT export."
              defaultOpen={false}
              actions={
                cover.backgroundImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearCoverImage}>
                    Remove
                  </button>
                ) : null
              }
            >
              <div className="row">
                <div>
                  <input
                    ref={fileInputRef}
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickCoverImage(e.target.files?.[0])}
                    aria-label="Upload background image for cover (local only)"
                  />
                  <div className="helper">Your file never leaves your browser.</div>

                  {cover.backgroundImage?.objectUrl ? (
                    <div className="coverUploadPreview">
                      <img
                        src={cover.backgroundImage.objectUrl}
                        alt={cover.backgroundImage.fileName ? `Cover background: ${cover.backgroundImage.fileName}` : "Cover background"}
                        className="coverUploadPreviewImg"
                      />
                    </div>
                  ) : (
                    <EmptyState badge="Optional" title="No background image" description="Add a background photo if you want a hero-style cover." />
                  )}
                </div>
              </div>
            </Section>
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
          <p className="cardHint">Final slide. Fixed position (can’t be deleted or reordered).</p>
        </div>

        <div className="cardBody">
          <div className="formStack">
            <Section title="Text" hint="Closing headline + supporting lines." defaultOpen>
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
                    Brand line
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
                  <div className="helper">Use line breaks for stacked text.</div>
                </div>
              </div>
            </Section>

            <Section title="Colors" hint="Background + type colors." defaultOpen={false}>
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
            </Section>

            <Section
              title="Logo"
              hint="Local-only: used for preview and PPT export."
              defaultOpen={false}
              actions={
                last.logoImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearLastLogo}>
                    Remove
                  </button>
                ) : null
              }
            >
              <div className="row">
                <div>
                  <input
                    ref={lastLogoInputRef}
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickLastLogo(e.target.files?.[0])}
                    aria-label="Upload logo for Global Last Page (local only)"
                  />
                  <div className="helper">Your file never leaves your browser.</div>

                  {last.logoImage?.objectUrl ? (
                    <div className="coverUploadPreview">
                      <img
                        src={last.logoImage.objectUrl}
                        alt={last.logoImage.fileName ? `Logo: ${last.logoImage.fileName}` : "Logo"}
                        className="coverUploadPreviewImg"
                      />
                    </div>
                  ) : (
                    <EmptyState badge="Optional" title="No logo" description="Upload a logo if you want it centered under the text." />
                  )}
                </div>
              </div>
            </Section>

            <Section
              title="Background image"
              hint="Local-only: used for preview and PPT export."
              defaultOpen={false}
              actions={
                last.backgroundImage?.objectUrl ? (
                  <button type="button" className="btn btnSmall btnGhost" onClick={clearLastBg}>
                    Remove
                  </button>
                ) : null
              }
            >
              <div className="row">
                <div>
                  <input
                    ref={lastBgInputRef}
                    className="input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => onPickLastBg(e.target.files?.[0])}
                    aria-label="Upload background image for Global Last Page (local only)"
                  />
                  <div className="helper">Your file never leaves your browser.</div>

                  {last.backgroundImage?.objectUrl ? (
                    <div className="coverUploadPreview">
                      <img
                        src={last.backgroundImage.objectUrl}
                        alt={last.backgroundImage.fileName ? `Background: ${last.backgroundImage.fileName}` : "Background"}
                        className="coverUploadPreviewImg"
                      />
                    </div>
                  ) : (
                    <EmptyState badge="Optional" title="No background image" description="Add a subtle background image if desired." />
                  )}
                </div>
              </div>
            </Section>
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

    // IMPORTANT: Section header is a <button>, so `actions` must not contain <button>.
    // Use non-button content here to avoid validateDOMNesting warnings in tests.
    const BulletInputs = ({ title, hint, listKey, seedId, defaultOpen = true }) => (
      <Section title={title} hint={hint} defaultOpen={defaultOpen} actions={<span className="kbdHint">Use “Add” below</span>}>
        <div className="formList">
          {ensureMinOne(slide1[listKey]).map((b, idx) => (
            <div key={`${seedId}_${idx}`} className="formListRow">
              <input
                className="input"
                value={b}
                onChange={(e) => updateBulletListItem(listKey, idx, e.target.value)}
                placeholder={`${title} ${idx + 1}`}
                aria-label={`${title} ${idx + 1}`}
              />
              <button
                type="button"
                className="btn btnSmall btnGhost formRowAction"
                onClick={() => removeBulletListItem(listKey, idx)}
                disabled={ensureMinOne(slide1[listKey]).length <= 1}
                aria-label={`Remove ${title.toLowerCase()} ${idx + 1}`}
                title="Remove"
              >
                −
              </button>
            </div>
          ))}
          <button type="button" className="btn btnSmall btnGhost" onClick={() => addBulletListItem(listKey)}>
            + Add item
          </button>
          <div className="helper">Tip: leave an item empty to omit it from export.</div>
        </div>
      </Section>
    );

    return (
      <section className="card" aria-label="Skill Factory Slide 1 editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Skill Factory – Slide 1</h2>
          <p className="cardHint">Highlights, lowlights, team, and weekly activities.</p>
        </div>

        <div className="cardBody">
          <div className="formStack">
            <Section title="Header" hint="Factory title + sprint/date line." defaultOpen>
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
            </Section>

            <BulletInputs title="Project highlights" hint="Key wins and progress for the sprint." listKey="highlights" seedId={sfHighlightsSeedId} defaultOpen />

            <BulletInputs
              title="Project lowlights"
              hint="Risks, blockers, or issues."
              listKey="lowlights"
              seedId={sfLowlightsSeedId}
              defaultOpen={false}
            />

            <Section
              title="Team members"
              hint="Shown as a table on Slide 1."
              defaultOpen={false}
              actions={<span className="kbdHint">Add rows below</span>}
            >
              <div style={{ overflowX: "auto" }}>
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
                      <tr key={idx} className="sfRow">
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
                            className="btn btnSmall btnGhost sfRowAction"
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

                <div style={{ marginTop: 10 }}>
                  <button type="button" className="btn btnSmall btnGhost" onClick={addTeamMember}>
                    + Add row
                  </button>
                </div>

                <div className="helper">Tip: keep 3–6 rows for best slide density.</div>
              </div>
            </Section>

            <Section title="Weekly activities" hint="Previous vs current week lists." defaultOpen={false}>
              <div className="row2">
                <div>
                  <div className="formInlineHeader">
                    <div>
                      <div className="formInlineTitle">Completed (previous week)</div>
                      <div className="formInlineHint">What got done last week.</div>
                    </div>
                    <button type="button" className="btn btnSmall btnGhost" onClick={() => addBulletListItem("prevWeekActivities")}>
                      Add
                    </button>
                  </div>

                  <div className="formList">
                    {ensureMinOne(slide1.prevWeekActivities).map((b, idx) => (
                      <div key={`${sfPrevWeekSeedId}_${idx}`} className="formListRow">
                        <input
                          className="input"
                          value={b}
                          onChange={(e) => updateBulletListItem("prevWeekActivities", idx, e.target.value)}
                          placeholder={`Activity ${idx + 1}`}
                          aria-label={`Previous week activity ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="btn btnSmall btnGhost formRowAction"
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
                  <div className="formInlineHeader">
                    <div>
                      <div className="formInlineTitle">Planned (current week)</div>
                      <div className="formInlineHint">What’s planned next.</div>
                    </div>
                    <button type="button" className="btn btnSmall btnGhost" onClick={() => addBulletListItem("currentWeekActivities")}>
                      Add
                    </button>
                  </div>

                  <div className="formList">
                    {ensureMinOne(slide1.currentWeekActivities).map((b, idx) => (
                      <div key={`${sfCurrentWeekSeedId}_${idx}`} className="formListRow">
                        <input
                          className="input"
                          value={b}
                          onChange={(e) => updateBulletListItem("currentWeekActivities", idx, e.target.value)}
                          placeholder={`Planned activity ${idx + 1}`}
                          aria-label={`Current week activity ${idx + 1}`}
                        />
                        <button
                          type="button"
                          className="btn btnSmall btnGhost formRowAction"
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

              <div className="helper">Slide preview updates live. Export places Skill Factory slides after the Global Cover.</div>
            </Section>
          </div>
        </div>
      </section>
    );
  }

  // ---- Skill Factory Slide 2 editor (image-only metrics) ----
  if (mode === "skillFactorySlide2") {
    const slide2 = skillFactory?.slides?.slide2;

    if (!slide2) {
      return (
        <section className="card" aria-label="Skill Factory Slide 2 editor">
          <div className="cardHeader">
            <h2 className="cardTitle">Skill Factory – Slide 2</h2>
            <p className="cardHint">Skill Factory data not available.</p>
          </div>
          <div className="cardBody">
            <div className="helper helperError">Unable to load Skill Factory Slide 2 state.</div>
          </div>
        </section>
      );
    }

    const metrics = Array.isArray(slide2.metricsImages) ? slide2.metricsImages : [];

    const update = (patch) => onSkillFactorySlide2Change?.({ ...slide2, ...patch });

    const onAddFiles = (filesList) => {
      const files = Array.from(filesList || []);
      if (!files.length) return;

      // Image-only: accept PNG/JPG (do not parse CSV/JSON).
      const accepted = files.filter((f) => {
        const t = (f?.type || "").toLowerCase();
        return t === "image/png" || t === "image/jpeg" || t === "image/jpg";
      });

      if (!accepted.length) {
        if (sf2FileInputRef.current) sf2FileInputRef.current.value = "";
        return;
      }

      // Append in selection order; compute dimensions asynchronously but keep relative order.
      const base = [...metrics];

      accepted.forEach((file, localIdx) => {
        const objectUrl = URL.createObjectURL(file);

        // Only update optimistically on first item to avoid multiple re-renders;
        // instead, do a single append upfront then patch dimensions per image load.
        if (localIdx === 0) {
          update({ metricsImages: [...base, ...accepted.map((f2) => ({ objectUrl: "", fileName: f2.name, width: 0, height: 0 }))] });
        }

        const img = new Image();
        img.onload = () => {
          // Patch the matching fileName slot from the end segment (best-effort).
          // If there are duplicates, we patch the first matching "empty objectUrl" entry.
          const next = (Array.isArray(slide2.metricsImages) ? slide2.metricsImages : []).slice();
          const startIdx = base.length;
          const slot = next.findIndex((m, i) => i >= startIdx && m?.fileName === file.name && !m?.objectUrl);
          const targetIdx = slot >= 0 ? slot : next.length;
          if (targetIdx < next.length) {
            next[targetIdx] = { objectUrl, fileName: file.name, width: img.naturalWidth, height: img.naturalHeight };
          } else {
            next.push({ objectUrl, fileName: file.name, width: img.naturalWidth, height: img.naturalHeight });
          }
          update({ metricsImages: next });
        };
        img.onerror = () => {
          const next = (Array.isArray(slide2.metricsImages) ? slide2.metricsImages : []).slice();
          const startIdx = base.length;
          const slot = next.findIndex((m, i) => i >= startIdx && m?.fileName === file.name && !m?.objectUrl);
          const targetIdx = slot >= 0 ? slot : next.length;
          if (targetIdx < next.length) {
            next[targetIdx] = { objectUrl, fileName: file.name, width: 0, height: 0 };
          } else {
            next.push({ objectUrl, fileName: file.name, width: 0, height: 0 });
          }
          update({ metricsImages: next });
        };
        img.src = objectUrl;
      });

      // Allow uploading same file again if needed.
      if (sf2FileInputRef.current) sf2FileInputRef.current.value = "";
    };

    const removeAt = (idx) => {
      const next = [...metrics];
      const removed = next[idx];
      if (removed?.objectUrl) URL.revokeObjectURL(removed.objectUrl);
      next.splice(idx, 1);
      update({ metricsImages: next });
    };

    const clearAll = () => {
      metrics.forEach((m) => {
        if (m?.objectUrl) URL.revokeObjectURL(m.objectUrl);
      });
      if (sf2FileInputRef.current) sf2FileInputRef.current.value = "";
      update({ metricsImages: [] });
    };

    const moveItem = (fromIdx, toIdx) => {
      if (fromIdx === toIdx) return;
      if (fromIdx < 0 || toIdx < 0) return;
      if (fromIdx >= metrics.length || toIdx >= metrics.length) return;
      const next = [...metrics];
      const [it] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, it);
      update({ metricsImages: next });
    };

    return (
      <section className="card" aria-label="Skill Factory Slide 2 editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Skill Factory – Slide 2</h2>
          <p className="cardHint">Upload metrics screenshots (PNG/JPG). Drag tiles to reorder.</p>
        </div>

        <div className="cardBody">
          <div className="formStack">
            <Section
              title="Upload"
              hint="Local-only: used for preview and PPT export."
              defaultOpen
              actions={<span className="kbdHint">Use file picker</span>}
            >
              <div className="row">
                <div>
                  <label className="label" htmlFor={sf2UploadId}>
                    Metrics images (PNG/JPG)
                  </label>
                  <input
                    id={sf2UploadId}
                    ref={sf2FileInputRef}
                    className="input"
                    type="file"
                    accept="image/png,image/jpeg"
                    multiple
                    onChange={(e) => onAddFiles(e.target.files)}
                    aria-label="Upload Skill Factory metrics images (local only)"
                  />
                  <div className="helper">
                    Tip: Drag a tile to a new position (drag-anywhere). Export mirrors this order (first 3 use the main Slide 2 placement).
                  </div>

                  {metrics.length ? (
                    <button type="button" className="btn btnSmall btnGhost" onClick={clearAll} style={{ marginTop: 10 }}>
                      Clear all
                    </button>
                  ) : (
                    <EmptyState badge="Required" title="No metrics images" description="Upload one or more screenshots to populate Skill Factory Slide 2." />
                  )}
                </div>
              </div>
            </Section>

            <Section title="Images" hint={metrics.length ? "Hover a tile to reveal actions." : "Add images to preview and reorder."} defaultOpen={!!metrics.length}>
              {metrics.length ? (
                <div className="sf2MasonryWrap" aria-label="Uploaded metrics images">
                  <MasonryDnD
                    items={metrics}
                    getItemKey={(m, idx) => `${m?.objectUrl || "img"}_${m?.fileName || "file"}_${idx}`}
                    columns={4}
                    gapPx={8}
                    ariaLabel="Uploaded metrics images (reorderable)"
                    onReorder={moveItem}
                    onRemoveItem={removeAt}
                    renderItem={(m, { index, draggable, onRemove }) => (
                      <div className={`sf2Tile ${draggable ? "sf2TileDragging" : ""}`}>
                        <div className="sf2TileTop">
                          <div className="sf2TileName" title={m.fileName || "metrics image"}>
                            {m.fileName || `metrics_${index + 1}`}
                          </div>
                          <div className="sf2TileActions">
                            <span className="sf2DragHint" aria-hidden="true" title="Drag to reorder">
                              Drag
                            </span>
                            <button
                              type="button"
                              className="btn btnSmall btnGhost sf2TileRemove"
                              onClick={onRemove}
                              aria-label={`Remove metrics image ${index + 1}`}
                              title="Remove"
                            >
                              −
                            </button>
                          </div>
                        </div>

                        <div className="sf2TileImgWrap">
                          {m?.objectUrl ? (
                            <img className="sf2TileImg" src={m.objectUrl} alt={m.fileName ? `Metrics: ${m.fileName}` : "Metrics"} draggable={false} />
                          ) : (
                            <div className="sf2TilePlaceholder">
                              <div className="badge">Loading</div>
                              <div style={{ marginTop: 8 }}>Preparing preview…</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  />
                </div>
              ) : null}

              <div className="helper">Slide preview updates live. Export will insert Skill Factory Slide 2 directly after Skill Factory Slide 1.</div>
            </Section>
          </div>
        </div>
      </section>
    );
  }

  // ---- Skill Factory Slide 3 editor (table) ----
  if (mode === "skillFactorySlide3") {
    const slide3 = skillFactory?.slides?.slide3;

    if (!slide3) {
      return (
        <section className="card" aria-label="Skill Factory Slide 3 editor">
          <div className="cardHeader">
            <h2 className="cardTitle">Skill Factory – Slide 3</h2>
            <p className="cardHint">Skill Factory data not available.</p>
          </div>
          <div className="cardBody">
            <div className="helper helperError">Unable to load Skill Factory Slide 3 state.</div>
          </div>
        </section>
      );
    }

    const update = (patch) => onSkillFactorySlide3Change?.({ ...slide3, ...patch });

    const cols = Array.isArray(slide3.columns) ? slide3.columns : [];
    const rows = Array.isArray(slide3.rows) ? slide3.rows : [];

    // Keep existing behavior where an empty columns list shows a sensible default.
    // HOWEVER: we also support a true "no headers" empty state by allowing the user to delete down to 0.
    // If the stored list is empty, we treat it as empty (no Add Row) until user adds at least 1 column.
    const hasAnyHeader = cols.length > 0;
    const displayCols = cols;

    const addColumn = () => {
      const nextCols = [...displayCols, "New column"];
      // Reset existing rows to the new header count (empty cells), keeping row count.
      update({ columns: nextCols, rows: rows.map(() => new Array(nextCols.length).fill("").map(() => "")) });
    };

    const removeColumn = (idx) => {
      const nextCols = [...displayCols];
      nextCols.splice(idx, 1);

      // Reset all rows to match new headers (as requested).
      const nextRows = rows.map(() => new Array(nextCols.length).fill("").map(() => ""));
      update({ columns: nextCols, rows: nextRows });
    };

    const updateColumn = (idx, val) => {
      const nextCols = [...displayCols];
      nextCols[idx] = val;

      // Any header change should reset ALL existing row data to empty cells.
      const nextRows = rows.map(() => new Array(nextCols.length).fill("").map(() => ""));
      update({ columns: nextCols, rows: nextRows });
    };

    const addRow = () => {
      if (!hasAnyHeader) return;
      update({ rows: [...rows, new Array(displayCols.length).fill("").map(() => "")] });
    };

    const removeRow = (idx) => {
      const next = [...rows];
      next.splice(idx, 1);
      update({ rows: next });
    };

    const updateCell = (rowIdx, colIdx, value) => {
      const colCount = displayCols.length;
      const nextRows = rows.map((r, i) => {
        if (i !== rowIdx) return Array.isArray(r) ? r : new Array(colCount).fill("").map(() => "");
        const base = Array.isArray(r) ? [...r] : new Array(colCount).fill("").map(() => "");
        // pad/trim defensively
        if (base.length < colCount) base.push(...new Array(colCount - base.length).fill("").map(() => ""));
        if (base.length > colCount) base.splice(colCount);
        base[colIdx] = value;
        return base;
      });
      update({ rows: nextRows });
    };

    return (
      <section className="card" aria-label="Skill Factory Slide 3 editor">
        <div className="cardHeader">
          <h2 className="cardTitle">Skill Factory – Slide 3</h2>
          <p className="cardHint">Tabular status slide (matches the reference: title + table + bottom band).</p>
        </div>

        <div className="cardBody">
          <div className="formStack">
            <Section title="Header" hint="Main title shown above the table." defaultOpen>
              <div className="row">
                <div>
                  <label className="label" htmlFor={sf3TitleId}>
                    Title
                  </label>
                  <input
                    id={sf3TitleId}
                    className="input"
                    value={slide3.title || ""}
                    onChange={(e) => update({ title: e.target.value })}
                    placeholder="e.g., Data Engineering : Continuous Assessment - RMG"
                  />
                </div>

                <div>
                  <label className="label" htmlFor={sf3BandColorId}>
                    Bottom band color
                  </label>
                  <input
                    id={sf3BandColorId}
                    className="input"
                    type="color"
                    value={(slide3.bottomBandColor || "#2F78A8").toString()}
                    onChange={(e) => update({ bottomBandColor: e.target.value })}
                    aria-label="Bottom band color"
                    style={{ padding: 6, height: 42 }}
                  />
                </div>
              </div>
            </Section>

            <Section title="Columns" hint="Add headers first. Changing headers resets all rows." defaultOpen actions={<span className="kbdHint">Edit below</span>}>
              {!hasAnyHeader ? (
                <EmptyState
                  badge="Required"
                  title="No table headers"
                  description="Add at least one column header to start adding rows. When you change headers, existing rows reset to empty cells."
                />
              ) : null}

              <div className="formList" style={{ marginTop: hasAnyHeader ? 0 : 10 }}>
                {(displayCols || []).map((c, idx) => (
                  <div key={`${sf3ColSeedId}_${idx}`} className="formListRow">
                    <input
                      className="input"
                      value={c}
                      onChange={(e) => updateColumn(idx, e.target.value)}
                      placeholder={`Column ${idx + 1}`}
                      aria-label={`Column ${idx + 1}`}
                    />
                    <button
                      type="button"
                      className="btn btnSmall btnGhost formRowAction"
                      onClick={() => removeColumn(idx)}
                      aria-label={`Remove column ${idx + 1}`}
                      title="Remove"
                    >
                      −
                    </button>
                  </div>
                ))}

                <button type="button" className="btn btnSmall btnGhost" onClick={addColumn}>
                  + Add column
                </button>
              </div>

              <div className="helper">
                Export and previews always use the current header order. Changing headers clears existing row values to keep the table consistent.
              </div>
            </Section>

            <Section title="Rows" hint="Add 1–6 rows. Cells are editable inline." defaultOpen actions={<span className="kbdHint">Edit below</span>}>
              {!hasAnyHeader ? (
                <EmptyState badge="Required" title="Headers needed" description="Add at least one column header to enable rows." />
              ) : !rows.length ? (
                <EmptyState badge="Optional" title="No rows" description="Add a row to populate the table." />
              ) : null}

              {hasAnyHeader && rows.length ? (
                <div style={{ overflowX: "auto" }}>
                  <table className="sf3EditorTable" aria-label="Slide 3 dynamic table editor">
                    <thead>
                      <tr>
                        {displayCols.map((c, idx) => (
                          <th key={idx} style={{ minWidth: 160 }}>
                            {(c || "").trim() || `Column ${idx + 1}`}
                          </th>
                        ))}
                        <th aria-label="Actions" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, rowIdx) => {
                        const safeRow = Array.isArray(r) ? r : new Array(displayCols.length).fill("").map(() => "");
                        return (
                          <tr key={`${sf3RowSeedId}_${rowIdx}`} className="sfRow">
                            {displayCols.map((_c, colIdx) => (
                              <td key={colIdx}>
                                <input
                                  className="input"
                                  value={(safeRow[colIdx] || "").toString()}
                                  onChange={(e) => updateCell(rowIdx, colIdx, e.target.value)}
                                  placeholder="—"
                                  aria-label={`Row ${rowIdx + 1} column ${colIdx + 1}`}
                                />
                              </td>
                            ))}

                            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <button
                                type="button"
                                className="btn btnSmall btnGhost sfRowAction"
                                onClick={() => removeRow(rowIdx)}
                                aria-label={`Remove row ${rowIdx + 1}`}
                                title="Remove row"
                              >
                                −
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button type="button" className="btn btnSmall btnGhost" onClick={addRow} disabled={!hasAnyHeader} aria-disabled={!hasAnyHeader}>
                      + Add row
                    </button>
                  </div>

                  <div className="helper">Previews update live. Export mirrors the same headers/rows.</div>
                </div>
              ) : (
                <button type="button" className="btn btnSmall btnGhost" onClick={addRow} disabled={!hasAnyHeader} aria-disabled={!hasAnyHeader}>
                  + Add row
                </button>
              )}
            </Section>
          </div>
        </div>
      </section>
    );
  }

  // ---- Normal slide editor ----
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
        <p className="cardHint">Update content and theme. Changes reflect instantly in preview.</p>
      </div>

      <div className="cardBody">
        <div className="formStack">
          <Section title="Text" hint="Title, subtitle, and bullet points." defaultOpen>
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

              <Section title="Bullet points" hint="Leave a bullet empty to omit it from export." defaultOpen actions={<span className="kbdHint">Use “Add” below</span>}>
                <div className="formList">
                  {(slide.bullets || []).map((b, idx) => (
                    <div key={idx} className="formListRow">
                      <input
                        className="input"
                        value={b}
                        onChange={(e) => updateBullet(idx, e.target.value)}
                        placeholder={`Bullet ${idx + 1}`}
                        aria-label={`Bullet ${idx + 1}`}
                      />
                      <button
                        type="button"
                        className="btn btnSmall btnGhost formRowAction"
                        onClick={() => removeBullet(idx)}
                        aria-label={`Remove bullet ${idx + 1}`}
                        title="Remove bullet"
                        disabled={(slide.bullets || []).length <= 1}
                      >
                        −
                      </button>
                    </div>
                  ))}
                  <button type="button" className="btn btnSmall btnGhost" onClick={addBullet}>
                    + Add bullet
                  </button>
                </div>
              </Section>
            </div>
          </Section>

          <Section title="Theme" hint="Background and text styling." defaultOpen={false}>
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
          </Section>

          <Section
            title="Image"
            hint="Local-only: used for preview and PPT export."
            defaultOpen={false}
            actions={
              slide.image?.objectUrl ? (
                <button type="button" className="btn btnSmall btnGhost" onClick={clearImage}>
                  Remove
                </button>
              ) : null
            }
          >
            <div className="row">
              <div>
                <input
                  ref={fileInputRef}
                  className="input"
                  type="file"
                  accept="image/*"
                  onChange={(e) => onPickImage(e.target.files?.[0])}
                  aria-label="Upload image for this slide (local only)"
                />
                <div className="helper">Your file never leaves your browser.</div>

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
                ) : (
                  <EmptyState badge="Optional" title="No image" description="Upload an image if this slide needs a visual panel." />
                )}
              </div>
            </div>
          </Section>
        </div>
      </div>
    </section>
  );
}
