import PptxGenJS from "pptxgenjs";
import { THEME_PRESETS } from "./slideModel";

/**
 * Convert a hex color (#RRGGBB) into PptxGenJS-compatible color string (RRGGBB).
 */
function hexToPptxColor(hex) {
  const cleaned = (hex || "").replace("#", "").trim();
  if (cleaned.length === 3) {
    // Expand short form e.g. #abc -> aabbcc
    return cleaned
      .split("")
      .map((c) => c + c)
      .join("")
      .toUpperCase();
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

function splitLines(text) {
  return (text || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function objectUrlToDataUrl(objectUrl) {
  const resp = await fetch(objectUrl);
  const blob = await resp.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

async function addCoverSlide(pptx, cover) {
  // 13.333 x 7.5 inches for LAYOUT_WIDE
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  const s = pptx.addSlide();

  // If an image exists, use it as full-bleed background.
  if (cover?.backgroundImage?.objectUrl) {
    try {
      const dataUrl = await objectUrlToDataUrl(cover.backgroundImage.objectUrl);

      const fitted = fitSize({
        srcW: cover.backgroundImage.width || 1600,
        srcH: cover.backgroundImage.height || 900,
        maxW: SLIDE_W,
        maxH: SLIDE_H
      });

      // Center-crop style: we fill by scaling up so that it covers the slide.
      // PptxGenJS doesn't crop easily; we approximate by using "contain" sizing to fill.
      // Use full-bleed with slide dimensions for simplicity (works well for wide photos).
      s.addImage({ data: dataUrl, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
    } catch (_e) {
      // If background image fails, fall back to a solid background.
      s.background = { color: "FFFFFF" };
    }
  } else {
    s.background = { color: "FFFFFF" };
  }

  // Left overlay panel (approximate screenshot: deep blue with slight transparency)
  const panelW = 6.2;
  const primary = hexToPptxColor(cover?.primaryColor || "#2563EB");

  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: panelW,
    h: SLIDE_H,
    fill: { color: primary, transparency: 15 },
    line: { color: primary, transparency: 100 }
  });

  // Text block
  const title = (cover?.title || "").trim();
  const subtitle = (cover?.subtitle || "").trim();
  const taglineLines = splitLines(cover?.tagline);

  const x = 0.6;
  const y = 1.55;

  // Title (bold)
  s.addText(title, {
    x,
    y,
    w: panelW - 1.2,
    h: 0.7,
    fontSize: 30,
    bold: true,
    color: "FFFFFF"
  });

  // Subtitle (smaller)
  if (subtitle) {
    s.addText(subtitle, {
      x,
      y: y + 0.7,
      w: panelW - 1.2,
      h: 0.5,
      fontSize: 14,
      color: "DDE7FF"
    });
  }

  // Tagline (stacked lines)
  if (taglineLines.length) {
    s.addText(taglineLines.join("\n"), {
      x,
      y: y + 1.25,
      w: panelW - 1.2,
      h: 1.2,
      fontSize: 13,
      color: "DDE7FF"
    });
  }

  // Small accent dot bottom-right similar to screenshot
  const accent = hexToPptxColor(cover?.secondaryColor || "#F59E0B");
  s.addShape(pptx.ShapeType.ellipse, {
    x: SLIDE_W - 0.55,
    y: SLIDE_H - 0.55,
    w: 0.22,
    h: 0.22,
    fill: { color: accent },
    line: { color: accent }
  });

  // Simple top-right "TATA" placeholder (no external asset required)
  s.addText("TATA", {
    x: SLIDE_W - 1.35,
    y: 0.25,
    w: 1.0,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: "FFFFFF"
  });
}

// PUBLIC_INTERFACE
export async function exportSlidesToPptx({ cover, slides }) {
  /**
   * Generate a PPTX file from slide data and trigger download (client-side).
   * @param {{cover: Object, slides: Array}} payload - cover + slide objects from state.
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

  // Slide 1: Global Cover
  await addCoverSlide(pptx, cover);

  // Remaining slides
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
        const dataUrl = await objectUrlToDataUrl(slideData.image.objectUrl);

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
      } catch (_e) {
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
