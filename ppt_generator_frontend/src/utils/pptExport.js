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

function safeFileBaseName(name) {
  // Keep it filesystem-friendly across platforms.
  return (name || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80);
}

function timestampForFileName(d = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}_${hh}${min}`;
}

async function objectUrlToDataUrl(objectUrl) {
  const resp = await fetch(objectUrl);
  if (!resp.ok) {
    throw new Error(`Failed to fetch image (${resp.status})`);
  }
  const blob = await resp.blob();
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
  return dataUrl;
}

function addImageMissingPlaceholder(slide, { x, y, w, h }) {
  // Minimal placeholder: dashed-ish box + message. (No shape dashes in PptxGenJS.)
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: "FFFFFF", transparency: 100 },
    line: { color: "EF4444", transparency: 35, width: 1 }
  });
  slide.addText("Image unavailable", {
    x: x + 0.2,
    y: y + 0.2,
    w: Math.max(0, w - 0.4),
    h: 0.4,
    fontSize: 12,
    italic: true,
    color: "EF4444"
  });
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
  const title = (cover?.title || "").trim() || "Presentation";
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

async function addLastSlide(pptx, last) {
  // 13.333 x 7.5 inches for LAYOUT_WIDE
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  const s = pptx.addSlide();

  const bgColor = hexToPptxColor(last?.backgroundColor || "#FFFFFF");
  s.background = { color: bgColor };

  // Background image (full-bleed)
  if (last?.backgroundImage?.objectUrl) {
    try {
      const dataUrl = await objectUrlToDataUrl(last.backgroundImage.objectUrl);
      s.addImage({ data: dataUrl, x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
    } catch (_e) {
      // ignore; keep solid background
    }
  }

  // Soft wash overlay to match bright screenshot
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: SLIDE_H,
    fill: { color: "FFFFFF", transparency: 25 },
    line: { color: "FFFFFF", transparency: 100 }
  });

  const headline = (last?.headline || "").trim() || "THANK YOU";
  const tagline = (last?.tagline || "").trim();
  const subheadLines = splitLines(last?.subhead);

  const headlineColor = hexToPptxColor(last?.headlineColor || "#111827");
  const accentColor = hexToPptxColor(last?.accentColor || "#2563EB");
  const taglineColor = hexToPptxColor(last?.taglineColor || last?.accentColor || "#2563EB");
  const subheadColor = hexToPptxColor(last?.subheadColor || "#6B7280");

  // Center lockup
  // Headline (thin look approximated with smaller size and increased spacing)
  s.addText(headline.toUpperCase(), {
    x: 0.8,
    y: 2.0,
    w: SLIDE_W - 1.6,
    h: 0.8,
    fontSize: 40,
    bold: false,
    color: headlineColor,
    align: "center"
  });

  // Brand line (tagline)
  if (tagline) {
    s.addText(tagline.toUpperCase(), {
      x: 1.2,
      y: 2.85,
      w: SLIDE_W - 2.4,
      h: 0.3,
      fontSize: 12,
      bold: true,
      color: taglineColor,
      align: "center"
    });
  }

  // Supporting text
  if (subheadLines.length) {
    s.addText(subheadLines.join("\n"), {
      x: 1.2,
      y: 3.2,
      w: SLIDE_W - 2.4,
      h: 0.7,
      fontSize: 10,
      bold: true,
      color: subheadColor,
      align: "center"
    });
  }

  // Optional logo centered below text
  if (last?.logoImage?.objectUrl) {
    try {
      const dataUrl = await objectUrlToDataUrl(last.logoImage.objectUrl);
      const box = { x: 5.3, y: 4.25, w: 2.7, h: 1.0 };
      const fitted = fitSize({
        srcW: last.logoImage.width || 800,
        srcH: last.logoImage.height || 300,
        maxW: box.w,
        maxH: box.h
      });
      s.addImage({
        data: dataUrl,
        x: box.x + (box.w - fitted.w) / 2,
        y: box.y + (box.h - fitted.h) / 2,
        w: fitted.w,
        h: fitted.h
      });
    } catch (_e) {
      // If logo fails, don't block export.
    }
  }

  // Accent squares near bottom center
  const sqY = 6.25;
  const startX = SLIDE_W / 2 - 0.45;
  const gap = 0.16;
  const size = 0.12;
  const colors = [accentColor, "F59E0B", "111827", "9CA3AF"];
  colors.forEach((c, i) => {
    s.addShape(pptx.ShapeType.rect, {
      x: startX + i * (size + gap),
      y: sqY,
      w: size,
      h: size,
      fill: { color: c },
      line: { color: c }
    });
  });
}

// PUBLIC_INTERFACE
export async function exportSlidesToPptx({ cover, last, slides, fileName }) {
  /**
   * Generate a PPTX file from slide data and trigger download (client-side).
   * Notes:
   * - Compatible with pptxgenjs@3.11.0 (CRA-friendly); no node:* imports.
   * - Always includes Global Cover as slide 1.
   * - Always appends Global Last Page as the final slide.
   * - Supports zero normal slides (exports a 2-slide deck: Cover + Last).
   *
   * @param {{cover: Object, last: Object, slides: Array, fileName?: string}} payload - cover + slides + last.
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

  // Slide 1: Global Cover (always)
  await addCoverSlide(pptx, cover);

  // Content slides (0..n)
  const safeSlides = Array.isArray(slides) ? slides : [];
  for (const slideData of safeSlides) {
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
    const bullets = (slideData.bullets || [])
      .map((b) => (b || "").trim())
      .filter(Boolean);

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
    const imageBox = {
      x: M + leftW + 0.3,
      y: 1.2,
      w: rightW,
      h: SLIDE_H - 2.0
    };

    if (slideData.image?.objectUrl) {
      try {
        const dataUrl = await objectUrlToDataUrl(slideData.image.objectUrl);

        const fitted = fitSize({
          srcW: slideData.image.width || 1600,
          srcH: slideData.image.height || 900,
          maxW: imageBox.w,
          maxH: imageBox.h
        });

        const x = imageBox.x + (imageBox.w - fitted.w) / 2;
        const y = imageBox.y + (imageBox.h - fitted.h) / 2;

        s.addImage({
          data: dataUrl,
          x,
          y,
          w: fitted.w,
          h: fitted.h
        });
      } catch (_e) {
        // Image failures should never prevent PPT download.
        addImageMissingPlaceholder(s, imageBox);
      }
    }
  }

  // Final slide: Global Last Page (always)
  await addLastSlide(pptx, last);

  const derived =
    fileName ||
    `${safeFileBaseName(cover?.title) || "Presentation"}_${timestampForFileName()}.pptx`;

  await pptx.writeFile({ fileName: derived });
}
