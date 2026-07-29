import io
import os

from docx import Document as DocxDocument
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fpdf import FPDF

_FONTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts")


def _resolve_alignment(docx_alignment) -> str:
    mapping = {
        WD_ALIGN_PARAGRAPH.LEFT: "L",
        WD_ALIGN_PARAGRAPH.CENTER: "C",
        WD_ALIGN_PARAGRAPH.RIGHT: "R",
        WD_ALIGN_PARAGRAPH.JUSTIFY: "J",
    }
    return mapping.get(docx_alignment, "L")


def _heading_level_to_size(level: int) -> tuple[int, bool]:
    sizes = {1: 22, 2: 18, 3: 15, 4: 13, 5: 12, 6: 11}
    return sizes.get(level, 12), True


def convert(docx_bytes: bytes) -> bytes:
    doc = DocxDocument(io.BytesIO(docx_bytes))
    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=20)

    pdf.add_font("DejaVu", "", os.path.join(_FONTS_DIR, "DejaVuSans.ttf"), uni=True)
    pdf.add_font("DejaVu", "B", os.path.join(_FONTS_DIR, "DejaVuSans-Bold.ttf"), uni=True)
    pdf.add_font("DejaVu", "I", os.path.join(_FONTS_DIR, "DejaVuSans-Oblique.ttf"), uni=True)
    pdf.add_font("DejaVu", "BI", os.path.join(_FONTS_DIR, "DejaVuSans-BoldOblique.ttf"), uni=True)

    pdf.add_page()

    for para in doc.paragraphs:
        style_name = para.style.name.lower() if para.style else ""
        is_heading = style_name.startswith("heading")

        if is_heading:
            level = int(style_name.replace("heading", "").strip()) if any(c.isdigit() for c in style_name) else 1
            size, bold = _heading_level_to_size(level)
            pdf.set_font("DejaVu", "B" if bold else "", size)
        else:
            pdf.set_font("DejaVu", "", 12)

        align = _resolve_alignment(para.alignment)
        text = para.text.strip()

        if not text:
            pdf.ln(4)
            continue

        pdf.multi_cell(0, 6, text, align=align)
        pdf.ln(2)

    buf = io.BytesIO()
    pdf.output(buf)
    buf.seek(0)
    return buf.read()
