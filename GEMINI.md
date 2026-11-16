# Project Rules — U-10Zr Metallic Fuel for Sodium Fast Reactors

## 1. Project Identity
- **Title:** `U-10Zr Metallic Fuel for Sodium Fast Reactors`
- **Subtitle:** `Materials Selection, Degradation Mechanisms & Cladding Trade-Off`
- **Course:** `01TVMXY / 01TVMND – Advanced Materials for Nuclear Applications (A.Y. 2026/27)` — Politecnico di Torino
- **Author:** Davide Rapallo (`Matricola s324486`, `s324486@studenti.polito.it`)
- **Context:** Role-play as Fuel Materials R&D Engineer at **Oklo Inc. (Simulated Case Study)**

## 2. Single Source of Truth (Anti-Hallucination Policy)
- **Text & Layout:** Use ONLY slide titles, subtitles, bullets, and captions from `content/slides-blueprint.md`.
- **Numbers & Tables:** Use ONLY locked values from `content/data-tables.json`. Never invent, round arbitrarily, or extrapolate temperatures, burnup, dpa, dimensions, or alloy compositions.
- **Citations & Figures:** Every external figure must come from `assets/figures/` or `assets/branding/` and match `content/sources.md` and `content/bibliography.md`.
- **No Fake Micrographs or Plots:** Never generate synthetic micrographs, EDS maps, or experimental curves. Only clean architectural/roadmap diagrams (`assets/schematics/s03-fuel-pin-cross-section.svg`, `assets/schematics/s12-two-stage-roadmap.svg`) may be code-generated as SVG, and must be explicitly labeled as author schematics.

## 3. Slide Layout Standards (Ferraris Slide 4 Template & Grid Rules)
- **Aspect Ratio:** Fixed `16:9` (`1280×720 px` scalable), zero scrolling, zero text overflow.
- **Strict 3-Row CSS Grid (Slides 2–14):** `grid-template-rows: auto minmax(0, 1fr) auto;` with `overflow: hidden` on `.slide-body` and `grid-template-rows: minmax(0, 1fr)` on `.split-grid`, `.dual-visual`, and `.cols-3` so captions and body elements never clip or overlap header/footer.
- **Slide 1 (Cover):** Course code/title (`01TVMXY / 01TVMND`), `assets/branding/polito_logo_white.svg` (top-right, transparent white vector on dark navy), title, sodium-orange rule, subtitle, 4 sharp technical tags, `Davide Rapallo • Matricola s324486 (s324486@studenti.polito.it)`, `Oklo Inc. (Simulated Case Study)`.
- **Fixed Header (Slides 2–14):** Top bar with `U-10Zr Metallic Fuel for Sodium Fast Reactors` (left, **never** `text-transform: uppercase` so `Zr` keeps lowercase `r`) + section tag (right, **without** progressive `1.–13.` numbers to avoid confusion with `Slide X / 14`), followed by the single-sentence English key-message takeaway.
- **Fixed Footer (Slides 2–14):** Left cluster: `assets/branding/polito_logo_white.svg` (transparent white vector on dark navy, zero white plate/pill) + `Davide Rapallo – s324486@studenti.polito.it`; Right cluster: `Oklo Inc. (Simulated Case Study)` + `Slide X / 14` (`11px`, weight `600`).
- **Keyboard-Only Navigation:** No bottom-center HUD bar (`Slide X / 14` appears exclusively on the far right of the fixed footer); navigation is keyboard-only (`ArrowRight`/`Space`/`PageDown`, `ArrowLeft`/`PageUp`, `Home`/`End`, `F` fullscreen, `G`, `L`, `?`, `1–9`).
- **Layout Diversity & Symmetry:** Avoid repeating identical "image left / boxes right" layouts consecutively; align multi-row grids (e.g. Slide 2 `2+1` visual columns aligned to top 3-column banner, Slide 8 `align-items: stretch`, Slide 10 symmetric `2×2` grid in natural 1–4 order, Slide 12 `58:42` two-column roadmap + 3 natural-height complementary cards), keep compact natural card stacks in `.text-col` without awkward gaps, and keep every source caption directly underneath its figure inside `.figure-card`.
- **Chemical Subscripts:** Always use real HTML `<sub>` tags in formulas (e.g., `δ-UZr<sub>2</sub>`, `γ<sub>2</sub>`, `γ<sub>1</sub>`, `Y<sub>2</sub>O<sub>3</sub>`, `k<sub>He</sub>` with `white-space: nowrap` when followed by punctuation).

## 4. Visual Style, Color Palette & Typography
- **Unified Background (Slides 1–14):** Deep nuclear-navy `#0B2545 → #164478` radial gradient with `40px` architectural coordinate grid, subtle sodium-orange (`#E05A00`) and steel-blue (`#2563EB`) atmospheric glows, and subtle hexagonal lattice watermark.
- **Pure-White Elevated Plates (`#FFFFFF`):** All `.figure-card` frames, KPI cards, content panels, and tables sit on `#FFFFFF` elevated plates (`1px solid #CBD5E1`, soft shadow) so white-background SEM micrographs and scientific plots integrate seamlessly.
- **Sharp Technical Geometry:** Use `border-radius: 0–2px` (`--radius-sharp: 2px`) everywhere; rounded pill badges (`border-radius: 999px`) are forbidden.
- **Accents:** `#E05A00` / `#C2410C` (sodium-orange for critical callouts: FCCI, `725 °C` eutectic, `650 °C` creep limit), `#15803D` (engineering green for advantages & Stage 1/2 selections), `#0B2545` / `#1E293B` (high-contrast slate ink on `#FFFFFF` plates).
- **Typography (`1280×720`):**
  - Display / Titles / KPIs: `Plus Jakarta Sans` (`600–700`)
  - Body / Tables / Takeaways: `Inter` (`400–600`, `14.5–15px` bullets; `18px` weight `600` takeaway with `letter-spacing: 0.005em`, `word-spacing: 0.08em`, `font-kerning: none`, and `font-feature-settings: "kern" 0, "liga" 0` to prevent PDF word-spacing collisions)
  - Micro-labels / Alloy Codes / Badges: `IBM Plex Mono` (`500–700`, `.code-chip` always `display: inline; white-space: nowrap;`)

## 5. Animation Grammar (GSAP 3) & Export Rules
- **Element-Role & Structure-Targeted Motion:** Top sodium-orange progress bar (`expo.out`), theme-reactive ambient stage lighting (`default` steel-blue ↔ `theme--amber` thermal sodium ↔ `theme--green` engineering emerald), directional slide-to-slide cross-fade/glide (`±36px`, `0.38s` out / `0.48s` in), masked typographic reveals (`power4.out`), geometric `clip-path` wipes on `.figure-card`s, single shimmer sweeps (Slides 7, 8, 12), thermal/emerald threshold pulses (Slides 4, 7, 8), pointer-reactive card sheen (`--mx`/`--my`), and per-slide GSAP 3 choreography including animated inline vector SVGs on Slide 1 (outer→inner hex + `#coreGlow` charge/discharge lattice cycle toggled via `AMBIENT_FX.slide1HexChargeCycle` in code), Slide 3 (layer-by-layer pin build + callouts), Slide 10 (4 physical mechanism SVGs), and Slide 12 (Stage 1 → R&D Bridge → Stage 2 roadmap).
- **Classroom Interactive Q&A Controls:** `G` (14-slide Overview Command Grid), Click any `.figure-card` (Full-focus Figure Lightbox), `L` (GSAP `quickTo` sodium laser pointer), `?` (Shortcuts overlay), `1–9` direct jump, plus cross-highlighting on Slide 3 (spec table ↔ pin SVG layers), Slide 11 (row hover/pin), and Slide 12 (roadmap ↔ decision cards).
- **PDF & QA Modes:** `@media print` and `?export=pdf` disable all animations and interactive overlays/ambient halos, enforce `print-color-adjust: exact`, force `opacity: 1`, `clip-path: none`, `transform: none`, `stroke-dashoffset: 0` (while preserving intentional opacities: `.cover-backdrop img` `0.14`, `.cover-hex-grid` `0.36`), and use a single lightweight opaque `linear-gradient` background (`#164478 → #0B2545 → #06152B`, without `radial-gradient` rings or tiled `40px` grids), `box-shadow: none`, `filter: none`, and hidden `.cover-grid-overlay` / `.slide--content::after` across all 14 `1280×720` pages for fast PDF scrolling. `?static=1` renders individual `#slide-X` views in finished state for browser QA.
- **PDF Export:** `dist/U10Zr_SFR_Rapallo.pdf` via Chrome **Salva come PDF** (`1280×720` borderless with *Grafica in background* enabled and *Intestazioni e piè di pagina* disabled; avoid *Microsoft Print to PDF* which forces A4 margins), Chrome headless (`--print-to-pdf` on `U10Zr_Metallic_Fuel_SFR.html?export=pdf`), or `src/web-deck/export_pdf.py` (Playwright).
- **Standalone & Web Deploy Bundle:** `python src/web-deck/build_standalone.py` (optionally `--url "https://..."`) bundles `styles.css`, `vendor/gsap.min.js` (offline GSAP 3.12.5), `deck.js`, and all `assets/` as base64 data URIs into `dist/U10Zr_Metallic_Fuel_SFR_standalone.html` and `docs/index.html` (ready for GitHub Pages `/docs` and Cloudflare Pages). Slide 1 includes `.pdf-web-link` visible only in `@media print` / `?export=pdf`.

## 6. Auto-Sync Rule for Project Instructions
- **Mandatory Instruction Sync:** Whenever any design, layout, typography, chemical notation, or PDF/export decision changes in `src/web-deck/` or `assets/schematics/`, **automatically update** `GEMINI.md` and `.agents/rules/slides-layout.md` in the same turn so these rule files always remain the up-to-date source of truth.
