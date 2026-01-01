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

1. Click **+ Add** to create slides (the slide list is on the left).
2. Select a slide and edit:
   - Title (required)
   - Subtitle
   - Bullet points (add/remove)
   - Optional image (local-only; uses an Object URL)
   - Theme: background preset + text color
3. See the result in the **Preview** panel.
4. Click **Generate PPT** to download `presentation.pptx`.

## Notes

- This is a frontend-only app. No files are uploaded anywhere.
- Export uses **PptxGenJS** to generate the `.pptx` in the browser.
- Validation: each slide must have a non-empty title before export is enabled.
