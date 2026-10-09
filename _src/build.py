#!/usr/bin/env python3
"""Wrap HTML body fragments in a shared template and render to PDF via headless Chrome.

Usage:
    python3 build.py <fragment.html> <output.pdf> "<Title>"
Each fragment is body-only HTML. The shared stylesheet is inlined so PDFs are self-contained.
"""
import sys, subprocess, tempfile, os, pathlib

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
SRC = pathlib.Path(__file__).parent
CSS = (SRC / "assets" / "style.css").read_text()

TEMPLATE = """<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>{title}</title>
<style>{css}</style></head><body>{body}</body></html>"""

def build(fragment_path, out_pdf, title):
    body = pathlib.Path(fragment_path).read_text()
    html = TEMPLATE.format(title=title, css=CSS, body=body)
    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False, dir=SRC) as f:
        f.write(html)
        tmp = f.name
    try:
        subprocess.run(
            [CHROME, "--headless", "--disable-gpu", "--no-pdf-header-footer",
             f"--print-to-pdf={out_pdf}", "file://" + tmp],
            check=True, stderr=subprocess.DEVNULL, stdout=subprocess.DEVNULL,
        )
    finally:
        os.unlink(tmp)
    # report page count
    try:
        from pypdf import PdfReader
        n = len(PdfReader(out_pdf).pages)
        print(f"  OK  {os.path.basename(out_pdf)}  ({n} pages)")
    except Exception:
        print(f"  OK  {os.path.basename(out_pdf)}")

if __name__ == "__main__":
    build(sys.argv[1], sys.argv[2], sys.argv[3])
