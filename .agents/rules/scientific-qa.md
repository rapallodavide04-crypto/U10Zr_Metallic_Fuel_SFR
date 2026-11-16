# Scientific & Visual QA Checklist

1. **Data Integrity:** All temperatures, burnup, dpa, dimensions, and alloy compositions match `content/data-tables.json`.
2. **No Synthetic Data:** Zero generated micrographs, EDS maps, or experimental plots. Only `s03-fuel-pin-cross-section.svg` and `s12-two-stage-roadmap.svg` are code-generated vector schematics.
3. **Captions & Units:** Every figure has a source caption directly below it; units (`°C`, `dpa`, `at%`, `GWd/MTHM`, `W/(m·K)`, `g/cm³`, `mm`, `µm`) are consistent.
4. **Overflow & Print Check:** All 14 slides fit within `1280×720` with zero scrollbar, zero clipped text, and all animated elements visible in `?export=pdf`.
