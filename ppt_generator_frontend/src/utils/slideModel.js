/**
 * Slide model helpers (plain JS; no backend and no env vars).
 */

export const THEME_PRESETS = {
  primary: {
    id: "primary",
    label: "Primary",
    background: "#2563EB",
    text: "#FFFFFF",
    previewGradient: "linear-gradient(135deg, rgba(37,99,235,0.18), rgba(249,250,251,1))"
  },
  surface: {
    id: "surface",
    label: "Surface",
    background: "#FFFFFF",
    text: "#111827",
    previewGradient: "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(249,250,251,1))"
  },
  background: {
    id: "background",
    label: "Background",
    background: "#F9FAFB",
    text: "#111827",
    previewGradient: "linear-gradient(135deg, rgba(37,99,235,0.08), rgba(249,250,251,1))"
  }
};

// PUBLIC_INTERFACE
export function createEmptySlide() {
  /** Create a new slide with sensible defaults. */
  return {
    id: `slide_${Math.random().toString(16).slice(2)}`,
    title: "",
    subtitle: "",
    bullets: ["", "", ""],
    theme: {
      backgroundPresetId: "surface",
      textColor: "#111827"
    },
    image: {
      objectUrl: "",
      fileName: "",
      width: 0,
      height: 0
    }
  };
}

// PUBLIC_INTERFACE
export function validateSlides(slides) {
  /** Validate slides for export: require non-empty title on each slide. */
  const invalidIndices = [];
  slides.forEach((s, idx) => {
    if (!s.title || !s.title.trim()) invalidIndices.push(idx);
  });
  return {
    valid: invalidIndices.length === 0,
    invalidIndices
  };
}
