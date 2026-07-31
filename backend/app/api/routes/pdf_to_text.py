import logging
import os
import time
from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/to-text", tags=["PDF to Text"])

_MAX_SIZE = 50 * 1024 * 1024


@router.post("")
async def pdf_to_text(
    file: UploadFile = File(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF (got {file.content_type}).",
        )

    content = await file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50 MB limit.")

    import pdfplumber

    start = time.perf_counter()
    pages_text: list[str] = []

    try:
        with pdfplumber.open(BytesIO(content)) as pdf:
            if len(pdf.pages) == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            for i, page in enumerate(pdf.pages, start=1):
                page_text = page.extract_text()
                if page_text and page_text.strip():
                    pages_text.append(page_text.strip())
                else:
                    pages_text.append("[No text found on this page]")

        elapsed = time.perf_counter() - start
        total_chars = sum(len(t) for t in pages_text)

        logger.info(
            "PDF to Text — pages=%d, chars=%d, time=%.2fs",
            len(pages_text),
            total_chars,
            elapsed,
        )

        output_lines: list[str] = []
        for idx, page_content in enumerate(pages_text, start=1):
            output_lines.append(f"========== Page {idx} ==========")
            output_lines.append(page_content)

        output_text = "\n".join(output_lines)
        output_filename = os.path.splitext(file.filename or "document")[0] + ".txt"

        return Response(
            content=output_text,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"',
                "X-Pages-Processed": str(len(pages_text)),
                "X-Chars-Extracted": str(total_chars),
                "X-Processing-Time": f"{elapsed:.2f}",
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
        err_msg = str(exc).lower()
        if "password" in err_msg or "encrypt" in err_msg:
            raise HTTPException(
                status_code=400,
                detail="PDF is password-protected. Please provide an unprotected PDF.",
            )
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text from PDF: {exc}",
        )
