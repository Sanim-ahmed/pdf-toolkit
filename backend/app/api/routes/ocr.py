import concurrent.futures
import io
import logging
import os
import shutil
import time
from pathlib import Path

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ocr", tags=["OCR"])

_MAX_SIZE = 100 * 1024 * 1024

_timings: dict[str, float] = {}


def _t(label: str) -> None:
    _timings[label] = time.perf_counter()


def _log_timings() -> None:
    if not _timings:
        return
    sorted_keys = sorted(_timings.keys(), key=lambda k: list(_timings.keys()).index(k))
    total = 0.0
    prev_label = None
    prev_val = None
    for k in sorted_keys:
        v = _timings[k]
        if prev_label is not None and prev_val is not None:
            delta = v - prev_val
            total += delta
            logger.info("  ⏱  %s \u2192 %s: %.4fs", prev_label, k, delta)
        prev_label = k
        prev_val = v
    logger.info("  ⏱  TOTAL: %.4fs", total)


SUPPORTED_EXTENSIONS = {
    ".pdf",
    ".png", ".jpg", ".jpeg",
    ".webp", ".bmp", ".tiff", ".tif",
}

SUPPORTED_LANGUAGES: dict[str, str] = {
    "eng": "English",
}

_PAGE_SEPARATOR = "========== Page {} =========="


def _check_tesseract() -> None:
    if shutil.which("tesseract") is None:
        raise RuntimeError(
            "Tesseract OCR is not installed. Install tesseract-ocr on the server."
        )


@router.post("")
async def ocr(
    file: UploadFile = File(...),
    language: str = Form("eng"),
    dpi: int = Form(200),
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

    if dpi < 100 or dpi > 600:
        raise HTTPException(
            status_code=400,
            detail="DPI must be between 100 and 600.",
        )

    _check_tesseract()

    _t("upload_start")
    content = await file.read()
    _t("upload_end")

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit.")

    import pytesseract
    from PIL import Image, ImageOps

    try:
        _timings.clear()
        _t("start")

        if ext == ".pdf":
            from pdf2image import convert_from_bytes

            try:
                _t("pdf_to_image_start")
                images = convert_from_bytes(content, dpi=dpi)
                _t("pdf_to_image_end")
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not process PDF file: {exc}",
                )

            if len(images) == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            os.environ["OMP_THREAD_LIMIT"] = "1"

            _t("ocr_start")
            if len(images) == 1:
                img_gray = ImageOps.grayscale(images[0])
                page_text = pytesseract.image_to_string(img_gray, lang=language)
                results = [page_text]
            else:
                with concurrent.futures.ThreadPoolExecutor(
                    max_workers=min(len(images), os.cpu_count() or 4)
                ) as executor:
                    futures = []
                    for img in images:
                        img_gray = ImageOps.grayscale(img)
                        futures.append(
                            executor.submit(
                                pytesseract.image_to_string, img_gray, lang=language
                            )
                        )
                    results = [f.result() for f in futures]
            _t("ocr_end")

            pages_text = [
                r.strip() if r.strip() else "[No text found on this page]"
                for r in results
            ]
        else:
            try:
                _t("image_open_start")
                img = Image.open(io.BytesIO(content))
                img.load()
                _t("image_open_end")
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Corrupt or invalid image file: {exc}",
                )

            _t("ocr_start")
            img_gray = ImageOps.grayscale(img)
            page_text = pytesseract.image_to_string(img_gray, lang=language)
            _t("ocr_end")
            pages_text = [
                page_text.strip() if page_text.strip() else "[No text found on this image]"
            ]

        _t("text_assembly_start")
        total_chars = sum(len(t) for t in pages_text)

        if len(pages_text) > 1:
            output_lines = []
            for idx, page_content in enumerate(pages_text, start=1):
                output_lines.append(_PAGE_SEPARATOR.format(idx))
                output_lines.append(page_content)
            output_text = "\n".join(output_lines)
        else:
            output_text = pages_text[0] if pages_text else ""

        _t("text_assembly_end")

        _log_timings()

        output_filename = os.path.splitext(file.filename or "document")[0] + ".txt"

        return Response(
            content=output_text,
            media_type="text/plain",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"',
                "X-Pages-Processed": str(len(pages_text)),
                "X-Chars-Extracted": str(total_chars),
                "X-Processing-Time": f"{_timings.get('text_assembly_end', 0) - _timings.get('start', 0):.2f}",
            },
        )

    except HTTPException:
        raise
    except Exception as exc:
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
