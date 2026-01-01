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

function normalizeBullets(arr, max = 8) {
  return (Array.isArray(arr) ? arr : [])
    .map((t) => (t || "").toString().trim())
    .filter(Boolean)
    .slice(0, max);
}

function addPanelHeader(slide, { x, y, w, title, primary = "2563EB", accent = "F59E0B" }) {
  // White header strip
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x,
    y,
    w,
    h: 0.45,
    fill: { color: "FFFFFF" },
    line: { color: "D1D5DB", width: 0.5 }
  });

  slide.addText(title, {
    x: x + 0.18,
    y: y + 0.12,
    w: w - 0.36,
    h: 0.3,
    fontSize: 11,
    bold: true,
    color: "111827"
  });

  // Accent line
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: x + 0.18,
    y: y + 0.39,
    w: Math.max(0, w - 0.36),
    h: 0.06,
    fill: { color: primary },
    line: { color: primary }
  });

  // Small accent cap
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x: x + 0.18,
    y: y + 0.39,
    w: Math.max(0.35, (w - 0.36) * 0.22),
    h: 0.06,
    fill: { color: accent },
    line: { color: accent }
  });
}

function addPanelContainer(slide, { x, y, w, h }) {
  slide.addShape(PptxGenJS.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    fill: { color: "F9FAFB" },
    line: { color: "D1D5DB", width: 0.7 },
    radius: 0.12
  });
}

function addBulletBox(slide, { x, y, w, h, bullets, fontSize = 11 }) {
  if (!bullets.length) {
    slide.addText("—", { x: x + 0.2, y: y + 0.12, w: w - 0.4, h: 0.25, fontSize, italic: true, color: "6B7280" });
    return;
  }

  slide.addText(bullets.join("\n"), {
    x: x + 0.2,
    y: y + 0.1,
    w: w - 0.4,
    h: Math.max(0.2, h - 0.2),
    fontSize,
    color: "111827",
    bullet: { indent: 16 },
    paraSpaceAfter: 4
  });
}

function addTeamTable(slide, { x, y, w, h, rows }) {
  // Simple table (Name | Role)
  const headerH = 0.38;
  const rowH = 0.34;

  // Table border background
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x,
    y,
    w,
    h,
    fill: { color: "FFFFFF" },
    line: { color: "D1D5DB", width: 0.7 }
  });

  const col1 = w * 0.55;
  const col2 = w - col1;

  // Header fill
  slide.addShape(PptxGenJS.ShapeType.rect, {
    x,
    y,
    w,
    h: headerH,
    fill: { color: "EAF2FF" },
    line: { color: "D1D5DB", width: 0.7 }
  });

  // Header text
  slide.addText("Name", {
    x: x + 0.12,
    y: y + 0.08,
    w: col1 - 0.24,
    h: headerH - 0.12,
    fontSize: 11,
    bold: true,
    color: "1D4ED8"
  });
  slide.addText("Role", {
    x: x + col1 + 0.12,
    y: y + 0.08,
    w: col2 - 0.24,
    h: headerH - 0.12,
    fontSize: 11,
    bold: true,
    color: "1D4ED8"
  });

  // Vertical divider
  slide.addShape(PptxGenJS.ShapeType.line, {
    x: x + col1,
    y,
    w: 0,
    h,
    line: { color: "D1D5DB", width: 0.7 }
  });

  const safeRows = (Array.isArray(rows) ? rows : []).slice(0, Math.floor((h - headerH) / rowH));
  const maxRows = Math.max(1, Math.floor((h - headerH) / rowH));
  const padded = safeRows.length ? safeRows : [{ name: "—", role: "—" }];

  for (let i = 0; i < Math.min(maxRows, padded.length); i++) {
    const rowY = y + headerH + i * rowH;

    // Row line
    slide.addShape(PptxGenJS.ShapeType.line, {
      x,
      y: rowY,
      w,
      h: 0,
      line: { color: "E5E7EB", width: 0.6 }
    });

    const name = (padded[i]?.name || "").toString().trim() || "—";
    const role = (padded[i]?.role || "").toString().trim() || "—";

    slide.addText(name, {
      x: x + 0.12,
      y: rowY + 0.06,
      w: col1 - 0.24,
      h: rowH - 0.08,
      fontSize: 11,
      color: "111827"
    });
    slide.addText(role, {
      x: x + col1 + 0.12,
      y: rowY + 0.06,
      w: col2 - 0.24,
      h: rowH - 0.08,
      fontSize: 11,
      color: "111827"
    });
  }
}

async function addSkillFactorySlide1(pptx, factory) {
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  const primary = "2563EB";
  const accent = "F59E0B";

  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };

  const sf1 = factory?.slides?.slide1 || {};
  const factoryName = (sf1.factoryName || "").trim() || "Skill Factory";
  const sprintLabel = (sf1.sprintLabel || "").trim() || "Sprint";

  // Header bar
  const headerX = 0.6;
  const headerY = 0.5;
  const headerW = SLIDE_W - 1.2;
  const headerH = 0.55;

  s.addShape(pptx.ShapeType.roundRect, {
    x: headerX,
    y: headerY,
    w: headerW,
    h: headerH,
    fill: { color: primary },
    line: { color: primary },
    radius: 0.12
  });

  s.addText(factoryName, {
    x: headerX + 0.25,
    y: headerY + 0.16,
    w: headerW * 0.72,
    h: 0.28,
    fontSize: 14,
    bold: true,
    color: "FFFFFF"
  });

  s.addText(sprintLabel, {
    x: headerX + headerW * 0.72,
    y: headerY + 0.16,
    w: headerW * 0.28 - 0.25,
    h: 0.28,
    fontSize: 12,
    bold: true,
    color: "FFFFFF",
    align: "right"
  });

  // Layout grid (approximate reference)
  const gap = 0.22;
  const topY = headerY + headerH + 0.25;

  const topH = 3.3;
  const bottomH = SLIDE_H - topY - topH - 0.7;
  const bottomY = topY + topH + 0.3;

  const totalW = SLIDE_W - 1.2;
  const x0 = 0.6;

  const colW = (totalW - gap * 2) / 3;
  const col1X = x0;
  const col2X = x0 + colW + gap;
  const col3X = x0 + (colW + gap) * 2;

  // Top panels: Highlights, Lowlights, Team Members
  const panelPadTop = 0.45;

  // Highlights
  addPanelContainer(s, { x: col1X, y: topY, w: colW, h: topH });
  addPanelHeader(s, { x: col1X, y: topY, w: colW, title: "PROJECT HIGHLIGHTS", primary, accent });
  addBulletBox(s, {
    x: col1X,
    y: topY + panelPadTop,
    w: colW,
    h: topH - panelPadTop,
    bullets: normalizeBullets(sf1.highlights, 8),
    fontSize: 11
  });

  // Lowlights
  addPanelContainer(s, { x: col2X, y: topY, w: colW, h: topH });
  addPanelHeader(s, { x: col2X, y: topY, w: colW, title: "PROJECT LOWLIGHTS", primary, accent });
  addBulletBox(s, {
    x: col2X,
    y: topY + panelPadTop,
    w: colW,
    h: topH - panelPadTop,
    bullets: normalizeBullets(sf1.lowlights, 8),
    fontSize: 11
  });

  // Team Members
  addPanelContainer(s, { x: col3X, y: topY, w: colW, h: topH });
  addPanelHeader(s, { x: col3X, y: topY, w: colW, title: "TEAM MEMBERS", primary, accent });

  addTeamTable(s, {
    x: col3X + 0.18,
    y: topY + panelPadTop + 0.08,
    w: colW - 0.36,
    h: topH - panelPadTop - 0.18,
    rows: Array.isArray(sf1.teamMembers) ? sf1.teamMembers : []
  });

  // Bottom panels (two columns)
  const bottomColW = (totalW - gap) / 2;
  const b1X = x0;
  const b2X = x0 + bottomColW + gap;

  addPanelContainer(s, { x: b1X, y: bottomY, w: bottomColW, h: bottomH });
  addPanelHeader(s, {
    x: b1X,
    y: bottomY,
    w: bottomColW,
    title: "Key Activities completed in previous week",
    primary,
    accent
  });
  addBulletBox(s, {
    x: b1X,
    y: bottomY + panelPadTop,
    w: bottomColW,
    h: bottomH - panelPadTop,
    bullets: normalizeBullets(sf1.prevWeekActivities, 10),
    fontSize: 11
  });

  addPanelContainer(s, { x: b2X, y: bottomY, w: bottomColW, h: bottomH });
  addPanelHeader(s, {
    x: b2X,
    y: bottomY,
    w: bottomColW,
    title: "Key Activities planned for current week",
    primary,
    accent
  });
  addBulletBox(s, {
    x: b2X,
    y: bottomY + panelPadTop,
    w: bottomColW,
    h: bottomH - panelPadTop,
    bullets: normalizeBullets(sf1.currentWeekActivities, 10),
    fontSize: 11
  });

  // Footer micro line (optional; subtle)
  s.addShape(pptx.ShapeType.line, {
    x: SLIDE_W - 2.2,
    y: SLIDE_H - 0.45,
    w: 1.2,
    h: 0,
    line: { color: "93C5FD", width: 2 }
  });
  s.addText("Ocean Professional • Skill Factory", {
    x: SLIDE_W - 4.3,
    y: SLIDE_H - 0.55,
    w: 4.0,
    h: 0.25,
    fontSize: 9,
    color: "6B7280",
    align: "right"
  });
}

async function addSkillFactorySlide2(pptx, factory) {
  /**
   * Skill Factory Slide 2: image-only metrics.
   * Layout matches the reference:
   * - Header text (factory name)
   * - Two square “donut” zones on left, one wide chart zone on right
   * - Bottom blue band
   * - If more than 3 images are provided, additional images are placed in a simple grid above the band.
   */
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };

  const sf1 = factory?.slides?.slide1 || {};
  const sf2 = factory?.slides?.slide2 || {};
  const factoryName = (sf1.factoryName || "").trim() || "Skill Factory";

  // Title row
  s.addText(factoryName, {
    x: 0.6,
    y: 0.45,
    w: SLIDE_W - 1.2,
    h: 0.4,
    fontSize: 14,
    bold: true,
    color: "111827"
  });

  // Bottom band (blue)
  const bandH = 1.1;
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: SLIDE_H - bandH,
    w: SLIDE_W,
    h: bandH,
    fill: { color: "2F78A8" },
    line: { color: "2F78A8" }
  });

  // IMPORTANT: export must mirror the UI order (masonry reorder).
  const imagesOrdered = Array.isArray(sf2.metricsImages) ? sf2.metricsImages : [];

  // Main 3-slot layout area (above band)
  const topY = 1.05;
  const gap = 0.35;

  const leftW = 3.1;
  const donutSize = 2.9;

  const donut1 = { x: 0.85, y: topY + 0.35, w: donutSize, h: donutSize };
  const donut2 = { x: donut1.x + leftW, y: donut1.y, w: donutSize, h: donutSize };
  const chart = { x: donut2.x + leftW + gap, y: topY + 0.3, w: SLIDE_W - (donut2.x + leftW + gap) - 0.85, h: 3.2 };

  const place = async (imgMeta, box, round = false) => {
    if (!imgMeta?.objectUrl) {
      addImageMissingPlaceholder(s, box);
      return;
    }
    try {
      const dataUrl = await objectUrlToDataUrl(imgMeta.objectUrl);
      const fitted = fitSize({
        srcW: imgMeta.width || 1600,
        srcH: imgMeta.height || 900,
        maxW: box.w,
        maxH: box.h
      });
      const x = box.x + (box.w - fitted.w) / 2;
      const y = box.y + (box.h - fitted.h) / 2;

      // Optional subtle container
      s.addShape(pptx.ShapeType.roundRect, {
        x: box.x,
        y: box.y,
        w: box.w,
        h: box.h,
        fill: { color: "F9FAFB" },
        line: { color: "D1D5DB", width: 0.7 },
        radius: round ? Math.min(box.w, box.h) / 2 : 0.16
      });

      s.addImage({ data: dataUrl, x, y, w: fitted.w, h: fitted.h });
    } catch (_e) {
      addImageMissingPlaceholder(s, box);
    }
  };

  await place(imagesOrdered[0], donut1, true);
  await place(imagesOrdered[1], donut2, true);
  await place(imagesOrdered[2], chart, false);

  // Extra images: grid placed under the main area (still above band), if space allows.
  const extras = imagesOrdered.slice(3);
  if (extras.length) {
    const gridTop = Math.min(chart.y + chart.h + 0.25, donut1.y + donut1.h + 0.35);
    const gridH = Math.max(0, SLIDE_H - bandH - gridTop - 0.25);

    if (gridH > 0.6) {
      const cols = 3;
      const cellGap = 0.18;
      const usableW = SLIDE_W - 1.2;
      const cellW = (usableW - cellGap * (cols - 1)) / cols;
      const cellH = Math.min(1.25, gridH / 2);

      for (let i = 0; i < Math.min(extras.length, 6); i++) {
        const r = Math.floor(i / cols);
        const c = i % cols;
        const box = {
          x: 0.6 + c * (cellW + cellGap),
          y: gridTop + r * (cellH + cellGap),
          w: cellW,
          h: cellH
        };
        await place(extras[i], box, false);
      }
    }
  }
}

async function addSkillFactorySlide3(pptx, factory) {
  /**
   * Skill Factory Slide 3: title + table + bottom band.
   * Matches the reference screenshot structure (minimal, company-style).
   */
  const SLIDE_W = 13.333;
  const SLIDE_H = 7.5;

  const s = pptx.addSlide();
  s.background = { color: "FFFFFF" };

  const sf3 = factory?.slides?.slide3 || {};
  const title = (sf3.title || "").trim() || "Continuous Assessment";

  // Title (top-left)
  s.addText(title, {
    x: 0.6,
    y: 0.45,
    w: SLIDE_W - 1.2,
    h: 0.4,
    fontSize: 16,
    bold: true,
    color: "111827"
  });

  // Bottom band
  const bandH = 1.05;
  const bandColor = hexToPptxColor(sf3.bottomBandColor || "#2F78A8");
  s.addShape(pptx.ShapeType.rect, {
    x: 0,
    y: SLIDE_H - bandH,
    w: SLIDE_W,
    h: bandH,
    fill: { color: bandColor },
    line: { color: bandColor }
  });

  // Table container
  const x0 = 0.6;
  const y0 = 1.15;
  const w0 = SLIDE_W - 1.2;
  const h0 = SLIDE_H - bandH - y0 - 0.25;

  // Outer border
  s.addShape(pptx.ShapeType.rect, {
    x: x0,
    y: y0,
    w: w0,
    h: h0,
    fill: { color: "FFFFFF" },
    line: { color: "D1D5DB", width: 0.8 }
  });

  // Top grey band on table (as in screenshot)
  s.addShape(pptx.ShapeType.rect, {
    x: x0,
    y: y0,
    w: w0,
    h: 0.12,
    fill: { color: "CBD5E1" },
    line: { color: "CBD5E1" }
  });

  const columns = Array.isArray(sf3.columns) ? sf3.columns : [];
  const cols = columns.length;

  // Defensive: if no headers, skip rendering the table grid (still show title + band).
  if (!cols) return;

  // Column widths roughly match screenshot for 6 columns; otherwise uniform.
  const colWeights = cols === 6 ? [1.05, 1.15, 1.6, 3.6, 1.05, 1.25] : new Array(cols).fill(1);
  const weightSum = colWeights.reduce((a, b) => a + b, 0);
  const colWs = colWeights.map((w) => (w0 * w) / weightSum);

  const headerH = 0.48;
  const rowH = 0.62; // allow wrapped text
  const padX = 0.10;

  // Header background (blue-ish)
  const headerY = y0 + 0.12;
  s.addShape(pptx.ShapeType.rect, {
    x: x0,
    y: headerY,
    w: w0,
    h: headerH,
    fill: { color: "1D4ED8", transparency: 12 },
    line: { color: "D1D5DB", transparency: 100 }
  });

  // Header text
  let cx = x0;
  for (let i = 0; i < cols; i++) {
    const label = (columns[i] || "").trim() || `Column ${i + 1}`;
    s.addText(label, {
      x: cx + padX,
      y: headerY + 0.14,
      w: Math.max(0, colWs[i] - padX * 2),
      h: headerH - 0.18,
      fontSize: 10,
      bold: true,
      color: "FFFFFF"
    });
    cx += colWs[i];
  }

  // Grid vertical lines
  cx = x0;
  for (let i = 0; i < cols - 1; i++) {
    cx += colWs[i];
    s.addShape(pptx.ShapeType.line, {
      x: cx,
      y: headerY,
      w: 0,
      h: h0 - 0.12,
      line: { color: "E5E7EB", width: 0.6 }
    });
  }

  const rows = Array.isArray(sf3.rows) ? sf3.rows : [];
  const maxRows = Math.max(1, Math.floor((h0 - 0.12 - headerH) / rowH));
  const slice = rows.slice(0, maxRows);

  // Body rows
  for (let r = 0; r < maxRows; r++) {
    const row = Array.isArray(slice[r]) ? slice[r] : [];
    const y = headerY + headerH + r * rowH;

    // alternating fill
    if (r % 2 === 0) {
      s.addShape(pptx.ShapeType.rect, {
        x: x0,
        y,
        w: w0,
        h: rowH,
        fill: { color: "F9FAFB" },
        line: { color: "FFFFFF", transparency: 100 }
      });
    }

    // Row divider
    s.addShape(pptx.ShapeType.line, {
      x: x0,
      y,
      w: w0,
      h: 0,
      line: { color: "E5E7EB", width: 0.6 }
    });

    // Cells (dynamic). Pad/trim to current header length.
    const values = new Array(cols).fill("").map((_, i) => (row[i] ?? "").toString());

    cx = x0;
    for (let c = 0; c < cols; c++) {
      const t = (values[c] || "").trim() || "—";
      s.addText(t, {
        x: cx + padX,
        y: y + 0.10,
        w: Math.max(0, colWs[c] - padX * 2),
        h: rowH - 0.12,
        fontSize: cols === 6 && c === 3 ? 9 : 10,
        color: "111827",
        valign: "top"
      });
      cx += colWs[c];
    }
  }
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
export async function exportSlidesToPptx({ cover, last, skillFactories, slides, fileName }) {
  /**
   * Generate a PPTX file from slide data and trigger download (client-side).
   * Notes:
   * - Compatible with pptxgenjs@3.11.0 (CRA-friendly); no node:* imports.
   * - Always includes Global Cover as slide 1.
   * - Always appends Global Last Page as the final slide.
   * - Skill Factory slides (currently Slide 1 only) are inserted between Cover and normal content slides.
   * - Supports zero normal slides (exports at least Cover + Last; and any skill factories if present).
   *
   * @param {{cover: Object, last: Object, skillFactories?: Array, slides: Array, fileName?: string}} payload
   * @returns {Promise<void>}
   */
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "PPT Generator (Frontend-only)";

  // Slide 1: Global Cover (always)
  await addCoverSlide(pptx, cover);

  // Skill Factory slides (Slide 1 then Slide 2 then Slide 3 per factory)
  const safeFactories = Array.isArray(skillFactories) ? skillFactories : [];
  for (const f of safeFactories) {
    await addSkillFactorySlide1(pptx, f);
    await addSkillFactorySlide2(pptx, f);
    await addSkillFactorySlide3(pptx, f);
  }

  // Normal content slides (0..n)
  const safeSlides = Array.isArray(slides) ? slides : [];
  for (const slideData of safeSlides) {
    // 13.333 x 7.5 inches for LAYOUT_WIDE
    const SLIDE_W = 13.333;
    const SLIDE_H = 7.5;

    // Margins and layout regions
    const M = 0.6;
    const leftW = 8.4;
    const rightW = SLIDE_W - (M * 2 + leftW);
    const topY = 0.8;

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

  const derived = fileName || `${safeFileBaseName(cover?.title) || "Presentation"}_${timestampForFileName()}.pptx`;
  await pptx.writeFile({ fileName: derived });
}
