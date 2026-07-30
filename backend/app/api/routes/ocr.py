import concurrent.futures
import io
import logging
import os
import shutil
import time
from functools import partial
from pathlib import Path

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    _h = logging.StreamHandler()
    _h.setFormatter(logging.Formatter("%(message)s"))
    logger.addHandler(_h)

router = APIRouter(prefix="/ocr", tags=["OCR"])

_MAX_SIZE = 100 * 1024 * 1024

_TESSERACT_CONFIG = "--oem 1 --psm 6"
_MAX_IMAGE_DIMENSION = 4000  # Max pixels on longest edge before downscaling

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

    t_upload = time.perf_counter()
    content = await file.read()
    t_upload_end = time.perf_counter()
    logger.info("Upload: %.4fs (size=%d)", t_upload_end - t_upload, len(content))

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit.")

    import pytesseract
    from PIL import Image, ImageOps

    def _preprocess(img: Image.Image) -> Image.Image:
        img = ImageOps.grayscale(img)
        if max(img.width, img.height) > _MAX_IMAGE_DIMENSION:
            scale = _MAX_IMAGE_DIMENSION / max(img.width, img.height)
            new_w = int(img.width * scale)
            new_h = int(img.height * scale)
            img = img.resize((new_w, new_h), Image.LANCZOS)
        return img

    try:
        start = time.perf_counter()

        if ext == ".pdf":
            from pdf2image import convert_from_bytes

            try:
                t_convert = time.perf_counter()
                images = convert_from_bytes(content, dpi=dpi)
                t_convert_end = time.perf_counter()
                logger.info("PDF -> images: %.4fs (%d pages)", t_convert_end - t_convert, len(images))
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Could not process PDF file: {exc}",
                )

            if len(images) == 0:
                raise HTTPException(status_code=400, detail="PDF has no pages.")

            t_ocr = time.perf_counter()
            if len(images) == 1:
                img_ready = _preprocess(images[0])
                page_text = pytesseract.image_to_string(img_ready, lang=language, config=_TESSERACT_CONFIG)
                results = [page_text]
            else:
                os.environ["OMP_THREAD_LIMIT"] = "1"
                ocr_func = partial(pytesseract.image_to_string, lang=language, config=_TESSERACT_CONFIG)
                with concurrent.futures.ThreadPoolExecutor(
                    max_workers=min(len(images), os.cpu_count() or 4)
                ) as executor:
                    futures = [
                        executor.submit(ocr_func, _preprocess(img))
                        for img in images
                    ]
                    results = [f.result() for f in futures]
            t_ocr_end = time.perf_counter()
            logger.info("OCR: %.4fs (%d pages)", t_ocr_end - t_ocr, len(images))

            pages_text = [
                r.strip() if r.strip() else "[No text found on this page]"
                for r in results
            ]
        else:
            try:
                t_img = time.perf_counter()
                img = Image.open(io.BytesIO(content))
                img.load()
                t_img_end = time.perf_counter()
                logger.info("Image load: %.4fs", t_img_end - t_img)
            except Exception as exc:
                raise HTTPException(
                    status_code=400,
                    detail=f"Corrupt or invalid image file: {exc}",
                )

            t_ocr = time.perf_counter()
            img_ready = _preprocess(img)
            page_text = pytesseract.image_to_string(img_ready, lang=language, config=_TESSERACT_CONFIG)
            t_ocr_end = time.perf_counter()
            logger.info("Preprocess + OCR: %.4fs", t_ocr_end - t_ocr)
            pages_text = [
                page_text.strip() if page_text.strip() else "[No text found on this image]"
            ]

        t_assemble = time.perf_counter()
        total_chars = sum(len(t) for t in pages_text)

        if len(pages_text) > 1:
            output_lines = []
            for idx, page_content in enumerate(pages_text, start=1):
                output_lines.append(_PAGE_SEPARATOR.format(idx))
                output_lines.append(page_content)
            output_text = "\n".join(output_lines)
        else:
            output_text = pages_text[0] if pages_text else ""
        t_assemble_end = time.perf_counter()
        logger.info("Text assembly: %.4fs", t_assemble_end - t_assemble)

        elapsed = time.perf_counter() - start
        logger.info(
            "OCR — pages=%d, language=%s, chars=%d, total=%.2fs",
            len(pages_text), language, total_chars, elapsed,
        )

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
