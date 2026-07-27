# PDF Toolkit API

A FastAPI backend for common PDF operations — merge, split, compress, rotate, extract pages, convert to/from images.

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

- API base: `http://localhost:8000/api/pdf/`
- Interactive docs: `http://localhost:8000/docs`
- Health check: `GET http://localhost:8000/health`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/pdf/merge` | Merge multiple PDFs into one |
| `POST` | `/api/pdf/split` | Split a PDF by page ranges |
| `POST` | `/api/pdf/compress` | Compress a PDF |
| `POST` | `/api/pdf/rotate` | Rotate all pages by 90/180/270 degrees |
| `POST` | `/api/pdf/extract` | Extract specific pages from a PDF |
| `POST` | `/api/pdf/to-image` | Convert PDF pages to PNG or JPG images |
| `POST` | `/api/pdf/image-to-pdf` | Combine images into a single PDF |

### Merge PDFs

```bash
curl -X POST http://localhost:8000/api/pdf/merge \
  -F "files=@file1.pdf" \
  -F "files=@file2.pdf" \
  -o merged.pdf
```

### Split PDF

```bash
curl -X POST http://localhost:8000/api/pdf/split \
  -F "file=@document.pdf" \
  -F "pages=1-3,5,7-10" \
  -o split_pages.zip
```

### Compress PDF

```bash
curl -X POST http://localhost:8000/api/pdf/compress \
  -F "file=@large.pdf" \
  -o compressed.pdf
```

### Rotate PDF

```bash
curl -X POST http://localhost:8000/api/pdf/rotate \
  -F "file=@document.pdf" \
  -F "angle=90" \
  -o rotated.pdf
```

### Extract Pages

```bash
curl -X POST http://localhost:8000/api/pdf/extract \
  -F "file=@document.pdf" \
  -F "pages=1,3,5-7" \
  -o extracted.pdf
```

### PDF to Image

```bash
curl -X POST http://localhost:8000/api/pdf/to-image \
  -F "file=@document.pdf" \
  -F "fmt=png" \
  -F "dpi=150" \
  -o images.zip
```

### Image to PDF

```bash
curl -X POST http://localhost:8000/api/pdf/image-to-pdf \
  -F "files=@photo1.png" \
  -F "files=@photo2.jpg" \
  -o images.pdf
```

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app, CORS, health check
│   ├── routes/
│   │   └── pdf.py           # API endpoint definitions
│   ├── services/
│   │   └── pdf.py           # PDF processing logic (pypdf, PyMuPDF, Pillow)
│   └── utilities/
│       └── helpers.py        # File validation, page parsing, ZIP creation
└── requirements.txt
```

## Stack

- **FastAPI** — web framework
- **pypdf** — PDF reading, writing, merging, rotation, page extraction
- **PyMuPDF (fitz)** — PDF-to-image rendering, compression
- **Pillow** — image processing, image-to-PDF conversion
