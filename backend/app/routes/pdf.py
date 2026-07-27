from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

from app.services.pdf import (
    compress_pdf,
    extract_pages,
    images_to_pdf,
    merge_pdfs,
    pdf_to_images,
    rotate_pdf,
    split_pdf,
)
from app.utilities.helpers import (
    create_zip,
    parse_page_ranges,
    read_file_content,
    validate_image_content_type,
    validate_pdf_content_type,
)

router = APIRouter(prefix="/pdf", tags=["PDF"])


@router.post("/merge")
async def merge(files: list[UploadFile] = File(...)) -> Response:
    if len(files) < 2:
        raise HTTPException(
            status_code=400, detail="At least two PDF files are required."
        )
    for f in files:
        try:
            validate_pdf_content_type(f)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    contents = [await read_file_content(f) for f in files]
    try:
        merged = await merge_pdfs(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to merge PDFs: {e}")

    return Response(
        content=merged,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=merged.pdf"},
    )


@router.post("/split")
async def split(
    file: UploadFile = File(...),
    pages: str = Form(...),
) -> Response:
    try:
        validate_pdf_content_type(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_bytes = await read_file_content(file)

    try:
        from pypdf import PdfReader

        total = PdfReader(BytesIO(file_bytes)).get_pages_num()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF: {e}")

    try:
        page_list = parse_page_ranges(pages, total)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        parts = await split_pdf(file_bytes, page_list)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to split PDF: {e}")

    if len(parts) == 1:
        name, data = next(iter(parts.items()))
        return Response(
            content=data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={name}"},
        )

    zip_data = create_zip(parts)
    return Response(
        content=zip_data,
        media_type="application/zip",
        headers={"Content-Disposition": "attachment; filename=split_pages.zip"},
    )


@router.post("/compress")
async def compress(file: UploadFile = File(...)) -> Response:
    try:
        validate_pdf_content_type(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_bytes = await read_file_content(file)
    try:
        compressed = await compress_pdf(file_bytes)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to compress PDF: {e}"
        )

    return Response(
        content=compressed,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=compressed.pdf"},
    )


@router.post("/rotate")
async def rotate(
    file: UploadFile = File(...),
    angle: int = Form(...),
) -> Response:
    try:
        validate_pdf_content_type(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if angle not in (90, 180, 270):
        raise HTTPException(
            status_code=400,
            detail="Rotation angle must be 90, 180, or 270.",
        )

    file_bytes = await read_file_content(file)
    try:
        rotated = await rotate_pdf(file_bytes, angle)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to rotate PDF: {e}"
        )

    return Response(
        content=rotated,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=rotated.pdf"},
    )


@router.post("/extract")
async def extract(
    file: UploadFile = File(...),
    pages: str = Form(...),
) -> Response:
    try:
        validate_pdf_content_type(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    file_bytes = await read_file_content(file)

    try:
        from pypdf import PdfReader

        total = PdfReader(BytesIO(file_bytes)).get_pages_num()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid PDF: {e}")

    try:
        page_list = parse_page_ranges(pages, total)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    try:
        extracted = await extract_pages(file_bytes, page_list)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to extract pages: {e}"
        )

    return Response(
        content=extracted,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=extracted.pdf"},
    )


@router.post("/to-image")
async def to_image(
    file: UploadFile = File(...),
    fmt: str = Form("png"),
    dpi: int = Form(150),
) -> Response:
    try:
        validate_pdf_content_type(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if fmt not in ("png", "jpg"):
        raise HTTPException(
            status_code=400, detail="Format must be 'png' or 'jpg'."
        )
    if dpi < 72 or dpi > 300:
        raise HTTPException(
            status_code=400, detail="DPI must be between 72 and 300."
        )

    file_bytes = await read_file_content(file)
    try:
        images = await pdf_to_images(file_bytes, fmt=fmt, dpi=dpi)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to convert PDF to images: {e}"
        )

    if len(images) == 1:
        name, data = next(iter(images.items()))
        media = "image/png" if fmt == "png" else "image/jpeg"
        return Response(
            content=data,
            media_type=media,
            headers={"Content-Disposition": f"attachment; filename={name}"},
        )

    zip_data = create_zip(images)
    return Response(
        content=zip_data,
        media_type="application/zip",
        headers={
            "Content-Disposition": "attachment; filename=pdf_images.zip"
        },
    )


@router.post("/image-to-pdf")
async def image_to_pdf(files: list[UploadFile] = File(...)) -> Response:
    if not files:
        raise HTTPException(
            status_code=400, detail="At least one image file is required."
        )

    for f in files:
        try:
            validate_image_content_type(f)
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e))

    file_pairs = []
    for f in files:
        content = await read_file_content(f)
        file_pairs.append((f.name, content))

    try:
        pdf_bytes = await images_to_pdf(file_pairs)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to create PDF from images: {e}"
        )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": "attachment; filename=images.pdf"
        },
    )
