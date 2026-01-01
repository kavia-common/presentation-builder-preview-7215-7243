import PptxGenJS from "pptxgenjs";
import { THEME_PRESETS } from "./slideModel";

/**
 * Convert a hex color (#RRGGBB) into PptxGenJS-compatible color string (RRGGBB).
 */
function hexToPptxColor(hex) {
  const cleaned = (hex || "").replace("#", "").trim();
  if (cleaned.length === 3) {
    // Expand short form e.g. #abc -> aabbcc
    return cleaned.split("").map((c) => c + c).join("").toUpperCase();
  }
  return cleaned.padEnd(6, "0").slice(0, 6).toUpperCase();
}

/**
 * Best-effort image sizing to fit into the available area while maintaining aspect ratio.
 */
function fitSize({ srcW, srcH, maxW, maxH }) {
  if (!srcW || !srcH) return { w: maxW, h: maxH };
  const ratio = Math.min(maxW / srcW, maxH / srcH);
  return { w: srcW * ratio, h: srcH * ratio };
}

// PUBLIC_INTERFACE
export async function exportSlidesToPptx(slides) {
  /**
   * Generate a PPTX file from slide data and trigger download (client-side).
   * @param {Array} slides - slide objects from state.
   * @returns {Promise<void>}
   */
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PPT Generator (Frontend-only)";

  // 13.333 x 7.5 inches for LAYOUT_WIDE
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  // Margins and layout regions
  const M = 0.6;
  const leftW = 8.4;
  const rightW = SLIDE_W - (M * 2 + leftW);
  const topY = 0.8;

  for (const slideData of slides) {
    const s = pptx.addSlide();

    const preset = THEME_PRESETS[slideData.theme?.backgroundPresetId] || THEME_PRESETS.surface;
    const bg = preset.background;
    const textColor = slideData.theme?.textColor || preset.text;

    // Background fill
    s.background = { color: hexToPptxColor(bg) };

    // Title
    s.addText(slideData.title || "", {
      x: M,
      y: topY,
      w: leftW,
      h: 0.7,
      fontSize: 34,
      bold: true,
      color: hexToPptxColor(textColor)
    });

    // Subtitle
    if (slideData.subtitle && slideData.subtitle.trim()) {
      s.addText(slideData.subtitle, {
        x: M,
        y: topY + 0.85,
        w: leftW,
        h: 0.5,
        fontSize: 18,
        color: hexToPptxColor(textColor),
        opacity: 0.9
      });
    }

    // Bullets
    const bullets = (slideData.bullets || []).map((b) => (b || "").trim()).filter(Boolean);
    if (bullets.length > 0) {
      const lines = bullets.join("\n");
      s.addText(lines, {
        x: M,
        y: topY + 1.55,
        w: leftW,
        h: SLIDE_H - (topY + 1.55) - 1.0,
        fontSize: 18,
        color: hexToPptxColor(textColor),
        bullet: { indent: 24 },
        paraSpaceAfter: 8
      });
    }

    // Optional image (right column)
    if (slideData.image?.objectUrl) {
      try {
        // PptxGenJS needs data URI or base64; fetch object URL and convert.
        const resp = await fetch(slideData.image.objectUrl);
        const blob = await resp.blob();
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = () => reject(new Error("Failed to read image"));
          reader.onload = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });

        const maxW = rightW;
        const maxH = SLIDE_H - 2.0;
        const fitted = fitSize({
          srcW: slideData.image.width || 1600,
          srcH: slideData.image.height || 900,
          maxW,
          maxH
        });

        const x = M + leftW + 0.3 + (rightW - fitted.w) / 2;
        const y = 1.2 + (maxH - fitted.h) / 2;

        s.addImage({
          data: dataUrl,
          x,
          y,
          w: fitted.w,
          h: fitted.h
        });
      } catch (e) {
        // If image fails, ignore it so export still works
        s.addText("(Image failed to embed)", {
          x: M + leftW + 0.3,
          y: 1.4,
          w: rightW,
          h: 0.4,
          fontSize: 12,
          italic: true,
          color: "EF4444"
        });
      }
    }
  }

  await pptx.writeFile({ fileName: "presentation.pptx" });
}
