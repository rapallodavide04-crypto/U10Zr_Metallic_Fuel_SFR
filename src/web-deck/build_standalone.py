"""
Build a self-contained, offline-ready single-file HTML bundle from src/web-deck/U10Zr_Metallic_Fuel_SFR.html.

Outputs:
  - dist/U10Zr_Metallic_Fuel_SFR_standalone.html  (portable anywhere on PC/USB)
  - docs/index.html                                (ready for GitHub Pages /docs & Cloudflare Pages)

Usage:
  python src/web-deck/build_standalone.py
  python src/web-deck/build_standalone.py --url "https://username.github.io/u10zr-sfr-case-study/"
"""

from __future__ import annotations

import argparse
import base64
import mimetypes
import re
from pathlib import Path

MIME_OVERRIDES = {
    ".svg": "image/svg+xml",
    ".avif": "image/avif",
    ".webp": "image/webp",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
}


def to_data_uri(asset_path: Path) -> str:
    ext = asset_path.suffix.lower()
    mime = MIME_OVERRIDES.get(ext) or mimetypes.guess_type(str(asset_path))[0] or "application/octet-stream"
    encoded = base64.b64encode(asset_path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def build_standalone(web_url: str | None = None) -> tuple[Path, Path]:
    deck_dir = Path(__file__).resolve().parent
    repo_root = deck_dir.parents[1]

    html_path = deck_dir / "U10Zr_Metallic_Fuel_SFR.html"
    css_path = deck_dir / "styles.css"
    js_path = deck_dir / "deck.js"
    gsap_path = deck_dir / "vendor" / "gsap.min.js"

    html = html_path.read_text(encoding="utf-8")
    css = css_path.read_text(encoding="utf-8")
    js = js_path.read_text(encoding="utf-8")
    gsap_js = gsap_path.read_text(encoding="utf-8")

    # 1. Inline styles.css
    css_link_pattern = re.compile(r'<link\s+rel="stylesheet"\s+href="styles\.css"\s*/?>')
    if not css_link_pattern.search(html):
        raise RuntimeError("Could not find <link rel=\"stylesheet\" href=\"styles.css\" /> in HTML")
    html = css_link_pattern.sub(lambda _: f"<style>\n{css}\n  </style>", html, count=1)

    # 2. Inline local vendor/gsap.min.js
    gsap_pattern = re.compile(r'<script\s+src="(?:vendor/gsap\.min\.js|https://[^"]*gsap\.min\.js)"\s+defer></script>')
    if not gsap_pattern.search(html):
        raise RuntimeError("Could not find GSAP <script> tag in HTML")
    html = gsap_pattern.sub(lambda _: f"<script defer>\n{gsap_js}\n  </script>", html, count=1)

    # 3. Inline deck.js
    deck_js_pattern = re.compile(r'<script\s+src="deck\.js"\s+defer></script>')
    if not deck_js_pattern.search(html):
        raise RuntimeError("Could not find <script src=\"deck.js\" defer></script> in HTML")
    html = deck_js_pattern.sub(lambda _: f"<script defer>\n{js}\n  </script>", html, count=1)

    # 4. Inline all local ../../assets/... images as base64 data URIs
    asset_pattern = re.compile(r'src="(\.\./\.\./assets/[^"]+)"')
    embedded_count = 0

    def replace_asset(match: re.Match[str]) -> str:
        nonlocal embedded_count
        rel = match.group(1)
        resolved = (deck_dir / rel).resolve()
        if not resolved.exists():
            raise FileNotFoundError(f"Missing local asset referenced in HTML: {resolved}")
        embedded_count += 1
        return f'src="{to_data_uri(resolved)}"'

    html = asset_pattern.sub(replace_asset, html)

    # 5. Optionally update the PDF web link URL
    if web_url:
        html = re.sub(
            r'(<a\s+class="pdf-web-link"\s+href=")[^"]+(")',
            rf"\g<1>{web_url}\g<2>",
            html,
            count=1,
        )

    # Sanity check: ensure no unresolved relative asset/script/style paths remain
    leftover = re.findall(r'(?:src|href)="(?:\.\./|styles\.css|deck\.js|vendor/)[^"]*"', html)
    if leftover:
        raise RuntimeError(f"Unresolved local references remain in standalone HTML: {leftover}")

    dist_out = repo_root / "dist" / "U10Zr_Metallic_Fuel_SFR_standalone.html"
    docs_out = repo_root / "docs" / "index.html"
    dist_out.parent.mkdir(parents=True, exist_ok=True)
    docs_out.parent.mkdir(parents=True, exist_ok=True)

    dist_out.write_text(html, encoding="utf-8")
    docs_out.write_text(html, encoding="utf-8")

    print(f"Embedded {embedded_count} asset references + CSS + GSAP + deck.js")
    print(f"Standalone HTML ({dist_out.stat().st_size:,} bytes): {dist_out}")
    print(f"Web deploy HTML ({docs_out.stat().st_size:,} bytes): {docs_out}")
    return dist_out, docs_out


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Build standalone offline/web HTML bundle.")
    parser.add_argument("--url", help="Public HTTPS URL to embed in the PDF cover link", default=None)
    args = parser.parse_args()
    build_standalone(args.url)
