# Build and Export Workflow

1. Open `src/web-deck/index.html` in a browser (or serve locally) to review interactive step-by-step animations (Arrow keys / Space).
2. Run PDF export via Playwright:
   ```bash
   python src/web-deck/export_pdf.py
   ```
3. Verify `dist/U10Zr_SFR_Rapallo.pdf` contains 14 `16:9` pages with `opacity: 1` on all elements and zero text overflow.
