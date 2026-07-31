import io
import logging
import time

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/from-image", tags=["Image to PDF"])

SUPPORTED_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "bmp"}
MAX_IMAGES = 30
MAX_TOTAL_SIZE = 100 * 1024 * 1024


@router.post("")
async def image_to_pdf(
    files: list[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="No images provided.")

    if len(files) > MAX_IMAGES:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {MAX_IMAGES} images allowed.",
        )

    from PIL import Image
    import img2pdf

    contents: list[bytes] = []
    total_size = 0

    for f in files:
        ext = (f.filename or "").rsplit(".", 1)[-1].lower()
        if ext not in SUPPORTED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported image format: '{f.filename}'. Supported: PNG, JPG, JPEG, WEBP, BMP.",
            )

        content = await f.read()
        total_size += len(content)

        if total_size > MAX_TOTAL_SIZE:
            raise HTTPException(
                status_code=400,
                detail="Total upload size exceeds 100 MB limit.",
            )

        try:
            img = Image.open(io.BytesIO(content))
            img.verify()
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"Corrupt or invalid image: '{f.filename}'.",
            )

        contents.append(content)

    try:
        start = time.perf_counter()

        a4_pt = (595.28, 841.89)
        layout_fun = img2pdf.get_layout_fun(pagesize=a4_pt)
        pdf_bytes = img2pdf.convert(
            [io.BytesIO(c) for c in contents],
            layout_fun=layout_fun,
        )

        elapsed = time.perf_counter() - start
        output_size = len(pdf_bytes)

        logger.info(
            "Image to PDF — images=%d, total_input=%.2fKB, output=%.2fKB, time=%.2fs",
            len(contents),
            total_size / 1024,
            output_size / 1024,
            elapsed,
        )

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": 'attachment; filename="generated.pdf"',
                "X-Image-Count": str(len(contents)),
                "X-Page-Count": str(len(contents)),
                "X-Original-Size": str(total_size),
                "X-Output-Size": str(output_size),
                "X-Processing-Time": f"{elapsed:.2f}",
            },
        )

    except Exception as exc:
        logger.error("Image to PDF conversion failed: %s", exc)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate PDF from images: {exc}",
        )
