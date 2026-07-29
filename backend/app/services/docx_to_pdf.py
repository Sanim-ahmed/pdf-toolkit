import io

from docx import Document as DocxDocument
from docx.enum.text import WD_ALIGN_PARAGRAPH
from fpdf import FPDF


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
    pdf.add_page()

    for para in doc.paragraphs:
        style_name = para.style.name.lower() if para.style else ""
        is_heading = style_name.startswith("heading")

        if is_heading:
            level = int(style_name.replace("heading", "").strip()) if any(c.isdigit() for c in style_name) else 1
            size, bold = _heading_level_to_size(level)
            pdf.set_font("Helvetica", "B" if bold else "", size)
        else:
            pdf.set_font("Helvetica", "", 12)

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
