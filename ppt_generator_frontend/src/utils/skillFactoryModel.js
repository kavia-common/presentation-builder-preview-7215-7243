/**
 * Skill Factory model helpers (plain JS; no backend).
 *
 * IMPORTANT PRODUCT RULES
 * - The app must support ZERO skill factories.
 * - No factory data is auto-seeded on load.
 * - If legacy/default factory data exists in localStorage, it must be purged safely
 *   without affecting any other user data (cover/last/normal slides).
 */

const LS_SKILL_FACTORY_KEY = "pptgen_skill_factories_v1";

/**
 * Legacy "default" seed detector:
 * Earlier versions shipped a default slide1 payload titled:
 * "Digital Applications: Data Engineering Skill Factory"
 *
 * We must remove these seeded factories from storage so users start with zero.
 */
const LEGACY_DEFAULT_FACTORY_NAME = "Digital Applications: Data Engineering Skill Factory";

/**
 * @param {any} factory
 * @returns {boolean}
 */
function isLikelyLegacyDefaultFactory(factory) {
  const name = factory?.slides?.slide1?.factoryName;
  if (typeof name !== "string") return false;
  return name.trim() === LEGACY_DEFAULT_FACTORY_NAME;
}

/**
 * Normalize a factory object WITHOUT injecting any defaults.
 * This keeps user content, but ensures expected types exist so the UI/export do not crash.
 *
 * @param {any} f
 * @returns {object}
 */
function normalizeFactoryNoDefaults(f) {
  const id = (f?.id || `sf_${Math.random().toString(16).slice(2)}`).toString();

  const slide1 = f?.slides?.slide1 || {};
  const slide2 = f?.slides?.slide2 || {};
  const slide3 = f?.slides?.slide3 || {};
  const slide4 = f?.slides?.slide4 || {};

  return {
    ...f,
    id,
    slides: {
      // Slide 1: text
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

      // Slide 2: image-only metrics
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

      // Slide 3: table slide (no seeded table)
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

      // Slide 4: table slide (no seeded table)
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
}

// PUBLIC_INTERFACE
export function createDefaultSkillFactory() {
  /**
   * Create a new, EMPTY Skill Factory group instance.
   *
   * IMPORTANT: This must NOT seed a pre-filled template. Users must explicitly add content.
   */
  return {
    id: `sf_${Math.random().toString(16).slice(2)}`,
    slides: {
      slide1: {
        factoryName: "",
        sprintLabel: "",
        highlights: [],
        lowlights: [],
        teamMembers: [],
        prevWeekActivities: [],
        currentWeekActivities: []
      },
      slide2: {
        metricsImages: []
      },
      slide3: {
        title: "",
        columns: [],
        rows: [],
        bottomBandColor: "#2F78A8"
      },
      slide4: {
        title: "",
        columns: [],
        rows: [],
        bottomBandColor: "#2F78A8"
      }
    }
  };
}

// PUBLIC_INTERFACE
export function createDefaultSkillFactoryState() {
  /** Create the default persisted container for skill factories (supports zero). */
  return { factories: [] };
}

// PUBLIC_INTERFACE
export function sanitizeSkillFactoriesInStorage() {
  /**
   * Purge legacy/default Skill Factory seeded data from localStorage, without touching
   * other persisted user data (cover/last/normal slides).
   *
   * Safe behavior:
   * - If key is missing or invalid JSON: no-op.
   * - If factories exist and any match the known legacy default name, remove only those.
   * - If after filtering there are zero factories, persist {factories: []} to stop UI from showing them.
   */
  try {
    const raw = window.localStorage.getItem(LS_SKILL_FACTORY_KEY);
    if (!raw) return;

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (_e) {
      // Malformed data: do not overwrite; just leave it.
      return;
    }

    if (!parsed || typeof parsed !== "object") return;

    const factories = Array.isArray(parsed.factories) ? parsed.factories : [];
    if (factories.length === 0) return;

    const filtered = factories.filter((f) => !isLikelyLegacyDefaultFactory(f));

    // Only write back if we actually removed something.
    if (filtered.length !== factories.length) {
      window.localStorage.setItem(LS_SKILL_FACTORY_KEY, JSON.stringify({ factories: filtered }));
    }
  } catch (_e) {
    // ignore storage errors
  }
}

// PUBLIC_INTERFACE
export function loadSkillFactoriesFromStorage() {
  /**
   * Load skill factory state from localStorage if available.
   * - Never auto-seeds defaults
   * - Normalizes without injecting template content
   */
  try {
    const raw = window.localStorage.getItem(LS_SKILL_FACTORY_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const safeFactories = Array.isArray(parsed?.factories) ? parsed.factories : [];

    const normalized = safeFactories
      .filter(Boolean)
      // extra guard: never let the known legacy seeded factory survive
      .filter((f) => !isLikelyLegacyDefaultFactory(f))
      .map((f) => normalizeFactoryNoDefaults(f));

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
