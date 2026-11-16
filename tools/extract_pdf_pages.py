"""
Extract high-resolution (300 DPI) PNG pages or cropped regions from primary PDFs in docs/.

Usage examples:
  # Render page 15 of NUREG-CR-7305.pdf at 300 DPI:
  python tools/extract_pdf_pages.py docs/NUREG-CR-7305.pdf --pages 15 --out-dir assets/figures

  # Render page 4 of Wang-2022-INL-FCCI.pdf and crop (normalized x0 y0 x1 y1):
  python tools/extract_pdf_pages.py docs/Wang-2022-INL-FCCI.pdf --pages 6 --crop 0.08 0.12 0.92 0.65 --out assets/figures/s07-fcci-ebr2-eds.png
"""

from __future__ import annotations

import argparse
from pathlib import Path

import fitz  # PyMuPDF


def render_page(
    pdf_path: Path,
    page_num_1based: int,
    dpi: int,
    out_path: Path,
    crop_norm: tuple[float, float, float, float] | None = None,
) -> None:
    doc = fitz.open(pdf_path)
    if page_num_1based < 1 or page_num_1based > len(doc):
        raise ValueError(f"Page {page_num_1based} out of range (1..{len(doc)}) for {pdf_path.name}")

    page = doc[page_num_1based - 1]
    clip = None
    if crop_norm is not None:
        x0, y0, x1, y1 = crop_norm
        rect = page.rect
        clip = fitz.Rect(
            rect.x0 + x0 * rect.width,
            rect.y0 + y0 * rect.height,
            rect.x0 + x1 * rect.width,
            rect.y0 + y1 * rect.height,
        )

    pix = page.get_pixmap(dpi=dpi, clip=clip, alpha=False)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    pix.save(str(out_path))
    print(f"Saved {out_path} ({pix.width}x{pix.height} px @ {dpi} DPI)")


def main() -> None:
    parser = argparse.ArgumentParser(description="Extract 300 DPI PNGs from PDFs in docs/.")
    parser.add_argument("pdf", type=Path, help="Input PDF path (e.g., docs/NUREG-CR-7305.pdf)")
    parser.add_argument("--pages", type=int, nargs="+", required=True, help="1-based page numbers")
    parser.add_argument("--dpi", type=int, default=300, help="Render DPI (default: 300)")
    parser.add_argument("--out-dir", type=Path, default=Path("assets/figures"), help="Output directory")
    parser.add_argument("--out", type=Path, default=None, help="Exact output file path (single page only)")
    parser.add_argument(
        "--crop",
        type=float,
        nargs=4,
        metavar=("X0", "Y0", "X1", "Y1"),
        default=None,
        help="Optional normalized crop box (0..1)",
    )
    args = parser.parse_args()

    if args.out is not None and len(args.pages) != 1:
        raise ValueError("--out can only be used with a single page in --pages")

    crop_tuple = tuple(args.crop) if args.crop is not None else None
    for page_num in args.pages:
        target = args.out or (args.out_dir / f"{args.pdf.stem}_p{page_num:03d}.png")
        render_page(args.pdf, page_num, args.dpi, target, crop_tuple)


if __name__ == "__main__":
    main()
