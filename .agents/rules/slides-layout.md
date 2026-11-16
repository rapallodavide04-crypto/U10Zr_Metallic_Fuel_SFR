# Slide Layout & Typography Rules (Ferraris Slide 4 + Final Deck Standard)

- **Canvas:** Fixed `1280×720 px` (`16:9`), scaled responsively in browser (`deck.js`), stacked 1:1 in `?export=pdf`.
- **Unified Background (Slides 1–14):** Deep nuclear-navy `#0B2545 → #164478` radial gradient with `40px` architectural coordinate grid, subtle `#E05A00` / `#2563EB` glows, and hexagonal lattice watermark.
- **Elevated White Plates (`#FFFFFF`):** All `.figure-card` frames, KPI cards, content panels, and tables sit on `#FFFFFF` elevated plates (`1px solid #CBD5E1`) so white-background SEM micrographs and scientific plots integrate seamlessly.
- **Strict 3-Row CSS Grid (Slides 2–14):** `grid-template-rows: auto minmax(0, 1fr) auto;` with `overflow: hidden` on `.slide-body` and `grid-template-rows: minmax(0, 1fr)` on `.split-grid`, `.dual-visual`, `.cols-3` (zero clipped captions, zero header/footer overlaps).
- **Sharp Technical Geometry:** `border-radius: 0–2px` everywhere (rounded pill badges forbidden).
- **Slide 1 (Cover):** Course title, `assets/branding/polito_logo_white.svg` (top-right, transparent white vector on dark navy), title, sodium-orange rule, subtitle, 4 sharp tags, `Davide Rapallo • Matricola s324486 (s324486@studenti.polito.it)`, `Oklo Inc. (Simulated Case Study)`.
- **Slides 2–14 Header & Footer:**
  - Header bar: `U-10Zr Metallic Fuel for Sodium Fast Reactors` (left, **no** `text-transform: uppercase` so `Zr` keeps lowercase `r`) + section tag (right, **no** progressive `1.–13.` numbers) + single-sentence takeaway below.
  - Footer: `polito_logo_white.svg` (transparent white vector on dark navy, zero white pill/plate) + `Davide Rapallo – s324486@studenti.polito.it` (left) | `Oklo Inc. (Simulated Case Study)` + `Slide X / 14` (right, `11px`).
  - Navigation: keyboard-only (`ArrowRight`/`Space`/`PageDown`, `ArrowLeft`/`PageUp`, `Home`/`End`, `F`, `G`, `L`, `?`, `1–9`); no bottom-center HUD (`Slide X / 14` is exclusively in the far-right footer).
- **Slide-Specific Grid & Chemical Standards:**
  - Use real HTML `<sub>` tags for all chemical subscripts (`δ-UZr<sub>2</sub>`, `γ<sub>2</sub>`, `γ<sub>1</sub>`, `Y<sub>2</sub>O<sub>3</sub>`, `k<sub>He</sub>` with `white-space: nowrap`).
  - Keep `.text-col` / `.bullet-list` / `.step-flow` compactly stacked (`justify-content: center` / `flex-start`, no vertical line behind `.step-flow`); use `align-items: stretch` on Slide 8 (`.cols-3`), symmetric `2×2` grid (`.bento-grid-2x2`, natural order 1–4) on Slide 10, and `58:42` two-column layout (`s12-two-stage-roadmap.svg` left + compact `.decision-stack-3` right) on Slide 12.

## Typography Hierarchy (`1280×720`)

| Text Role | Font Family | Size | Weight | Color |
| :--- | :--- | :--- | :--- | :--- |
| **Cover Title (Slide 1)** | `Plus Jakarta Sans` | `52px` | `700` | `#FFFFFF` on `#0B2545` |
| **Dynamic Takeaway (Slide 2–14)** | `Inter` | `18px` | `600` (`kern/liga` off, `word-spacing: 0.08em`) | `#FFFFFF` on `#0B2545` |
| **Fixed Header / Section Tag** | `Plus Jakarta Sans` / `IBM Plex Mono` | `13px / 11.5px` | `700` (mixed-case header) | `#E2E8F0` / `#FFFFFF` |
| **KPI Big Numbers** | `Plus Jakarta Sans` | `21–23px` | `700` | `#0B2545` / `#C2410C` / `#15803D` |
| **Card / Panel Subheadings** | `Plus Jakarta Sans` | `15–17px` | `700` | `#0B2545` / `#15803D` |
| **Body Copy / Bullets / Steps** | `Inter` | `14.2–15px` | `400` (`700` keywords) | `#1E293B` on `#FFFFFF` |
| **Trade-Off Table / Spec Sheet** | `Inter` / `IBM Plex Mono` | `13.2–13.5px` | `400–600` | `#1E293B` on `#FFFFFF` |
| **Captions / Footer / Metadata** | `Inter` / `IBM Plex Mono` | `11.5–12px` | `500–600` | `#475569` (on white) / `#CBD5E1` (on dark) |

- **Print / QA Modes:** `?export=pdf` and `@media print` enforce `print-color-adjust: exact`, force `opacity: 1`, `transform: none`, `clip-path: none`, `stroke-dashoffset: 0` (preserving `.cover-backdrop img` `0.14`, `.cover-hex-grid` `0.36`, `.pdf-web-link` visible), hide all interactive overlays/ambient glows, and use a single lightweight opaque `linear-gradient` background (`#164478 → #0B2545 → #06152B`, without `radial-gradient` rings or tiled `40px` grids), `box-shadow: none`, `filter: none`, and hidden `.cover-grid-overlay` / `.slide--content::after` for fast PDF scrolling; `?static=1` renders finished single-slide state for QA. `python src/web-deck/build_standalone.py` builds the offline single-file bundle (`dist/U10Zr_Metallic_Fuel_SFR_standalone.html` + `docs/index.html`).
- **Auto-Sync:** Keep this file and `GEMINI.md` synchronized automatically whenever layout, typography, chemical notation, or export rules are updated.
