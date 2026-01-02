import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Build a grouped mega-menu style slide selector.
 * - Left column: groups (Global Cover, each Skill Factory, Normal Slides, Global Last Page)
 * - Right column: items for selected group (for Skill Factories: Slide 1–4)
 *
 * Keyboard:
 * - Enter/Space: open; select item
 * - Esc: close and restore focus
 * - ArrowUp/ArrowDown: move within active panel (groups or items)
 * - ArrowLeft/ArrowRight: switch panels (groups <-> items)
 */

// PUBLIC_INTERFACE
export default function SlideMegaMenu({
  id,
  value,
  onChange,
  factories,
  slides
}) {
  /** Mega menu slide selector used in the top header (dropdown-only UI). */

  const [open, setOpen] = useState(false);
  const [activePanel, setActivePanel] = useState("groups"); // "groups" | "items"
  const [groupIndex, setGroupIndex] = useState(0);
  const [itemIndex, setItemIndex] = useState(0);

  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const groupsListRef = useRef(null);
  const itemsListRef = useRef(null);

  const safeFactories = useMemo(() => (Array.isArray(factories) ? factories : []), [factories]);
  const safeSlides = useMemo(() => (Array.isArray(slides) ? slides : []), [slides]);

  const constants = useMemo(() => {
    return {
      GLOBAL_COVER_ID: "__global_cover__",
      GLOBAL_LAST_ID: "__global_last__",
      SKILL_FACTORY_SLIDE1_PREFIX: "__skill_factory_slide1__:",
      SKILL_FACTORY_SLIDE2_PREFIX: "__skill_factory_slide2__:",
      SKILL_FACTORY_SLIDE3_PREFIX: "__skill_factory_slide3__:",
      SKILL_FACTORY_SLIDE4_PREFIX: "__skill_factory_slide4__:"
    };
  }, []);

  function getFactoryDisplayName(factory, idx1Based) {
    const n = factory?.slides?.slide1?.factoryName?.trim() || factory?.name?.trim?.() || `Skill Factory ${idx1Based}`;
    return n;
  }

  const normalStartNo = useMemo(() => 2 + safeFactories.length * 4, [safeFactories.length]);

  const groups = useMemo(() => {
    /** @type {{id:string, kind:string, label:string, meta?:any}[]} */
    const g = [];
    g.push({ id: "global_cover", kind: "global_cover", label: "Global Cover" });

    safeFactories.forEach((f, idx) => {
      g.push({
        id: `sf:${f.id}`,
        kind: "skill_factory",
        label: getFactoryDisplayName(f, idx + 1),
        meta: { factoryId: f.id }
      });
    });

    g.push({ id: "normal_slides", kind: "normal", label: "Normal Slides" });
    g.push({ id: "global_last", kind: "global_last", label: "Global Last Page" });
    return g;
  }, [safeFactories]);

  const groupItemsFor = useCallback(
    (group) => {
      if (!group) return [];

      if (group.kind === "global_cover") {
        return [{ value: constants.GLOBAL_COVER_ID, label: "Global Cover" }];
      }

      if (group.kind === "global_last") {
        return [{ value: constants.GLOBAL_LAST_ID, label: "Global Last Page" }];
      }

      if (group.kind === "normal") {
        return safeSlides.map((s, idx) => {
          const n = normalStartNo + idx;
          const title = s?.title?.trim() ? s.title : `Untitled slide ${n}`;
          return { value: s.id, label: `Slide ${n} — ${title}` };
        });
      }

      if (group.kind === "skill_factory") {
        const factoryId = group?.meta?.factoryId;
        return [
          { value: `${constants.SKILL_FACTORY_SLIDE1_PREFIX}${factoryId}`, label: "Slide 1" },
          { value: `${constants.SKILL_FACTORY_SLIDE2_PREFIX}${factoryId}`, label: "Slide 2" },
          { value: `${constants.SKILL_FACTORY_SLIDE3_PREFIX}${factoryId}`, label: "Slide 3" },
          { value: `${constants.SKILL_FACTORY_SLIDE4_PREFIX}${factoryId}`, label: "Slide 4" }
        ];
      }

      return [];
    },
    [constants, normalStartNo, safeSlides]
  );

  const selectedGroupIndexFromValue = useMemo(() => {
    if (value === constants.GLOBAL_COVER_ID) return 0;
    if (value === constants.GLOBAL_LAST_ID) return groups.findIndex((g) => g.kind === "global_last");

    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE1_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE1_PREFIX.length);
      return groups.findIndex((g) => g.kind === "skill_factory" && g?.meta?.factoryId === id);
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE2_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE2_PREFIX.length);
      return groups.findIndex((g) => g.kind === "skill_factory" && g?.meta?.factoryId === id);
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE3_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE3_PREFIX.length);
      return groups.findIndex((g) => g.kind === "skill_factory" && g?.meta?.factoryId === id);
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE4_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE4_PREFIX.length);
      return groups.findIndex((g) => g.kind === "skill_factory" && g?.meta?.factoryId === id);
    }

    // Normal slide ids live in safeSlides
    if (safeSlides.some((s) => s?.id === value)) return groups.findIndex((g) => g.kind === "normal");

    return 0;
  }, [value, groups, constants, safeSlides]);

  const selectedItemIndexFromValue = useMemo(() => {
    const g = groups[selectedGroupIndexFromValue] || groups[0];
    const items = groupItemsFor(g);
    const idx = items.findIndex((it) => it.value === value);
    return idx >= 0 ? idx : 0;
  }, [groups, selectedGroupIndexFromValue, value, groupItemsFor]);

  const currentGroup = groups[groupIndex] || groups[0];
  const currentItems = useMemo(() => groupItemsFor(currentGroup), [currentGroup, groupItemsFor]);

  const selectedLabel = useMemo(() => {
    // For the button label, prefer an informative label:
    // - Global cover/last use their own label
    // - Skill factory: "Factory name — Slide N"
    // - Normal slides: "Slide N — Title"
    if (value === constants.GLOBAL_COVER_ID) return "Global Cover";
    if (value === constants.GLOBAL_LAST_ID) return "Global Last Page";

    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE1_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE1_PREFIX.length);
      const idx = safeFactories.findIndex((f) => f.id === id);
      const name = getFactoryDisplayName(safeFactories[idx], idx >= 0 ? idx + 1 : 1);
      return `${name} — Slide 1`;
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE2_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE2_PREFIX.length);
      const idx = safeFactories.findIndex((f) => f.id === id);
      const name = getFactoryDisplayName(safeFactories[idx], idx >= 0 ? idx + 1 : 1);
      return `${name} — Slide 2`;
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE3_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE3_PREFIX.length);
      const idx = safeFactories.findIndex((f) => f.id === id);
      const name = getFactoryDisplayName(safeFactories[idx], idx >= 0 ? idx + 1 : 1);
      return `${name} — Slide 3`;
    }
    if (typeof value === "string" && value.startsWith(constants.SKILL_FACTORY_SLIDE4_PREFIX)) {
      const id = value.slice(constants.SKILL_FACTORY_SLIDE4_PREFIX.length);
      const idx = safeFactories.findIndex((f) => f.id === id);
      const name = getFactoryDisplayName(safeFactories[idx], idx >= 0 ? idx + 1 : 1);
      return `${name} — Slide 4`;
    }

    const normalIdx = safeSlides.findIndex((s) => s?.id === value);
    if (normalIdx >= 0) {
      const n = normalStartNo + normalIdx;
      const title = safeSlides[normalIdx]?.title?.trim() ? safeSlides[normalIdx].title : `Untitled slide ${n}`;
      return `Slide ${n} — ${title}`;
    }

    return "Select slide";
  }, [value, constants, safeFactories, safeSlides, normalStartNo]);

  const closeMenu = (opts = { restoreFocus: true }) => {
    setOpen(false);
    setActivePanel("groups");
    if (opts.restoreFocus) {
      window.requestAnimationFrame(() => buttonRef.current?.focus?.());
    }
  };

  const openMenu = () => {
    setOpen(true);
    // Sync focus indices to current selection for a predictable keyboard experience.
    setGroupIndex(Math.max(0, selectedGroupIndexFromValue));
    setItemIndex(Math.max(0, selectedItemIndexFromValue));
    setActivePanel("groups");
  };

  // Close on click outside.
  useEffect(() => {
    if (!open) return;

    const onDocMouseDown = (e) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target)) {
        closeMenu({ restoreFocus: false });
      }
    };

    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  // Focus the groups panel when opened.
  useEffect(() => {
    if (!open) return;
    window.requestAnimationFrame(() => {
      const el = groupsListRef.current?.querySelector?.(`[data-idx="${Math.max(0, groupIndex)}"]`);
      el?.focus?.();
    });
  }, [open, groupIndex]);

  // Ensure the focused row stays visible.
  useEffect(() => {
    if (!open) return;
    const list = activePanel === "groups" ? groupsListRef.current : itemsListRef.current;
    const idx = activePanel === "groups" ? groupIndex : itemIndex;
    const el = list?.querySelector?.(`[data-idx="${Math.max(0, idx)}"]`);
    el?.scrollIntoView?.({ block: "nearest" });
  }, [open, activePanel, groupIndex, itemIndex, currentItems.length, groups.length]);

  const hasSubmenu = currentGroup?.kind === "skill_factory" || currentGroup?.kind === "normal";
  const rightPanelTitle =
    currentGroup?.kind === "global_cover"
      ? "Global Cover"
      : currentGroup?.kind === "global_last"
        ? "Global Last Page"
        : currentGroup?.kind === "normal"
          ? "Normal Slides"
          : currentGroup?.kind === "skill_factory"
            ? "Slides"
            : "Slides";

  const onSelectValue = (nextValue) => {
    if (!nextValue) return;
    onChange?.(nextValue);
    closeMenu({ restoreFocus: true });
  };

  const onButtonKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!open) openMenu();
    }
  };

  const onMenuKeyDown = (e) => {
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      closeMenu({ restoreFocus: true });
      return;
    }

    if (e.key === "Tab") {
      // Keep it simple: allow tab to move focus out, but close the menu.
      closeMenu({ restoreFocus: false });
      return;
    }

    if (activePanel === "groups") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setGroupIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setGroupIndex((i) => Math.min(groups.length - 1, i + 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        // Move into items panel; for non-submenu groups, treat as select.
        if (currentGroup?.kind === "global_cover") onSelectValue(constants.GLOBAL_COVER_ID);
        else if (currentGroup?.kind === "global_last") onSelectValue(constants.GLOBAL_LAST_ID);
        else {
          setActivePanel("items");
          // Reset item focus to selection if group matches, else first.
          const targetGroup = groups[groupIndex];
          const items = groupItemsFor(targetGroup);
          const idx = items.findIndex((it) => it.value === value);
          setItemIndex(idx >= 0 ? idx : 0);
          window.requestAnimationFrame(() => {
            const el = itemsListRef.current?.querySelector?.(`[data-idx="${idx >= 0 ? idx : 0}"]`);
            el?.focus?.();
          });
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (currentGroup?.kind === "global_cover") onSelectValue(constants.GLOBAL_COVER_ID);
        else if (currentGroup?.kind === "global_last") onSelectValue(constants.GLOBAL_LAST_ID);
        else {
          setActivePanel("items");
          const targetGroup = groups[groupIndex];
          const items = groupItemsFor(targetGroup);
          const idx = items.findIndex((it) => it.value === value);
          setItemIndex(idx >= 0 ? idx : 0);
          window.requestAnimationFrame(() => {
            const el = itemsListRef.current?.querySelector?.(`[data-idx="${idx >= 0 ? idx : 0}"]`);
            el?.focus?.();
          });
        }
      } else if (e.key === "ArrowLeft") {
        // noop (already left-most)
      }
    } else if (activePanel === "items") {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setItemIndex((i) => Math.max(0, i - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setItemIndex((i) => Math.min(Math.max(0, currentItems.length - 1), i + 1));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActivePanel("groups");
        window.requestAnimationFrame(() => {
          const el = groupsListRef.current?.querySelector?.(`[data-idx="${Math.max(0, groupIndex)}"]`);
          el?.focus?.();
        });
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = currentItems[itemIndex];
        if (item) onSelectValue(item.value);
      } else if (e.key === "ArrowRight") {
        // noop (already right-most)
      }
    }
  };

  return (
    <div className="smRoot" ref={rootRef} onKeyDown={onMenuKeyDown}>
      <button
        id={id}
        ref={buttonRef}
        type="button"
        className="select smButton"
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
        onClick={() => (open ? closeMenu({ restoreFocus: true }) : openMenu())}
        onKeyDown={onButtonKeyDown}
      >
        <span className="smButtonLabel">{selectedLabel}</span>
        <span className="smButtonChevron" aria-hidden="true">▾</span>
      </button>

      {open ? (
        <div className="smMenu" role="menu" aria-label="Slide selector">
          <div className="smPanel smPanelGroups" aria-label="Groups">
            <div className="smPanelHeader">Groups</div>
            <div className="smList" ref={groupsListRef} role="presentation">
              {groups.map((g, idx) => {
                const isActive = idx === groupIndex;
                const isSelected = idx === selectedGroupIndexFromValue;
                const isAction = g.kind === "global_cover" || g.kind === "global_last";
                const showArrow = !isAction;

                const separatorAbove =
                  idx > 0 &&
                  ((g.kind === "skill_factory" && groups[idx - 1].kind !== "skill_factory") ||
                    (g.kind === "normal" && groups[idx - 1].kind !== "normal") ||
                    (g.kind === "global_last" && groups[idx - 1].kind !== "global_last"));

                return (
                  <div key={g.id} role="presentation">
                    {separatorAbove ? <div className="smSeparator" role="separator" /> : null}

                    <button
                      type="button"
                      className={`smRow ${isActive ? "smRowActive" : ""} ${isSelected ? "smRowSelected" : ""}`}
                      data-idx={idx}
                      onMouseEnter={() => {
                        setGroupIndex(idx);
                        setActivePanel("groups");
                        setItemIndex(0);
                      }}
                      onFocus={() => {
                        setGroupIndex(idx);
                        setActivePanel("groups");
                        setItemIndex(0);
                      }}
                      onClick={() => {
                        if (g.kind === "global_cover") onSelectValue(constants.GLOBAL_COVER_ID);
                        else if (g.kind === "global_last") onSelectValue(constants.GLOBAL_LAST_ID);
                        else {
                          setGroupIndex(idx);
                          setActivePanel("items");
                          const items = groupItemsFor(g);
                          const selIdx = items.findIndex((it) => it.value === value);
                          setItemIndex(selIdx >= 0 ? selIdx : 0);
                          window.requestAnimationFrame(() => {
                            const el = itemsListRef.current?.querySelector?.(`[data-idx="${selIdx >= 0 ? selIdx : 0}"]`);
                            el?.focus?.();
                          });
                        }
                      }}
                    >
                      <span className="smRowLabel">{g.label}</span>
                      <span className="smRowMeta">
                        {g.kind === "skill_factory" ? "4" : g.kind === "normal" ? String(safeSlides.length) : ""}
                      </span>
                      <span className="smRowArrow" aria-hidden="true">
                        {showArrow ? "›" : ""}
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="smPanel smPanelItems" aria-label="Slides">
            <div className="smPanelHeader">
              {currentGroup?.kind === "skill_factory" ? (
                <span className="smHeaderTitle">{currentGroup.label}</span>
              ) : (
                <span className="smHeaderTitle">{rightPanelTitle}</span>
              )}
              <span className="smHeaderHint">Enter to select</span>
            </div>

            <div className="smList" ref={itemsListRef} role="presentation">
              {currentItems.length === 0 ? (
                <div className="smEmpty" role="note">
                  {currentGroup?.kind === "normal" ? "No normal slides yet." : hasSubmenu ? "No slides." : "Select a group."}
                </div>
              ) : (
                currentItems.map((it, idx) => {
                  const isActive = activePanel === "items" && idx === itemIndex;
                  const isSelected = it.value === value;

                  return (
                    <button
                      key={it.value}
                      type="button"
                      className={`smRow ${isActive ? "smRowActive" : ""} ${isSelected ? "smRowSelected" : ""}`}
                      data-idx={idx}
                      onMouseEnter={() => {
                        setItemIndex(idx);
                        setActivePanel("items");
                      }}
                      onFocus={() => {
                        setItemIndex(idx);
                        setActivePanel("items");
                      }}
                      onClick={() => onSelectValue(it.value)}
                    >
                      <span className="smRowLabel">{it.label}</span>
                      <span className="smRowArrow" aria-hidden="true">{isSelected ? "✓" : ""}</span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="smFooter" role="note">
            <span className="smKbd">↑/↓</span> move • <span className="smKbd">←/→</span> panel • <span className="smKbd">Esc</span> close
          </div>
        </div>
      ) : null}
    </div>
  );
}
