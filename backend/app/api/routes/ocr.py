import io
import logging
import os
import shutil
import tempfile
import time
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["OCR"])

_MAX_SIZE = 100 * 1024 * 1024

SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".webp",
    ".bmp",
    ".tiff",
    ".tif",
}

SUPPORTED_LANGUAGES: dict[str, str] = {
    "eng": "English",
}

_PAGE_SEPARATOR = "========== Page {} =========="


def cleanup(paths: list[str]) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.unlink(p)
        except OSError:
            pass


def _check_tesseract() -> None:
    if shutil.which("tesseract") is None:
        raise RuntimeError(
            "Tesseract OCR is not installed. Install tesseract-ocr on the server."
        )


@router.post("")
async def ocr(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    ext = Path(file.filename or "file").suffix.lower()
    if ext not in SUPPORTED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported file type '{ext}'. "
                f"Supported: {', '.join(sorted(SUPPORTED_EXTENSIONS))}."
            ),
        )

    if language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Unsupported language '{language}'. "
                f"Supported: {', '.join(SUPPORTED_LANGUAGES.keys())}."
            ),
        )

    _check_tesseract()

    content = await file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit.")

    import pytesseract
    from PIL import Image

    tmp_paths: list[str] = []

    try:
        start = time.perf_counter()
        pages_text: list[str] = []

        if ext == ".pdf":
            from pdf2image import convert_from_bytes

            try:
                images = convert_from_bytes(content)
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not process PDF file: {exc}",
                )

            if len(images) == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            for img in images:
                page_text = pytesseract.image_to_string(img, lang=language)
                pages_text.append(
                    page_text.strip() if page_text.strip() else "[No text found on this page]"
                )
        else:
            try:
                img = Image.open(io.BytesIO(content))
                img.load()
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Corrupt or invalid image file: {exc}",
                )

            page_text = pytesseract.image_to_string(img, lang=language)
            pages_text.append(
                page_text.strip() if page_text.strip() else "[No text found on this image]"
            )

        elapsed = time.perf_counter() - start
        total_chars = sum(len(t) for t in pages_text)

        logger.info(
            "OCR — pages=%d, language=%s, chars=%d, time=%.2fs",
            len(pages_text),
            language,
            total_chars,
            elapsed,
        )

        output_lines: list[str] = []
        for idx, page_content in enumerate(pages_text, start=1):
            if len(pages_text) > 1:
                output_lines.append(_PAGE_SEPARATOR.format(idx))
            output_lines.append(page_content)

        output_text = "\n".join(output_lines)
        output_filename = os.path.splitext(file.filename or "document")[0] + ".txt"

        background_tasks.add_task(cleanup, tmp_paths)

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
        cleanup(tmp_paths)
        raise
    except Exception as exc:
        cleanup(tmp_paths)
        err_str = str(exc).lower()
        if "tesseract" in err_str or "not found" in err_str or "cannot find" in err_str:
            raise HTTPException(
                status_code=500,
                detail="Tesseract OCR is not installed or not found on the server.",
            )
        raise HTTPException(
            status_code=500,
            detail=f"OCR processing failed: {exc}",
        )
