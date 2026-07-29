import os
import tempfile

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

router = APIRouter(prefix="/to-word", tags=["PDF to Word"])


def cleanup(paths: list[str]) -> None:
    for p in paths:
        try:
            if p and os.path.exists(p):
                os.unlink(p)
        except OSError:
            pass


@router.post("")
async def pdf_to_word(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF (got {file.content_type}).",
        )

    content = await file.read()

    tmp_pdf = None
    tmp_docx = None
    try:
        tmp_pdf = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
        tmp_pdf.write(content)
        tmp_pdf.close()

        tmp_docx = tempfile.NamedTemporaryFile(delete=False, suffix=".docx")
        tmp_docx.close()

        from pdf2docx import Converter

        cv = Converter(tmp_pdf.name)
        cv.convert(tmp_docx.name, start=0, end=None)
        cv.close()

        output_filename = os.path.splitext(file.filename or "document")[0] + ".docx"

        background_tasks.add_task(cleanup, [tmp_pdf.name, tmp_docx.name])

        return FileResponse(
            path=tmp_docx.name,
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            filename=output_filename,
        )
    except HTTPException:
        cleanup([tmp_pdf.name if tmp_pdf else None, tmp_docx.name if tmp_docx else None])
        raise
    except Exception as exc:
        cleanup([tmp_pdf.name if tmp_pdf else None, tmp_docx.name if tmp_docx else None])
        raise HTTPException(
            status_code=500, detail=f"Failed to convert PDF to Word: {exc}"
        )
