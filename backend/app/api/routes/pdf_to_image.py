import io
import logging
import os
import shutil
import tempfile
import time
import zipfile

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/to-image", tags=["PDF to Image"])

_MAX_SIZE = 100 * 1024 * 1024
_SUPPORTED_FORMATS = {"png", "jpeg"}
_SUPPORTED_DPIS = {100, 200, 300}


def _validate_format(fmt: str) -> str:
    if fmt not in _SUPPORTED_FORMATS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported format '{fmt}'. Choose from: {', '.join(sorted(_SUPPORTED_FORMATS))}.",
        )
    return fmt


def _validate_dpi(dpi: int) -> int:
    if dpi not in _SUPPORTED_DPIS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported DPI '{dpi}'. Choose from: {', '.join(str(d) for d in sorted(_SUPPORTED_DPIS))}.",
        )
    return dpi


def cleanup(paths: list[str]) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                if os.path.isdir(p):
                    shutil.rmtree(p)
                else:
                    os.unlink(p)
        except OSError:
            pass


@router.post("")
async def pdf_to_image(
    file: UploadFile = File(...),
    fmt: str = Form("png"),
    dpi: int = Form(200),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    fmt_lower = _validate_format(fmt.lower())
    dpi_val = _validate_dpi(dpi)

    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF (got {file.content_type}).",
        )

    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' does not have a .pdf extension.",
        )

    content = await file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 100 MB limit.")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    tmpdir = tempfile.mkdtemp(prefix="pdf2img_")
    pdf_path = os.path.join(tmpdir, "input.pdf")

    try:
        with open(pdf_path, "wb") as f:
            f.write(content)

        from pdf2image import convert_from_path

        start = time.perf_counter()
        images = convert_from_path(pdf_path, dpi=dpi_val)
        elapsed = time.perf_counter() - start

        if len(images) == 0:
            raise HTTPException(status_code=400, detail="PDF has no pages.")

        pil_format = "PNG" if fmt_lower == "png" else "JPEG"
        ext = "png" if fmt_lower == "png" else "jpg"
        media_type = "image/png" if fmt_lower == "png" else "image/jpeg"
        save_kwargs = {} if fmt_lower == "png" else {"quality": 95}

        output_size = 0
        output_filename = os.path.splitext(file.filename or "document")[0]

        if len(images) == 1:
            buf = io.BytesIO()
            images[0].save(buf, format=pil_format, **save_kwargs)
            img_bytes = buf.getvalue()
            output_size = len(img_bytes)

            background_tasks.add_task(cleanup, [tmpdir])

            logger.info(
                "PDF to Image — pages=1, format=%s, dpi=%d, output=%.2fKB, time=%.2fs",
                fmt_lower, dpi_val, output_size / 1024, elapsed,
            )

            return Response(
                content=img_bytes,
                media_type=media_type,
                headers={
                    "Content-Disposition": f'attachment; filename="{output_filename}.{ext}"',
                    "X-Pages-Converted": "1",
                    "X-Output-Format": fmt_lower,
                    "X-DPI": str(dpi_val),
                    "X-Output-Size": str(output_size),
                    "X-Processing-Time": f"{elapsed:.2f}",
                },
            )

        zip_buf = io.BytesIO()
        with zipfile.ZipFile(zip_buf, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, img in enumerate(images, start=1):
                img_buf = io.BytesIO()
                img.save(img_buf, format=pil_format, **save_kwargs)
                zf.writestr(f"page-{i}.{ext}", img_buf.getvalue())
        zip_bytes = zip_buf.getvalue()
        output_size = len(zip_bytes)

        background_tasks.add_task(cleanup, [tmpdir])

        logger.info(
            "PDF to Image — pages=%d, format=%s, dpi=%d, output=%.2fKB, time=%.2fs",
            len(images), fmt_lower, dpi_val, output_size / 1024, elapsed,
        )

        return Response(
            content=zip_bytes,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}.zip"',
                "X-Pages-Converted": str(len(images)),
                "X-Output-Format": fmt_lower,
                "X-DPI": str(dpi_val),
                "X-Output-Size": str(output_size),
                "X-Processing-Time": f"{elapsed:.2f}",
            },
        )

    except HTTPException:
        cleanup([tmpdir])
        raise
    except Exception as exc:
        cleanup([tmpdir])
        err_msg = str(exc).lower()
        if "password" in err_msg or "encrypt" in err_msg:
            raise HTTPException(
                status_code=400,
                detail="PDF is password-protected. Please provide an unprotected PDF.",
            )
        logger.error("PDF to Image conversion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to convert PDF to images: {exc}",
        )
