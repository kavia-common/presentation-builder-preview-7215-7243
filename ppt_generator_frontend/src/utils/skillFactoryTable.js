/**
 * Skill Factory Slide 3 dynamic table helpers.
 *
 * Slide 3 is edited in the UI, rendered in SlidePreview, and exported via pptExport.
 * These helpers keep the representation consistent across those three usages.
 */

/**
 * Normalize/clean a header list.
 * - Removes non-strings
 * - Trims values
 * - Keeps empty strings (so UI can show "Column N" placeholders) but filters out fully empty
 *   only when explicitly requested by the caller.
 */
function normalizeHeaders(headers) {
  return (Array.isArray(headers) ? headers : []).map((h) => (h ?? "").toString());
}

/**
 * Create a new empty row for the given headers.
 * Row representation is an array of cell strings.
 */
function createEmptyRowForHeaders(headers) {
  const safeHeaders = normalizeHeaders(headers);
  return new Array(safeHeaders.length).fill("").map(() => "");
}

/**
 * Ensure rows match the current header count and are safe for UI/export.
 * If a row is:
 *  - an array => pad/trim to header count
 *  - an object (legacy shape) => map known keys when headers are the standard 6, else blank
 *  - anything else => blank row
 */
function normalizeRowsForHeaders(headers, rows) {
  const safeHeaders = normalizeHeaders(headers);
  const colCount = safeHeaders.length;

  const safeRows = Array.isArray(rows) ? rows : [];
  return safeRows.map((r) => {
    if (Array.isArray(r)) {
      const next = r.map((c) => (c ?? "").toString());
      if (next.length === colCount) return next;
      if (next.length > colCount) return next.slice(0, colCount);
      return [...next, ...new Array(colCount - next.length).fill("")];
    }

    // Legacy object rows from earlier implementation: map to standard 6-col layout.
    if (r && typeof r === "object") {
      if (colCount === 6) {
        return [
          (r.domain ?? "").toString(),
          (r.subDomain ?? "").toString(),
          (r.capability ?? "").toString(),
          (r.talentPipeline ?? "").toString(),
          (r.status ?? "").toString(),
          (r.totalResourceCount ?? "").toString()
        ];
      }
      return createEmptyRowForHeaders(safeHeaders);
    }

    return createEmptyRowForHeaders(safeHeaders);
  });
}

// PUBLIC_INTERFACE
export function sf3CreateEmptyRow(columns) {
  /** Create an empty Slide 3 row matching the current column count. */
  return createEmptyRowForHeaders(columns);
}

// PUBLIC_INTERFACE
export function sf3NormalizeTableState(slide3) {
  /**
   * Normalize Slide 3 table state to the canonical dynamic-table representation:
   * - columns: string[]
   * - rows: string[][]
   *
   * This is used by preview and export defensively so they don't crash on legacy data.
   */
  const columns = normalizeHeaders(slide3?.columns);
  const rows = normalizeRowsForHeaders(columns, slide3?.rows);

  return {
    columns,
    rows
  };
}

// PUBLIC_INTERFACE
export function sf3ResetRowsForNewColumns(nextColumns, prevRowsCount = 0) {
  /**
   * Reset all existing row data to match a new header list.
   * Keeps row count (so the user doesn't lose the number of rows), but empties all cells.
   */
  const safeCols = normalizeHeaders(nextColumns);
  const count = Math.max(0, Number(prevRowsCount) || 0);
  return new Array(count).fill(null).map(() => createEmptyRowForHeaders(safeCols));
}
