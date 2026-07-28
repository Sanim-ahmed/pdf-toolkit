from io import BytesIO

from fastapi import HTTPException, UploadFile
from pypdf import PdfReader, PdfWriter


async def merge_pdfs(files: list[UploadFile]) -> bytes:
    """Read multiple uploaded PDFs and return the bytes of a single merged PDF."""
    writer = PdfWriter()

    for upload in files:
        if upload.content_type != "application/pdf":
            raise HTTPException(
                status_code=400,
                detail=f"File '{upload.filename}' is not a valid PDF (got {upload.content_type}).",
            )
        content = await upload.read()
        try:
            reader = PdfReader(BytesIO(content))
        except Exception:
            raise HTTPException(
                status_code=400,
                detail=f"File '{upload.filename}' could not be parsed as a PDF.",
            )
        for page in reader.pages:
            writer.add_page(page)

    if len(writer.pages) == 0:
        raise HTTPException(status_code=400, detail="No valid PDF pages found to merge.")

    buf = BytesIO()
    writer.write(buf)
    buf.seek(0)
    return buf.read()
