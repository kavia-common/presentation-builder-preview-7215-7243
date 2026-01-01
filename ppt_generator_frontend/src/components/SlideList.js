import React from "react";

// PUBLIC_INTERFACE
export default function SlideList({
  globalCover,
  globalLast,
  skillFactories,
  slides,
  selectedId,
  onSelect,
  onAdd,
  onAddSkillFactory,
  onDelete,
  onDeleteSkillFactory,
  onMoveUp,
  onMoveDown
}) {
  /** Left rail list of slides with reorder/delete controls. Includes pinned Global Cover at top and Global Last Page at bottom. */
  const coverSelected = selectedId === globalCover?.id;
  const lastSelected = selectedId === globalLast?.id;

  const factories = Array.isArray(skillFactories) ? skillFactories : [];
  const factorySelectedId = selectedId?.startsWith("__skill_factory_slide1__:") ? selectedId.split(":")[1] : null;

  return (
    <section className="card" aria-label="Slide list">
      <div className="cardHeader">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <h2 className="cardTitle">Slides</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="btn btnSmall btnGhost" onClick={onAddSkillFactory} type="button" title="Add Skill Factory group">
              + Skill Factory
            </button>
            <button className="btn btnSmall btnSecondary" onClick={onAdd} type="button">
              + Add
            </button>
          </div>
        </div>
        <p className="cardHint">
          Order: Global Cover → Skill Factories → Content slides → Global Last Page. Skill Factory Slide 1 is implemented for now.
        </p>
      </div>

      <div className="cardBody">
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {/* Global Cover (pinned) */}
          <li
            style={{
              border: `1px solid ${coverSelected ? "rgba(37,99,235,0.65)" : "rgba(37,99,235,0.22)"}`,
              borderRadius: 14,
              padding: 10,
              background: coverSelected ? "rgba(37,99,235,0.10)" : "rgba(37,99,235,0.05)",
              boxShadow: coverSelected ? "0 10px 22px rgba(37,99,235,0.14)" : "none",
              position: "relative"
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14,
                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(245,158,11,0.08), rgba(255,255,255,0))",
                pointerEvents: "none"
              }}
            />
            <button
              type="button"
              onClick={() => onSelect(globalCover.id)}
              className="btn btnGhost"
              style={{
                width: "100%",
                textAlign: "left",
                padding: 10,
                borderRadius: 12,
                position: "relative"
              }}
              aria-current={coverSelected ? "true" : "false"}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase", color: "#1d4ed8" }}>
                    Global Cover
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: 2
                    }}
                  >
                    {globalCover?.data?.title?.trim() ? globalCover.data.title : "Cover title"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {globalCover?.data?.subtitle?.trim() ? globalCover.data.subtitle : "Cover subtitle"}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#6b7280" }}>#1</span>
              </div>
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, position: "relative" }}>
              <div className="badge" title="Pinned cover slide">
                Pinned • Non-removable
              </div>
              <div className="kbdHint">Not reorderable</div>
            </div>
          </li>

          {/* Skill Factories (currently: Slide 1 only) */}
          {factories.length ? (
            factories.map((f, idx) => {
              const selected = factorySelectedId === f.id;
              const slideNumber = 2 + idx; // cover=1; factories start at 2
              const title = f?.slides?.slide1?.factoryName?.trim() ? f.slides.slide1.factoryName : `Skill Factory ${idx + 1}`;
              const sprint = f?.slides?.slide1?.sprintLabel?.trim() ? f.slides.slide1.sprintLabel : "Sprint label";

              return (
                <li
                  key={f.id}
                  style={{
                    border: `1px solid ${selected ? "rgba(37,99,235,0.45)" : "rgba(17,24,39,0.12)"}`,
                    borderRadius: 14,
                    padding: 10,
                    background: selected ? "rgba(37,99,235,0.06)" : "#fff",
                    boxShadow: selected ? "0 8px 18px rgba(37,99,235,0.10)" : "none"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(`__skill_factory_slide1__:${f.id}`)}
                    className="btn btnGhost"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12
                    }}
                    aria-current={selected ? "true" : "false"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase", color: "#1d4ed8" }}>
                          Skill Factory – Slide 1
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 900,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            marginTop: 2
                          }}
                        >
                          {title}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{sprint}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>#{slideNumber}</span>
                    </div>
                  </button>

                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between", paddingTop: 8 }}>
                    <div className="badge" title="Skill Factory group">
                      Group
                    </div>
                    <button
                      type="button"
                      className="btn btnSmall btnDanger"
                      onClick={() => onDeleteSkillFactory?.(f.id)}
                      aria-label={`Delete Skill Factory ${idx + 1}`}
                      title="Delete Skill Factory group"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })
          ) : (
            <li
              style={{
                border: "1px dashed rgba(17,24,39,0.20)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(37,99,235,0.04)"
              }}
            >
              <div className="badge">Skill Factory</div>
              <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "#111827" }}>
                No Skill Factories yet. Click <strong>+ Skill Factory</strong> to insert a new group after the cover.
              </p>
              <div className="helper" style={{ marginTop: 8 }}>
                Skill Factory slides export between <strong>Cover</strong> and <strong>Content slides</strong>.
              </div>
            </li>
          )}

          {/* Normal slides */}
          {slides.length === 0 ? (
            <li
              style={{
                border: "1px dashed rgba(17,24,39,0.20)",
                borderRadius: 14,
                padding: 14,
                background: "rgba(37,99,235,0.04)"
              }}
            >
              <div className="badge">Empty state</div>
              <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "#111827" }}>
                No content slides yet. Click <strong>+ Add</strong> to create your first content slide.
              </p>
              <div className="helper" style={{ marginTop: 8 }}>
                Export will still include <strong>Global Cover</strong> and <strong>Global Last Page</strong>.
              </div>
            </li>
          ) : (
            slides.map((slide, idx) => {
              const selected = slide.id === selectedId;
              const slideNumber = 2 + factories.length + idx; // cover=1; factories occupy 2..; normal start after
              return (
                <li
                  key={slide.id}
                  style={{
                    border: `1px solid ${selected ? "rgba(37,99,235,0.45)" : "rgba(17,24,39,0.12)"}`,
                    borderRadius: 14,
                    padding: 10,
                    background: selected ? "rgba(37,99,235,0.06)" : "#fff",
                    boxShadow: selected ? "0 8px 18px rgba(37,99,235,0.10)" : "none",
                    transition: "background 150ms ease, border-color 150ms ease, box-shadow 150ms ease"
                  }}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(slide.id)}
                    className="btn btnGhost"
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: 10,
                      borderRadius: 12
                    }}
                    aria-current={selected ? "true" : "false"}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {slide.title?.trim() ? slide.title : `Untitled slide ${slideNumber}`}
                        </div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>{slide.subtitle?.trim() ? slide.subtitle : "No subtitle"}</div>
                      </div>
                      <span style={{ fontSize: 12, color: "#6b7280" }}>#{slideNumber}</span>
                    </div>
                  </button>

                  <div style={{ display: "flex", gap: 8, justifyContent: "space-between", paddingTop: 8 }}>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => onMoveUp(idx)}
                        disabled={idx === 0}
                        aria-label={`Move slide ${slideNumber} up`}
                        title={idx === 0 ? "Already at top" : "Move up"}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="btn btnSmall btnGhost"
                        onClick={() => onMoveDown(idx)}
                        disabled={idx === slides.length - 1}
                        aria-label={`Move slide ${slideNumber} down`}
                        title={idx === slides.length - 1 ? "Already at bottom" : "Move down"}
                      >
                        ↓
                      </button>
                    </div>

                    <button
                      type="button"
                      className="btn btnSmall btnDanger"
                      onClick={() => onDelete(slide.id)}
                      aria-label={`Delete slide ${slideNumber}`}
                      title="Delete slide"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })
          )}

          {/* Global Last Page (pinned) */}
          <li
            style={{
              border: `1px solid ${lastSelected ? "rgba(37,99,235,0.65)" : "rgba(37,99,235,0.18)"}`,
              borderRadius: 14,
              padding: 10,
              background: lastSelected ? "rgba(37,99,235,0.08)" : "rgba(249,250,251,0.9)",
              boxShadow: lastSelected ? "0 10px 22px rgba(37,99,235,0.12)" : "none",
              position: "relative"
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 14,
                background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(255,255,255,0))",
                pointerEvents: "none"
              }}
            />
            <button
              type="button"
              onClick={() => onSelect(globalLast.id)}
              className="btn btnGhost"
              style={{
                width: "100%",
                textAlign: "left",
                padding: 10,
                borderRadius: 12,
                position: "relative"
              }}
              aria-current={lastSelected ? "true" : "false"}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.03em", textTransform: "uppercase", color: "#1d4ed8" }}>
                    Global Last Page
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 900,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      marginTop: 2
                    }}
                  >
                    {globalLast?.data?.headline?.trim() ? globalLast.data.headline : "Closing headline"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                    {globalLast?.data?.tagline?.trim() ? globalLast.data.tagline : "Brand / tagline"}
                  </div>
                </div>
                <span style={{ fontSize: 12, color: "#6b7280" }}>Last</span>
              </div>
            </button>

            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, position: "relative" }}>
              <div className="badge" title="Pinned closing slide">
                Pinned • Non-removable
              </div>
              <div className="kbdHint">Always final</div>
            </div>
          </li>
        </ul>
      </div>
    </section>
  );
}
