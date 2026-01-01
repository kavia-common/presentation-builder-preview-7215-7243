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
export default function SlideForm({ mode = "slide", slide, onChange, cover, onCoverChange }) {
  /** Form used to edit the currently selected slide OR the pinned Global Cover. */
  const titleId = useId();
  const subtitleId = useId();
  const taglineId = useId();
  const fileInputRef = useRef(null);

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
