/**
 * Global cover slide model helpers (plain JS; no backend).
 */

export const DEFAULT_COVER = {
  title: "TATA ELXSI",
  subtitle: "Name : Subrata B",
  tagline: "Date : 2 Dec 2023\nDigital KRG Weekly Metrics",
  backgroundImage: {
    objectUrl: "",
    fileName: "",
    width: 0,
    height: 0
  },
  // Ocean Professional palette defaults
  primaryColor: "#2563EB",
  secondaryColor: "#F59E0B"
};

const LS_COVER_KEY = "pptgen_global_cover_v1";

/**
 * PUBLIC_INTERFACE
 */
export function createDefaultCover() {
  /** Create a default global cover slide object. */
  return { ...DEFAULT_COVER, backgroundImage: { ...DEFAULT_COVER.backgroundImage } };
}

/**
 * PUBLIC_INTERFACE
 */
export function loadCoverFromStorage() {
  /** Load global cover state from localStorage if available. */
  try {
    const raw = window.localStorage.getItem(LS_COVER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);

    // Object URLs cannot be persisted; reset image objectUrl on load.
    const safe = {
      ...createDefaultCover(),
      ...parsed,
      backgroundImage: {
        ...createDefaultCover().backgroundImage,
        ...(parsed.backgroundImage || {}),
        objectUrl: ""
      }
    };

    // Normalize colors
    if (!safe.primaryColor) safe.primaryColor = DEFAULT_COVER.primaryColor;
    if (!safe.secondaryColor) safe.secondaryColor = DEFAULT_COVER.secondaryColor;

    return safe;
  } catch (_e) {
    return null;
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function saveCoverToStorage(cover) {
  /** Save global cover state to localStorage (excluding non-serializable object URLs). */
  try {
    const toSave = {
      ...cover,
      backgroundImage: {
        ...(cover.backgroundImage || {}),
        objectUrl: "" // never persist objectUrl
      }
    };
    window.localStorage.setItem(LS_COVER_KEY, JSON.stringify(toSave));
  } catch (_e) {
    // ignore storage errors
  }
}

/**
 * PUBLIC_INTERFACE
 */
export function revokeCoverObjectUrl(cover) {
  /** Revoke cover background image object URL if present (memory leak prevention). */
  try {
    if (cover?.backgroundImage?.objectUrl) {
      URL.revokeObjectURL(cover.backgroundImage.objectUrl);
    }
  } catch (_e) {
    // ignore
  }
}
