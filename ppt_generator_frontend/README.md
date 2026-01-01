# PPT Generator (Frontend-only)

A simple React app (no backend) for creating PowerPoint presentations and downloading a `.pptx` file directly from the browser.

Theme: **Ocean Professional** (primary `#2563EB`, secondary/success `#F59E0B`, error `#EF4444`, background `#f9fafb`, surface `#ffffff`, text `#111827`).

## Run locally

In this project directory:

```bash
npm install
npm start
```

Then open http://localhost:3000

## How to use

1. Edit the fixed **Global Cover** (always **slide 1**) for:
   - Title, subtitle, tagline
   - Optional cover background image (local-only Object URL)
2. Click **+ Add** to create content slides (these become slides 2..N).
3. For each content slide, fill in:
   - Title (required to export when content slides exist)
   - Subtitle
   - Bullet points
   - Optional image (local-only; uses an Object URL)
   - Theme: background preset + text color
4. Click **Generate PPT** to download a `.pptx`.

### Generate PPT behavior

- Export is **client-side** using **PptxGenJS (pptxgenjs@3.11.0)**.
- The exported deck always starts with the **Global Cover as slide 1**.
- If there are **zero content slides**, export still works and produces a 1-slide deck (Global Cover only).
- If an image cannot be embedded for any reason, export continues and the slide will show a small “Image unavailable” placeholder instead of failing.
- The downloaded filename is based on the cover title (or fallback) and a timestamp, e.g.:
  - `TATA_ELXSI_2026-01-01_1035.pptx`
  - `Presentation_2026-01-01_1035.pptx`

## Notes

- This is a frontend-only app. No files are uploaded anywhere.
- Images stay local (Object URLs) and are embedded into PPTX at export time.
- Validation: each content slide must have a non-empty title before export is enabled (Global Cover title does not block export).
