"""
Export src/web-deck/U10Zr_Metallic_Fuel_SFR.html?export=pdf to dist/U10Zr_SFR_Rapallo.pdf (14 pages, 1280x720 16:9).

Prerequisites:
  pip install playwright
  playwright install chromium
"""

from __future__ import annotations

from pathlib import Path
from playwright.sync_api import sync_playwright


def export_pdf() -> None:
    repo_root = Path(__file__).resolve().parents[2]
    html_path = repo_root / "src" / "web-deck" / "U10Zr_Metallic_Fuel_SFR.html"
    out_pdf = repo_root / "dist" / "U10Zr_SFR_Rapallo.pdf"
    out_pdf.parent.mkdir(parents=True, exist_ok=True)

    url = f"{html_path.as_uri()}?export=pdf"
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(url, wait_until="networkidle")
        page.emulate_media(media="print")
        page.pdf(
            path=str(out_pdf),
            width="1280px",
            height="720px",
            print_background=True,
            prefer_css_page_size=True,
            margin={"top": "0px", "right": "0px", "bottom": "0px", "left": "0px"},
        )
        browser.close()

    print(f"Exported 14-slide PDF to: {out_pdf}")


if __name__ == "__main__":
    export_pdf()
