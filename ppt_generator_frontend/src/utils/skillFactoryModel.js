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
  /** Load skill factory state from localStorage if available. */
  try {
    const raw = window.localStorage.getItem(LS_SKILL_FACTORY_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    const safeFactories = Array.isArray(parsed?.factories) ? parsed.factories : [];
    const normalized = safeFactories.map((f) => {
      const base = createDefaultSkillFactory();
      return {
        ...base,
        ...f,
        id: f?.id || base.id,
        slides: {
          slide1: {
            ...base.slides.slide1,
            ...(f?.slides?.slide1 || {}),
            highlights: Array.isArray(f?.slides?.slide1?.highlights) ? f.slides.slide1.highlights : base.slides.slide1.highlights,
            lowlights: Array.isArray(f?.slides?.slide1?.lowlights) ? f.slides.slide1.lowlights : base.slides.slide1.lowlights,
            teamMembers: Array.isArray(f?.slides?.slide1?.teamMembers)
              ? f.slides.slide1.teamMembers.map((m) => ({
                  name: (m?.name || "").toString(),
                  role: (m?.role || "").toString()
                }))
              : base.slides.slide1.teamMembers,
            prevWeekActivities: Array.isArray(f?.slides?.slide1?.prevWeekActivities)
              ? f.slides.slide1.prevWeekActivities
              : base.slides.slide1.prevWeekActivities,
            currentWeekActivities: Array.isArray(f?.slides?.slide1?.currentWeekActivities)
              ? f.slides.slide1.currentWeekActivities
              : base.slides.slide1.currentWeekActivities
          },
          slide2: {
            ...base.slides.slide2,
            ...(f?.slides?.slide2 || {}),
            metricsImages: Array.isArray(f?.slides?.slide2?.metricsImages)
              ? f.slides.slide2.metricsImages.map((img) => ({
                  objectUrl: (img?.objectUrl || "").toString(),
                  fileName: (img?.fileName || "").toString(),
                  width: Number(img?.width) || 0,
                  height: Number(img?.height) || 0
                }))
              : base.slides.slide2.metricsImages
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
