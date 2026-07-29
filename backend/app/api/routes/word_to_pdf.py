import logging
import os
import shutil
import subprocess
import tempfile

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/from-word", tags=["Word to PDF"])

DOCX_MIME_TYPES = {
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/octet-stream",
}


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
async def word_to_pdf(file: UploadFile = File(...), background_tasks: BackgroundTasks = BackgroundTasks()):
    if file.content_type not in DOCX_MIME_TYPES and not (file.filename or "").lower().endswith(".docx"):
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid DOCX file (got {file.content_type}).",
        )

    content = await file.read()

    tmp_dir = None
    try:
        tmp_dir = tempfile.mkdtemp()

        docx_path = os.path.join(tmp_dir, file.filename or "document.docx")
        with open(docx_path, "wb") as f:
            f.write(content)

        result = subprocess.run(
            ["soffice", "--headless", "--convert-to", "pdf", "--outdir", tmp_dir, docx_path],
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode != 0:
            logger.error("LibreOffice conversion failed: stderr=%s stdout=%s", result.stderr.strip(), result.stdout.strip())
            raise RuntimeError(f"LibreOffice conversion failed: {result.stderr.strip()}")

        pdf_filename = os.path.splitext(file.filename or "document")[0] + ".pdf"
        pdf_path = os.path.join(tmp_dir, pdf_filename)

        if not os.path.exists(pdf_path):
            pdf_files = [f for f in os.listdir(tmp_dir) if f.lower().endswith(".pdf")]
            if not pdf_files:
                logger.error("LibreOffice did not produce a PDF output in %s", tmp_dir)
                raise RuntimeError("LibreOffice did not produce a PDF output.")
            pdf_path = os.path.join(tmp_dir, pdf_files[0])
            pdf_filename = pdf_files[0]

        background_tasks.add_task(cleanup, [tmp_dir])

        return FileResponse(
            path=pdf_path,
            media_type="application/pdf",
            filename=pdf_filename,
        )
    except HTTPException:
        cleanup([tmp_dir])
        raise
    except subprocess.TimeoutExpired:
        logger.error("LibreOffice conversion timed out after 60 seconds")
        cleanup([tmp_dir])
        raise HTTPException(status_code=500, detail="Conversion timed out after 60 seconds.")
    except Exception as exc:
        logger.error("Word to PDF conversion failed: %s", exc)
        cleanup([tmp_dir])
        raise HTTPException(
            status_code=500, detail=f"Failed to convert Word to PDF: {exc}"
        )
