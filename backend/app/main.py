from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.pdf import router as pdf_router

app = FastAPI(title="PDF Toolkit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pdf_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {"status": "ok"}
