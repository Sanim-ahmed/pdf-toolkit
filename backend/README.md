# PDF Toolkit API

A FastAPI backend for common PDF operations.

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
- Health check: `GET http://localhost:8000/`

## Project Structure

```
backend/
├── app/
│   ├── api/
│   │   └── routes/
│   │       └── merge.py       # PDF merge endpoint (stub)
│   ├── services/              # Business logic layer
│   ├── utils/                 # Shared utilities
│   ├── schemas/               # Pydantic models
│   └── main.py                # FastAPI app, CORS, health check
├── requirements.txt
└── .gitignore
```

## Stack

- **FastAPI** — web framework
- **pypdf** — PDF processing
- **python-multipart** — file upload support
- **Uvicorn** — ASGI server
