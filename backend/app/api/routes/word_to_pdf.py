import logging
import os

from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import Response

from app.services.docx_to_pdf import convert

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/from-word", tags=["Word to PDF"])

DOCX_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream",
}


@router.post("")
async def word_to_pdf(file: UploadFile = File(...)):
    if file.content_type not in DOCX_MIME_TYPES and not (file.filename or "").lower().endswith(".docx"):
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid DOCX file (got {file.content_type}).",
        )

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    try:
        pdf_bytes = convert(content)
    except Exception as exc:
        logger.error("Word to PDF conversion failed: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Failed to convert Word to PDF: {exc}"
        )

    output_filename = os.path.splitext(file.filename or "document")[0] + ".pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{output_filename}"'},
    )
