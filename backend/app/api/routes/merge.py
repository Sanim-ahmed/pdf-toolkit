from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse

from app.services.pdf_service import merge_pdfs

router = APIRouter(prefix="/merge", tags=["Merge"])


@router.post("")
async def merge(files: list[UploadFile] = File(...)):
    """Merge multiple uploaded PDF files into a single downloadable PDF."""
    if len(files) < 2:
        raise HTTPException(status_code=400, detail="At least two PDF files are required.")

    try:
        merged = await merge_pdfs(files)
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to merge PDFs: {exc}")

    return StreamingResponse(
        iter([merged]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="merged.pdf"'},
    )
