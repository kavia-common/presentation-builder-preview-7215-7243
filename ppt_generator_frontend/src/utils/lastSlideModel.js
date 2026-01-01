/**
 * Global last page (closing slide) model helpers (plain JS; no backend).
 *
 * Persisted similarly to global cover, but image Object URLs cannot be persisted and are reset on load.
 */

export const DEFAULT_LAST_SLIDE = {
  headline: "THANK YOU",
  tagline: "TATA ELXSI",
  // Small supporting line under the brand (kept optional)
  subhead: "FIND OUT MORE\nhttps://www.tataelxsi.com",
  // Optional logo image (Object URL)
  logoImage: {
    objectUrl: "",
    fileName: "",
    width: 0,
    height: 0
  },
  // Optional full-bleed background image (Object URL)
  backgroundImage: {
    objectUrl: "",
    fileName: "",
    width: 0,
    height: 0
  },
  // Ocean Professional defaults
  backgroundColor: "#FFFFFF",
  headlineColor: "#111827",
  accentColor: "#2563EB",
  taglineColor: "#2563EB",
  subheadColor: "#6B7280"
};

const LS_LAST_KEY = "pptgen_global_last_v1";

/**
 * PUBLIC_INTERFACE
 */
export function createDefaultLastSlide() {
  /** Create a default Global Last Page slide object. */
  return {
    ...DEFAULT_LAST_SLIDE,
    logoImage: { ...DEFAULT_LAST_SLIDE.logoImage },
    backgroundImage: { ...DEFAULT_LAST_SLIDE.backgroundImage }
  };
}

/**
 * PUBLIC_INTERFACE
 */
export function loadLastSlideFromStorage() {
  /** Load Global Last Page state from localStorage if available. */
  try {
    const raw = window.localStorage.getItem(LS_LAST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Object URLs cannot be persisted; reset image objectUrl on load.
    const safe = {
      ...createDefaultLastSlide(),
      ...parsed,
      logoImage: {
        ...createDefaultLastSlide().logoImage,
        ...(parsed.logoImage || {}),
        objectUrl: ""
      },
      backgroundImage: {
        ...createDefaultLastSlide().backgroundImage,
        ...(parsed.backgroundImage || {}),
        objectUrl: ""
      }
    };

    // Normalize colors
    if (!safe.backgroundColor) safe.backgroundColor = DEFAULT_LAST_SLIDE.backgroundColor;
    if (!safe.headlineColor) safe.headlineColor = DEFAULT_LAST_SLIDE.headlineColor;
    if (!safe.accentColor) safe.accentColor = DEFAULT_LAST_SLIDE.accentColor;
    if (!safe.taglineColor) safe.taglineColor = DEFAULT_LAST_SLIDE.taglineColor;
    if (!safe.subheadColor) safe.subheadColor = DEFAULT_LAST_SLIDE.subheadColor;

    return safe;
  } catch (_e) {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function saveLastSlideToStorage(lastSlide) {
  /** Save Global Last Page state to localStorage (excluding non-serializable object URLs). */
  try {
    const toSave = {
      ...lastSlide,
      logoImage: {
        ...(lastSlide.logoImage || {}),
        objectUrl: ""
      },
      backgroundImage: {
        ...(lastSlide.backgroundImage || {}),
        objectUrl: ""
      }
    };
    window.localStorage.setItem(LS_LAST_KEY, JSON.stringify(toSave));
  } catch (_e) {
    // ignore storage errors
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function revokeLastSlideObjectUrls(lastSlide) {
  /** Revoke Global Last Page image Object URLs if present (memory leak prevention). */
  try {
    if (lastSlide?.logoImage?.objectUrl) URL.revokeObjectURL(lastSlide.logoImage.objectUrl);
  } catch (_e) {
    // ignore
  }
  try {
    if (lastSlide?.backgroundImage?.objectUrl) URL.revokeObjectURL(lastSlide.backgroundImage.objectUrl);
  } catch (_e) {
    // ignore
  }
}
