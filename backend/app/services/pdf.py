from io import BytesIO

import fitz
from PIL import Image
from pypdf import PdfReader, PdfWriter


async def merge_pdfs(files: list[bytes]) -> bytes:
    writer = PdfWriter()
    for file_bytes in files:
        reader = PdfReader(BytesIO(file_bytes))
        for page in reader.pages:
            writer.add_page(page)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


async def split_pdf(file_bytes: bytes, pages: list[int]) -> dict[str, bytes]:
    reader = PdfReader(BytesIO(file_bytes))
    total = len(reader.pages)
    result: dict[str, bytes] = {}
    for page_num in pages:
        writer = PdfWriter()
        writer.add_page(reader.pages[page_num - 1])
        buf = BytesIO()
        writer.write(buf)
        result[f"page_{page_num}.pdf"] = buf.getvalue()
    return result


async def compress_pdf(file_bytes: bytes) -> bytes:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    for page in doc:
        pix = page.get_pixmap(dpi=150)
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
        buf = BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        buf.seek(0)
        img_rect = page.rect
        page.insert_image(img_rect, stream=buf.read())
    output = BytesIO()
    doc.save(output, garbage=4, deflate=True)
    doc.close()
    return output.getvalue()


async def rotate_pdf(file_bytes: bytes, angle: int) -> bytes:
    reader = PdfReader(BytesIO(file_bytes))
    writer = PdfWriter()
    for page in reader.pages:
        page.rotate(angle)
        writer.add_page(page)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


async def extract_pages(file_bytes: bytes, pages: list[int]) -> bytes:
    reader = PdfReader(BytesIO(file_bytes))
    writer = PdfWriter()
    for page_num in pages:
        writer.add_page(reader.pages[page_num - 1])
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


async def pdf_to_images(
    file_bytes: bytes, fmt: str = "png", dpi: int = 150
) -> dict[str, bytes]:
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    images: dict[str, bytes] = {}
    for i, page in enumerate(doc):
        pix = page.get_pixmap(dpi=dpi)
        if fmt == "jpg":
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            buf = BytesIO()
            img.save(buf, format="JPEG", quality=90)
            images[f"page_{i + 1}.jpg"] = buf.getvalue()
        else:
            images[f"page_{i + 1}.png"] = pix.tobytes("png")
    doc.close()
    return images


async def images_to_pdf(files: list[tuple[str, bytes]]) -> bytes:
    images: list[Image.Image] = []
    for name, data in files:
        img = Image.open(BytesIO(data))
        if img.mode == "RGBA":
            img = img.convert("RGB")
        images.append(img)

    if not images:
        raise ValueError("No valid images provided.")

    first = images[0]
    rest = images[1:]
    buf = BytesIO()
    first.save(buf, format="PDF", save_all=True, append_images=rest)
    return buf.getvalue()
