from io import BytesIO
import re

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from pypdf import PdfReader, PdfWriter

router = APIRouter(prefix="/split", tags=["Split"])


def parse_page_range(range_str: str, total_pages: int) -> list[int]:
    parts = [p.strip() for p in range_str.split(",") if p.strip()]
    if not parts:
        raise HTTPException(status_code=400, detail="Page range is empty.")

    pages: set[int] = set()
    pattern = re.compile(r"^(\d+)(?:-(\d+))?$")

    for part in parts:
        m = pattern.match(part)
        if not m:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid page range segment: '{part}'.",
            )
        start = int(m.group(1))
        end = int(m.group(2)) if m.group(2) else start

        if start < 1 or end < 1 or start > total_pages or end > total_pages:
            raise HTTPException(
                status_code=400,
                detail=f"Page number out of range. PDF has {total_pages} page(s).",
            )

        if start > end:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid range '{part}': start page is after end page.",
            )

        for p in range(start, end + 1):
            pages.add(p)

    return sorted(pages)


@router.post("")
async def split(file: UploadFile = File(...), page_range: str = Form(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF.",
        )

    content = await file.read()
    try:
        reader = PdfReader(BytesIO(content))
    except Exception:
        raise HTTPException(status_code=400, detail="File could not be parsed as a PDF.")

    total = len(reader.pages)
    if total == 0:
        raise HTTPException(status_code=400, detail="PDF has no pages.")

    page_numbers = parse_page_range(page_range, total)
    writer = PdfWriter()
    for p in page_numbers:
        writer.add_page(reader.pages[p - 1])

    buf = BytesIO()
    writer.write(buf)
    buf.seek(0)

    return StreamingResponse(
        iter([buf.read()]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="split.pdf"'},
    )
