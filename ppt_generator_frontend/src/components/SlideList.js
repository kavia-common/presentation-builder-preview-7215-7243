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
          Order: Global Cover → Skill Factory Slide 1 → Skill Factory Slide 2 → Skill Factory Slide 3 → Skill Factory Slide 4 → Content
          slides → Global Last Page.
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

          {/* Skill Factories (Slide 1 + Slide 2 + Slide 3 + Slide 4 per factory) */}
          {factories.length ? (
            factories.flatMap((f, idx) => {
              const title = f?.slides?.slide1?.factoryName?.trim() ? f.slides.slide1.factoryName : `Skill Factory ${idx + 1}`;
              const sprint = f?.slides?.slide1?.sprintLabel?.trim() ? f.slides.slide1.sprintLabel : "Sprint label";

              const sf1Id = `__skill_factory_slide1__:${f.id}`;
              const sf2Id = `__skill_factory_slide2__:${f.id}`;
              const sf3Id = `__skill_factory_slide3__:${f.id}`;
              const sf4Id = `__skill_factory_slide4__:${f.id}`;

              // cover=1; sf1 starts at 2; each factory adds 4 slides.
              const baseSlideNo = 2 + idx * 4;
              const sf1Selected = selectedId === sf1Id;
              const sf2Selected = selectedId === sf2Id;
              const sf3Selected = selectedId === sf3Id;
              const sf4Selected = selectedId === sf4Id;

              return [
                (
                  <li key={`${f.id}__sf1`} className={`slItem ${sf1Selected ? "slItemActive" : ""}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(sf1Id)}
                      className="btn btnGhost slItemButton"
                      aria-current={sf1Selected ? "true" : "false"}
                    >
                      <div className="slMetaTop">
                        <div style={{ minWidth: 0 }}>
                          <div className="slKicker">Skill Factory – Slide 1</div>
                          <div className="slTitle">{title}</div>
                          <div className="slSub">{sprint}</div>
                        </div>
                        <span className="slIndex">#{baseSlideNo}</span>
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
                ),
                (
                  <li key={`${f.id}__sf2`} className={`slItem ${sf2Selected ? "slItemActive" : ""}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(sf2Id)}
                      className="btn btnGhost slItemButton"
                      aria-current={sf2Selected ? "true" : "false"}
                    >
                      <div className="slMetaTop">
                        <div style={{ minWidth: 0 }}>
                          <div className="slKicker">Skill Factory – Slide 2</div>
                          <div className="slTitle">Metrics (image-only)</div>
                          <div className="slSub">{title}</div>
                        </div>
                        <span className="slIndex">#{baseSlideNo + 1}</span>
                      </div>
                    </button>

                    <div className="slItemFooter">
                      <div className="kbdHint">Upload PNG/JPG</div>
                    </div>
                  </li>
                ),
                (
                  <li key={`${f.id}__sf3`} className={`slItem ${sf3Selected ? "slItemActive" : ""}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(sf3Id)}
                      className="btn btnGhost slItemButton"
                      aria-current={sf3Selected ? "true" : "false"}
                    >
                      <div className="slMetaTop">
                        <div style={{ minWidth: 0 }}>
                          <div className="slKicker">Skill Factory – Slide 3</div>
                          <div className="slTitle">Continuous Assessment (table)</div>
                          <div className="slSub">{title}</div>
                        </div>
                        <span className="slIndex">#{baseSlideNo + 2}</span>
                      </div>
                    </button>

                    <div className="slItemFooter">
                      <div className="kbdHint">Table</div>
                    </div>
                  </li>
                ),
                (
                  <li key={`${f.id}__sf4`} className={`slItem ${sf4Selected ? "slItemActive" : ""}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(sf4Id)}
                      className="btn btnGhost slItemButton"
                      aria-current={sf4Selected ? "true" : "false"}
                    >
                      <div className="slMetaTop">
                        <div style={{ minWidth: 0 }}>
                          <div className="slKicker">Skill Factory – Slide 4</div>
                          <div className="slTitle">Feedback & Revised Rating (table)</div>
                          <div className="slSub">{title}</div>
                        </div>
                        <span className="slIndex">#{baseSlideNo + 3}</span>
                      </div>
                    </button>

                    <div className="slItemFooter">
                      <div className="kbdHint">Table</div>
                    </div>
                  </li>
                )
              ];
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
            safeSlides.map((s, idx) => {
              const selected = s.id === selectedId;
              const slideNumber = 2 + factories.length * 4 + idx; // cover=1; factories occupy 4 slides each
              return (
                <li key={s.id} className={`slItem ${selected ? "slItemActive" : ""}`}>
                  <button
                    type="button"
                    onClick={() => onSelect(s.id)}
                    className="btn btnGhost slItemButton"
                    aria-current={selected ? "true" : "false"}
                  >
                    <div className="slMetaTop">
                      <div style={{ minWidth: 0 }}>
                        <div className="slTitle">{s.title?.trim() ? s.title : `Untitled slide ${slideNumber}`}</div>
                        <div className="slSub">{s.subtitle?.trim() ? s.subtitle : "No subtitle"}</div>
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
                      onClick={() => onDelete(s.id)}
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
