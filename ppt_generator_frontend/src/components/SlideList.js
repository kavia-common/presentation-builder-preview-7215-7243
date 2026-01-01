import React, { useEffect, useMemo, useRef } from "react";
import useLocalStorageState from "../utils/useLocalStorageState";

const LS_KEY = "pptgen_slide_hierarchy_collapsed_v1";

/**
 * @param {object} collapsed
 * @param {string} key
 * @returns {boolean}
 */
function isCollapsed(collapsed, key) {
  return Boolean(collapsed && collapsed[key]);
}

/**
 * @param {object} collapsed
 * @param {string} key
 * @param {boolean} next
 * @returns {object}
 */
function setCollapsedKey(collapsed, key, next) {
  return { ...(collapsed || {}), [key]: Boolean(next) };
}

function GroupHeader({ title, countHint, collapsed, onToggle, rightActions }) {
  return (
    <div className="slGroupHeader">
      <button
        type="button"
        className="slGroupToggle"
        onClick={onToggle}
        aria-expanded={!collapsed}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <span className="slGroupChevron" aria-hidden="true">
          {collapsed ? "▸" : "▾"}
        </span>
        <span className="slGroupTitle">{title}</span>
        {typeof countHint === "string" && countHint.trim() ? <span className="slGroupCount">{countHint}</span> : null}
      </button>

      {rightActions ? <div className="slGroupHeaderActions">{rightActions}</div> : null}
    </div>
  );
}

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
  /** Left rail slide hierarchy grouped with collapsible sections (persisted). */

  const factories = Array.isArray(skillFactories) ? skillFactories : [];
  const safeSlides = Array.isArray(slides) ? slides : [];

  const coverSelected = selectedId === globalCover?.id;
  const lastSelected = selectedId === globalLast?.id;

  const [collapsed, setCollapsed] = useLocalStorageState(LS_KEY, {
    globalCover: false,
    skillFactories: false,
    normalSlides: false,
    globalLast: false
  });

  const selectedBtnRef = useRef(null);

  // Keep left rail usable: when selection changes, ensure it is visible and focusable for keyboard users.
  useEffect(() => {
    if (!selectedBtnRef.current) return;
    selectedBtnRef.current.scrollIntoView({ block: "nearest", inline: "nearest" });
    // Focus without causing scroll jump (we already scrollIntoView)
    selectedBtnRef.current.focus?.({ preventScroll: true });
  }, [selectedId]);

  const coverTitle = globalCover?.data?.title?.trim() ? globalCover.data.title : "Cover title";
  const coverSub = globalCover?.data?.subtitle?.trim() ? globalCover.data.subtitle : "Cover subtitle";

  const lastTitle = globalLast?.data?.headline?.trim() ? globalLast.data.headline : "Closing headline";
  const lastSub = globalLast?.data?.tagline?.trim() ? globalLast.data.tagline : "Brand / tagline";

  const normalSlidesStartNo = useMemo(() => 2 + factories.length * 4, [factories.length]);

  const toggleGroup = (key) => setCollapsed((prev) => setCollapsedKey(prev, key, !isCollapsed(prev, key)));

  return (
    <section className="card slCard" aria-label="Slide hierarchy">
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
        <p className="cardHint">Grouped hierarchy. Click a section title to collapse/expand.</p>
      </div>

      <div className="cardBody slBody">
        {/* Global Cover */}
        <div className="slGroup">
          <GroupHeader
            title="Global Cover"
            countHint="#1"
            collapsed={isCollapsed(collapsed, "globalCover")}
            onToggle={() => toggleGroup("globalCover")}
          />
          {!isCollapsed(collapsed, "globalCover") ? (
            <ul className="slList" aria-label="Global cover">
              <li className={`slItem slItemPinned ${coverSelected ? "slItemActive" : ""}`}>
                <button
                  ref={coverSelected ? selectedBtnRef : null}
                  type="button"
                  onClick={() => onSelect(globalCover.id)}
                  className="btn btnGhost slItemButton"
                  aria-current={coverSelected ? "true" : "false"}
                >
                  <div className="slMetaTop">
                    <div style={{ minWidth: 0 }}>
                      <div className="slKicker">Cover</div>
                      <div className="slTitle">{coverTitle}</div>
                      <div className="slSub">{coverSub}</div>
                    </div>
                    <span className="slIndex">#1</span>
                  </div>
                </button>

                <div className="slItemFooter">
                  <div className="badge" title="Pinned cover slide">
                    Pinned
                  </div>
                  <div className="kbdHint">Non-removable</div>
                </div>
              </li>
            </ul>
          ) : null}
        </div>

        {/* Skill Factories */}
        <div className="slGroup">
          <GroupHeader
            title="Skill Factories"
            countHint={factories.length ? `${factories.length} group${factories.length === 1 ? "" : "s"} • ${factories.length * 4} slides` : "0 groups"}
            collapsed={isCollapsed(collapsed, "skillFactories")}
            onToggle={() => toggleGroup("skillFactories")}
          />

          {!isCollapsed(collapsed, "skillFactories") ? (
            <div className="slGroupBody" aria-label="Skill Factory groups">
              {factories.length ? (
                factories.map((f, idx) => {
                  const title = f?.slides?.slide1?.factoryName?.trim() ? f.slides.slide1.factoryName : `Skill Factory ${idx + 1}`;
                  const sprint = f?.slides?.slide1?.sprintLabel?.trim() ? f.slides.slide1.sprintLabel : "Sprint label";

                  const sf1Id = `__skill_factory_slide1__:${f.id}`;
                  const sf2Id = `__skill_factory_slide2__:${f.id}`;
                  const sf3Id = `__skill_factory_slide3__:${f.id}`;
                  const sf4Id = `__skill_factory_slide4__:${f.id}`;

                  // Cover is #1. Each factory adds 4 slides.
                  const baseSlideNo = 2 + idx * 4;

                  const sfCollapsedKey = `sf:${f.id}`;
                  const sfCollapsed = isCollapsed(collapsed, sfCollapsedKey);

                  return (
                    <div key={f.id} className="slSubGroup">
                      <GroupHeader
                        title={title}
                        countHint={`#${baseSlideNo}–#${baseSlideNo + 3}`}
                        collapsed={sfCollapsed}
                        onToggle={() => setCollapsed((prev) => setCollapsedKey(prev, sfCollapsedKey, !isCollapsed(prev, sfCollapsedKey)))}
                        rightActions={
                          <button
                            type="button"
                            className="btn btnSmall btnDanger"
                            onClick={() => onDeleteSkillFactory?.(f.id)}
                            aria-label={`Delete Skill Factory ${idx + 1}`}
                            title="Delete Skill Factory group"
                          >
                            Delete
                          </button>
                        }
                      />

                      {!sfCollapsed ? (
                        <ul className="slList slListSub" aria-label={`${title} slides`}>
                          <li className={`slItem ${selectedId === sf1Id ? "slItemActive" : ""}`}>
                            <button
                              ref={selectedId === sf1Id ? selectedBtnRef : null}
                              type="button"
                              onClick={() => onSelect(sf1Id)}
                              className="btn btnGhost slItemButton"
                              aria-current={selectedId === sf1Id ? "true" : "false"}
                            >
                              <div className="slMetaTop">
                                <div style={{ minWidth: 0 }}>
                                  <div className="slKicker">Slide 1</div>
                                  <div className="slTitle">{title}</div>
                                  <div className="slSub">{sprint}</div>
                                </div>
                                <span className="slIndex">#{baseSlideNo}</span>
                              </div>
                            </button>
                          </li>

                          <li className={`slItem ${selectedId === sf2Id ? "slItemActive" : ""}`}>
                            <button
                              ref={selectedId === sf2Id ? selectedBtnRef : null}
                              type="button"
                              onClick={() => onSelect(sf2Id)}
                              className="btn btnGhost slItemButton"
                              aria-current={selectedId === sf2Id ? "true" : "false"}
                            >
                              <div className="slMetaTop">
                                <div style={{ minWidth: 0 }}>
                                  <div className="slKicker">Slide 2</div>
                                  <div className="slTitle">Metrics</div>
                                  <div className="slSub">{title}</div>
                                </div>
                                <span className="slIndex">#{baseSlideNo + 1}</span>
                              </div>
                            </button>
                          </li>

                          <li className={`slItem ${selectedId === sf3Id ? "slItemActive" : ""}`}>
                            <button
                              ref={selectedId === sf3Id ? selectedBtnRef : null}
                              type="button"
                              onClick={() => onSelect(sf3Id)}
                              className="btn btnGhost slItemButton"
                              aria-current={selectedId === sf3Id ? "true" : "false"}
                            >
                              <div className="slMetaTop">
                                <div style={{ minWidth: 0 }}>
                                  <div className="slKicker">Slide 3</div>
                                  <div className="slTitle">Continuous Assessment</div>
                                  <div className="slSub">{title}</div>
                                </div>
                                <span className="slIndex">#{baseSlideNo + 2}</span>
                              </div>
                            </button>
                          </li>

                          <li className={`slItem ${selectedId === sf4Id ? "slItemActive" : ""}`}>
                            <button
                              ref={selectedId === sf4Id ? selectedBtnRef : null}
                              type="button"
                              onClick={() => onSelect(sf4Id)}
                              className="btn btnGhost slItemButton"
                              aria-current={selectedId === sf4Id ? "true" : "false"}
                            >
                              <div className="slMetaTop">
                                <div style={{ minWidth: 0 }}>
                                  <div className="slKicker">Slide 4</div>
                                  <div className="slTitle">Feedback & Revised Rating</div>
                                  <div className="slSub">{title}</div>
                                </div>
                                <span className="slIndex">#{baseSlideNo + 3}</span>
                              </div>
                            </button>
                          </li>
                        </ul>
                      ) : null}
                    </div>
                  );
                })
              ) : (
                <div className="slEmpty">
                  <div className="badge">Skill Factories</div>
                  <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ocean-text)" }}>
                    No Skill Factories yet. Click <strong>+ Skill Factory</strong> to insert a new group after the cover.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Normal Slides */}
        <div className="slGroup">
          <GroupHeader
            title="Normal Slides"
            countHint={safeSlides.length ? `${safeSlides.length} slide${safeSlides.length === 1 ? "" : "s"}` : "0 slides"}
            collapsed={isCollapsed(collapsed, "normalSlides")}
            onToggle={() => toggleGroup("normalSlides")}
          />

          {!isCollapsed(collapsed, "normalSlides") ? (
            <ul className="slList" aria-label="Normal slides">
              {safeSlides.length === 0 ? (
                <li className="slEmpty">
                  <div className="badge">Empty</div>
                  <p style={{ margin: "10px 0 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--ocean-text)" }}>
                    No content slides yet. Click <strong>+ Add</strong> to create your first content slide.
                  </p>
                </li>
              ) : (
                safeSlides.map((s, idx) => {
                  const selected = s.id === selectedId;
                  const slideNumber = normalSlidesStartNo + idx;
                  return (
                    <li key={s.id} className={`slItem ${selected ? "slItemActive" : ""}`}>
                      <button
                        ref={selected ? selectedBtnRef : null}
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
                            title={idx === safeSlides.length - 1 ? "Already at bottom" : "Move down"}
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
            </ul>
          ) : null}
        </div>

        {/* Global Last */}
        <div className="slGroup">
          <GroupHeader
            title="Global Last Page"
            countHint="Last"
            collapsed={isCollapsed(collapsed, "globalLast")}
            onToggle={() => toggleGroup("globalLast")}
          />
          {!isCollapsed(collapsed, "globalLast") ? (
            <ul className="slList" aria-label="Global last page">
              <li className={`slItem slItemPinned ${lastSelected ? "slItemActive" : ""}`}>
                <button
                  ref={lastSelected ? selectedBtnRef : null}
                  type="button"
                  onClick={() => onSelect(globalLast.id)}
                  className="btn btnGhost slItemButton"
                  aria-current={lastSelected ? "true" : "false"}
                >
                  <div className="slMetaTop">
                    <div style={{ minWidth: 0 }}>
                      <div className="slKicker">Last</div>
                      <div className="slTitle">{lastTitle}</div>
                      <div className="slSub">{lastSub}</div>
                    </div>
                    <span className="slIndex">Last</span>
                  </div>
                </button>

                <div className="slItemFooter">
                  <div className="badge" title="Pinned closing slide">
                    Pinned
                  </div>
                  <div className="kbdHint">Always final</div>
                </div>
              </li>
            </ul>
          ) : null}
        </div>
      </div>
    </section>
  );
}
