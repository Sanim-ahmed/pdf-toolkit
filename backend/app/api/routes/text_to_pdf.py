import logging
import os
import tempfile
import time
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/from-text", tags=["Text to PDF"])

_MAX_SIZE = 10 * 1024 * 1024

FONT_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "fonts", "DejaVuSans.ttf")

TEXT_MIME_TYPES = {
    "text/plain",
    "text/x-python",
    "text/x-java",
    "text/x-c",
    "text/x-c++",
    "text/css",
    "text/html",
    "text/javascript",
    "application/json",
    "application/xml",
    "application/x-sh",
    "application/x-yaml",
}


def cleanup(paths: list[str]) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.unlink(p)
        except OSError:
            pass


def decode_content(content: bytes) -> str:
    encodings = ["utf-8", "utf-16", "latin-1"]
    for enc in encodings:
        try:
            return content.decode(enc)
        except (UnicodeDecodeError, LookupError):
            continue
    raise HTTPException(
        status_code=400,
        detail="Could not decode file as UTF-8, UTF-16, or Latin-1.",
    )


def _generate_pdf(text: str, output_filename: str, background_tasks: BackgroundTasks):
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer

    pdfmetrics.registerFont(TTFont("DejaVuSans", FONT_PATH))

    tmp_pdf: str | None = None

    try:
        tmp_pdf_obj = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp_pdf = tmp_pdf_obj.name
        tmp_pdf_obj.close()

        start = time.perf_counter()
        raw_lines = text.splitlines(keepends=False)
        total_lines = len(raw_lines)
        total_chars = len(text)

        PAGE_WIDTH, PAGE_HEIGHT = A4
        MARGIN = 20 * mm
        FONT_SIZE = 12
        LEADING = FONT_SIZE * 1.4

        style = ParagraphStyle(
            "Text",
            fontName="DejaVuSans",
            fontSize=FONT_SIZE,
            leading=LEADING,
            spaceBefore=0,
            spaceAfter=0,
            allowWidows=0,
            allowOrphans=0,
        )

        doc = SimpleDocTemplate(
            tmp_pdf,
            pagesize=A4,
            topMargin=MARGIN,
            bottomMargin=MARGIN,
            leftMargin=MARGIN,
            rightMargin=MARGIN,
        )

        story: list = []
        for raw_line in raw_lines:
            if not raw_line:
                story.append(Spacer(1, LEADING * 0.6))
            else:
                story.append(Paragraph(raw_line, style))

        doc.build(story)

        elapsed = time.perf_counter() - start
        try:
            from pypdf import PdfReader
            reader = PdfReader(tmp_pdf)
            pages_generated = len(reader.pages)
        except Exception:
            pages_generated = 0

        logger.info(
            "Text to PDF — chars=%d, lines=%d, pages=%d, time=%.2fs",
            total_chars,
            total_lines,
            pages_generated,
            elapsed,
        )

        background_tasks.add_task(cleanup, [tmp_pdf])

        return FileResponse(
            path=tmp_pdf,
            media_type="application/pdf",
            filename=output_filename,
            headers={
                "X-Chars-Processed": str(total_chars),
                "X-Lines-Processed": str(total_lines),
                "X-Pages-Generated": str(pages_generated),
                "X-Processing-Time": f"{elapsed:.2f}",
            },
        )

    except HTTPException:
        cleanup([tmp_pdf])
        raise
    except Exception as exc:
        cleanup([tmp_pdf])
        logger.error("Text to PDF generation failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF: {exc}",
        )


@router.post("")
async def text_to_pdf(
    background_tasks: BackgroundTasks = BackgroundTasks(),
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    if file is not None:
        filename = (file.filename or "").lower()
        if not filename.endswith(".txt") and file.content_type not in TEXT_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"File '{file.filename}' is not a valid text file (got {file.content_type}).",
            )

        content = await file.read()

        if len(content) > _MAX_SIZE:
            raise HTTPException(status_code=400, detail="File exceeds 10 MB limit.")

        if not content:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        text_content = decode_content(content)
        output_filename = os.path.splitext(file.filename or "document")[0] + ".pdf"

        return _generate_pdf(text_content, output_filename, background_tasks)

    if text is not None and text.strip():
        if len(text.encode("utf-8")) > _MAX_SIZE:
            raise HTTPException(status_code=400, detail="Text exceeds 10 MB limit.")

        return _generate_pdf(text, "document.pdf", background_tasks)

    raise HTTPException(
        status_code=400,
        detail="No text provided. Upload a .txt file or provide text content.",
    )
