import logging
import os
import tempfile
import time

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/to-text", tags=["PDF to Text"])

_MAX_SIZE = 50 * 1024 * 1024


def cleanup(paths: list[str]) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.unlink(p)
        except OSError:
            pass


@router.post("")
async def pdf_to_text(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF (got {file.content_type}).",
        )

    content = await file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50 MB limit.")

    tmp_pdf: str | None = None

    try:
        tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp_pdf.write(content)
        tmp_pdf.close()

        import pdfplumber

        start = time.perf_counter()
        pages_text: list[str] = []

        try:
            with pdfplumber.open(tmp_pdf.name) as pdf:
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

            background_tasks.add_task(cleanup, [tmp_pdf.name])

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

    except HTTPException:
        cleanup([tmp_pdf.name if tmp_pdf else None])
        raise
    except Exception as exc:
        cleanup([tmp_pdf.name if tmp_pdf else None])
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process PDF: {exc}",
        )
