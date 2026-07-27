import zipfile
from io import BytesIO

from fastapi import UploadFile


async def read_file_content(file: UploadFile) -> bytes:
    content = await file.read()
    await file.seek(0)
    return content


def parse_page_ranges(range_str: str, total_pages: int) -> list[int]:
    pages: set[int] = set()
    for part in range_str.split(","):
        part = part.strip()
        if "-" in part:
            start_str, end_str = part.split("-", 1)
            start = int(start_str.strip())
            end = int(end_str.strip())
            if start < 1 or end > total_pages or start > end:
                raise ValueError(
                    f"Invalid range '{part.strip()}'. "
                    f"Valid range: 1-{total_pages}"
                )
            pages.update(range(start, end + 1))
        else:
            page = int(part)
            if page < 1 or page > total_pages:
                raise ValueError(
                    f"Page {page} out of range. Valid range: 1-{total_pages}"
                )
            pages.add(page)
    return sorted(pages)


def create_zip(files: dict[str, bytes]) -> bytes:
    buf = BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in files.items():
            zf.writestr(name, data)
    return buf.getvalue()


def validate_pdf_content_type(file: UploadFile) -> None:
    if file.content_type not in ("application/pdf", "application/x-pdf"):
        raise ValueError(f"File '{file.name}' is not a PDF.")


def validate_image_content_type(file: UploadFile) -> None:
    allowed = (
        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp",
        "image/tiff",
        "image/bmp",
    )
    if file.content_type not in allowed:
        raise ValueError(f"File '{file.name}' is not a supported image type.")
