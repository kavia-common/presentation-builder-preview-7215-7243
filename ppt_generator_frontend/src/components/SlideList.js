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
  const safeSlides = Array.isArray(slides) ? slides : [];
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
            <button className="btn btnSmall" onClick={onAdd} type="button">
              + Add
            </button>
          </div>
        </div>
        <p className="cardHint">
          Order: Global Cover → Skill Factories → Content slides → Global Last Page. Skill Factory Slide 1 is implemented for now.
        </p>
      </div>

      <div className="cardBody">
        <ul className="slList">
          {/* Global Cover (pinned) */}
          <li className={`slItem slItemPinned ${coverSelected ? "slItemActive" : ""}`}>
            <button
              type="button"
              onClick={() => onSelect(globalCover.id)}
              className="btn btnGhost slItemButton"
              aria-current={coverSelected ? "true" : "false"}
            >
              <div className="slMetaTop">
                <div style={{ minWidth: 0 }}>
                  <div className="slKicker">Global Cover</div>
                  <div className="slTitle">{globalCover?.data?.title?.trim() ? globalCover.data.title : "Cover title"}</div>
                  <div className="slSub">{globalCover?.data?.subtitle?.trim() ? globalCover.data.subtitle : "Cover subtitle"}</div>
                </div>
                <span className="slIndex">#1</span>
              </div>
            </button>

            <div className="slItemFooter">
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
                <li key={f.id} className={`slItem ${selected ? "slItemActive" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(`__skill_factory_slide1__:${f.id}`)}
                    className="btn btnGhost slItemButton"
                    aria-current={selected ? "true" : "false"}
                  >
                    <div className="slMetaTop">
                      <div style={{ minWidth: 0 }}>
                        <div className="slKicker">Skill Factory – Slide 1</div>
                        <div className="slTitle">{title}</div>
                        <div className="slSub">{sprint}</div>
                      </div>
                      <span className="slIndex">#{slideNumber}</span>
                    </div>
                  </button>

                  <div className="slItemFooter">
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
            <li className="slEmpty">
              <div className="badge">Skill Factory</div>
              <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ocean-text)" }}>
                No Skill Factories yet. Click <strong>+ Skill Factory</strong> to insert a new group after the cover.
              </p>
              <div className="helper" style={{ marginTop: 8 }}>
                Skill Factory slides export between <strong>Cover</strong> and <strong>Content slides</strong>.
              </div>
            </li>
          )}

          {/* Normal slides */}
          {safeSlides.length === 0 ? (
            <li className="slEmpty">
              <div className="badge">Empty state</div>
              <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ocean-text)" }}>
                No content slides yet. Click <strong>+ Add</strong> to create your first content slide.
              </p>
              <div className="helper" style={{ marginTop: 8 }}>
                Export will still include <strong>Global Cover</strong> and <strong>Global Last Page</strong>.
              </div>
            </li>
          ) : (
            safeSlides.map((slide, idx) => {
              const selected = slide.id === selectedId;
              const slideNumber = 2 + factories.length + idx; // cover=1; factories occupy 2..; normal start after
              return (
                <li key={slide.id} className={`slItem ${selected ? "slItemActive" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(slide.id)}
                    className="btn btnGhost slItemButton"
                    aria-current={selected ? "true" : "false"}
                  >
                    <div className="slMetaTop">
                      <div style={{ minWidth: 0 }}>
                        <div className="slTitle">{slide.title?.trim() ? slide.title : `Untitled slide ${slideNumber}`}</div>
                        <div className="slSub">{slide.subtitle?.trim() ? slide.subtitle : "No subtitle"}</div>
                      </div>
                      <span className="slIndex">#{slideNumber}</span>
                    </div>
                  </button>

                  <div className="slItemFooter">
                    <div className="slActions">
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
                        disabled={idx === safeSlides.length - 1}
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
          <li className={`slItem slItemPinned ${lastSelected ? "slItemActive" : ""}`}>
            <button
              type="button"
              onClick={() => onSelect(globalLast.id)}
              className="btn btnGhost slItemButton"
              aria-current={lastSelected ? "true" : "false"}
            >
              <div className="slMetaTop">
                <div style={{ minWidth: 0 }}>
                  <div className="slKicker">Global Last Page</div>
                  <div className="slTitle">{globalLast?.data?.headline?.trim() ? globalLast.data.headline : "Closing headline"}</div>
                  <div className="slSub">{globalLast?.data?.tagline?.trim() ? globalLast.data.tagline : "Brand / tagline"}</div>
                </div>
                <span className="slIndex">Last</span>
              </div>
            </button>

            <div className="slItemFooter">
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
