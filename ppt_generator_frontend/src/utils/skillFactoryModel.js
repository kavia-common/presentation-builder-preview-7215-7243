/**
 * Skill Factory model helpers (plain JS; no backend).
 *
 * Stores an array of "factories". Each factory currently supports:
 * - Slide 1 only (future slides 2–4 can be added later under factory.slides.*)
 */

export const DEFAULT_SKILL_FACTORY_SLIDE1 = {
  factoryName: "Digital Applications: Data Engineering Skill Factory",
  sprintLabel: "Sprint 12 (25-Dec - 01-Jan)",
  highlights: ["Improved data quality checks in ingestion pipeline"],
  lowlights: ["Delay due to upstream schema changes"],
  teamMembers: [
    { name: "Name", role: "Role" },
    { name: "Name", role: "Role" },
    { name: "Name", role: "Role" }
  ],
  prevWeekActivities: ["Completed data model refactoring", "Fixed pipeline failures"],
  currentWeekActivities: ["Work on POC - Talent management dashboard", "Sprint planning / backlog grooming"]
};

export const DEFAULT_SKILL_FACTORY = {
  id: "sf_" + Math.random().toString(16).slice(2),
  // Keep all slide-specific payloads nested so future slides are easy to add.
  slides: {
    slide1: { ...DEFAULT_SKILL_FACTORY_SLIDE1 },
    // Slide 2 is image-only metrics (PNG/JPG). Stored as object URLs for preview/export.
    slide2: {
      metricsImages: []
    },
    /**
     * Slide 3: tabular "Continuous Assessment - RMG" style slide.
     * Based on reference: a title line, a wide table, and a bottom blue band.
     *
     * IMPORTANT: rows are stored as string[][] (array-of-cells), so columns can be fully dynamic.
     */
    slide3: {
      title: "Data Engineering : Continuous Assessment - RMG",
      columns: ["Domain", "Sub domain", "Capability", "Talent Pipeline", "Status", "Total Resource Count"],
      rows: [
        [
          "RMG",
          "RMG",
          "Skills / Competency",
          "Talent pipeline is mapped against the capability and current sprint planned to have new candidates screened.",
          "Active",
          "15"
        ],
        [
          "RMG",
          "RMG",
          "Learning / Training",
          "Training pipeline is planned for new joiners; skills uplift mapped to sprint cadence and role expectations.",
          "Active",
          "15"
        ]
      ],
      // Visuals
      bottomBandColor: "#2F78A8"
    },
    /**
     * Slide 4: "Feedback & Revised Rating" table slide.
     * Matches reference: a title, a table with dark-blue header row, and a bottom blue band.
     *
     * IMPORTANT: rows are stored as string[][] (array-of-cells), so columns can be dynamic.
     */
    slide4: {
      title: "Data Engineering : Feedback & Revised Rating",
      columns: ["Domain", "Sub domain", "Capability", "Training sessions / feedback", "Rating/Scale", "Comments"],
      rows: [
        [
          "RMG",
          "RMG",
          "Skills / Competency",
          "Training sessions planned and feedback captured from participants.",
          "Good",
          "As per feedback"
        ],
        [
          "RMG",
          "RMG",
          "Learning / Training",
          "Sessions conducted; feedback consolidated and actions identified.",
          "Good",
          "As per feedback"
        ]
      ],
      bottomBandColor: "#2F78A8"
    }
  }
};

const LS_SKILL_FACTORY_KEY = "pptgen_skill_factories_v1";

// PUBLIC_INTERFACE
export function createDefaultSkillFactory() {
  /** Create a new Skill Factory group instance with Slide 1 defaults. */
  return {
    ...DEFAULT_SKILL_FACTORY,
    id: `sf_${Math.random().toString(16).slice(2)}`,
    slides: {
      slide1: {
        ...DEFAULT_SKILL_FACTORY_SLIDE1,
        highlights: [...DEFAULT_SKILL_FACTORY_SLIDE1.highlights],
        lowlights: [...DEFAULT_SKILL_FACTORY_SLIDE1.lowlights],
        teamMembers: DEFAULT_SKILL_FACTORY_SLIDE1.teamMembers.map((m) => ({ ...m })),
        prevWeekActivities: [...DEFAULT_SKILL_FACTORY_SLIDE1.prevWeekActivities],
        currentWeekActivities: [...DEFAULT_SKILL_FACTORY_SLIDE1.currentWeekActivities]
      },
      slide2: {
        metricsImages: []
      },
      slide3: {
        title: DEFAULT_SKILL_FACTORY.slides.slide3.title,
        columns: [...DEFAULT_SKILL_FACTORY.slides.slide3.columns],
        rows: DEFAULT_SKILL_FACTORY.slides.slide3.rows.map((r) => (Array.isArray(r) ? [...r] : [])),
        bottomBandColor: DEFAULT_SKILL_FACTORY.slides.slide3.bottomBandColor
      },
      slide4: {
        title: DEFAULT_SKILL_FACTORY.slides.slide4.title,
        columns: [...DEFAULT_SKILL_FACTORY.slides.slide4.columns],
        rows: DEFAULT_SKILL_FACTORY.slides.slide4.rows.map((r) => (Array.isArray(r) ? [...r] : [])),
        bottomBandColor: DEFAULT_SKILL_FACTORY.slides.slide4.bottomBandColor
      }
    }
  };
}

// PUBLIC_INTERFACE
export function createDefaultSkillFactoryState() {
  /** Create the default persisted container for skill factories. */
  return { factories: [] };
}

// PUBLIC_INTERFACE
export function loadSkillFactoriesFromStorage() {
  /** Load skill factory state from localStorage if available (never auto-seed defaults). */
  try {
    const raw = window.localStorage.getItem(LS_SKILL_FACTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const safeFactories = Array.isArray(parsed?.factories) ? parsed.factories : [];

    // IMPORTANT:
    // We intentionally do NOT use `createDefaultSkillFactory()` as a base during normalization,
    // because that would effectively "seed" a default Skill Factory payload when any partial
    // record exists (or when legacy data is missing some fields). This project must support
    // zero factories and must never inject a default factory implicitly.
    const normalized = safeFactories
      .filter(Boolean)
      .map((f) => {
        const id = (f?.id || `sf_${Math.random().toString(16).slice(2)}`).toString();

        const slide1 = f?.slides?.slide1 || {};
        const slide2 = f?.slides?.slide2 || {};
        const slide3 = f?.slides?.slide3 || {};
        const slide4 = f?.slides?.slide4 || {};

        return {
          ...f,
          id,
          slides: {
            // Slide 1: normalize types, but do not inject default text.
            slide1: {
              ...slide1,
              factoryName: (slide1?.factoryName || "").toString(),
              sprintLabel: (slide1?.sprintLabel || "").toString(),
              highlights: Array.isArray(slide1?.highlights) ? slide1.highlights.map((x) => (x ?? "").toString()) : [],
              lowlights: Array.isArray(slide1?.lowlights) ? slide1.lowlights.map((x) => (x ?? "").toString()) : [],
              teamMembers: Array.isArray(slide1?.teamMembers)
                ? slide1.teamMembers.map((m) => ({
                    name: (m?.name || "").toString(),
                    role: (m?.role || "").toString()
                  }))
                : [],
              prevWeekActivities: Array.isArray(slide1?.prevWeekActivities)
                ? slide1.prevWeekActivities.map((x) => (x ?? "").toString())
                : [],
              currentWeekActivities: Array.isArray(slide1?.currentWeekActivities)
                ? slide1.currentWeekActivities.map((x) => (x ?? "").toString())
                : []
            },

            // Slide 2: image-only metrics. If none, empty array.
            slide2: {
              ...slide2,
              metricsImages: Array.isArray(slide2?.metricsImages)
                ? slide2.metricsImages.map((img) => ({
                    objectUrl: (img?.objectUrl || "").toString(),
                    fileName: (img?.fileName || "").toString(),
                    width: Number(img?.width) || 0,
                    height: Number(img?.height) || 0
                  }))
                : []
            },

            // Slide 3: table slide. Keep user content if present; otherwise empty-but-valid.
            slide3: {
              ...slide3,
              title: (slide3?.title || "").toString(),
              bottomBandColor: (slide3?.bottomBandColor || "#2F78A8").toString(),
              columns: Array.isArray(slide3?.columns) ? slide3.columns.map((c) => (c || "").toString()) : [],
              rows: Array.isArray(slide3?.rows)
                ? slide3.rows.map((r) => {
                    if (Array.isArray(r)) return r.map((c) => (c || "").toString());
                    // Legacy object format: best-effort mapping
                    return [
                      (r?.domain || "").toString(),
                      (r?.subDomain || "").toString(),
                      (r?.capability || "").toString(),
                      (r?.talentPipeline || "").toString(),
                      (r?.status || "").toString(),
                      (r?.totalResourceCount || "").toString()
                    ];
                  })
                : []
            },

            // Slide 4: table slide. Keep user content if present; otherwise empty-but-valid.
            slide4: {
              ...slide4,
              title: (slide4?.title || "").toString(),
              bottomBandColor: (slide4?.bottomBandColor || "#2F78A8").toString(),
              columns: Array.isArray(slide4?.columns) ? slide4.columns.map((c) => (c || "").toString()) : [],
              rows: Array.isArray(slide4?.rows)
                ? slide4.rows.map((r) => {
                    if (Array.isArray(r)) return r.map((c) => (c || "").toString());
                    return [
                      (r?.domain || "").toString(),
                      (r?.subDomain || "").toString(),
                      (r?.capability || "").toString(),
                      (r?.trainingSessions || r?.training || r?.feedback || "").toString(),
                      (r?.rating || r?.scale || "").toString(),
                      (r?.comments || "").toString()
                    ];
                  })
                : []
            }
          }
        };
      });

    return { factories: normalized };
  } catch (_e) {
    return null;
  }
}

// PUBLIC_INTERFACE
export function saveSkillFactoriesToStorage(state) {
  /** Save skill factory state to localStorage. */
  try {
    const toSave = {
      factories: Array.isArray(state?.factories) ? state.factories : []
    };
    window.localStorage.setItem(LS_SKILL_FACTORY_KEY, JSON.stringify(toSave));
  } catch (_e) {
    // ignore storage errors
  }
}

// PUBLIC_INTERFACE
export function upsertSkillFactory(state, factoryId, patch) {
  /**
   * Update a Skill Factory by id. Returns new state (immutable).
   * @param {{factories:Array}} state
   * @param {string} factoryId
   * @param {Object|function} patch - partial factory patch or (prevFactory)=>nextFactory
   */
  const factories = Array.isArray(state?.factories) ? state.factories : [];
  const nextFactories = factories.map((f) => {
    if (f.id !== factoryId) return f;
    const next = typeof patch === "function" ? patch(f) : { ...f, ...patch };
    return next;
  });
  return { factories: nextFactories };
}
