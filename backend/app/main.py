from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.merge import router as merge_router
from app.api.routes.split import router as split_router
from app.api.routes.pdf_to_word import router as pdf_to_word_router
from app.api.routes.word_to_pdf import router as word_to_pdf_router
from app.api.routes.compress import router as compress_router
from app.api.routes.pdf_to_text import router as pdf_to_text_router
from app.api.routes.text_to_pdf import router as text_to_pdf_router

app = FastAPI(title="PDF Toolkit API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://pdf-toolkit-zeta-nine.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(merge_router, prefix="/api/pdf")
app.include_router(split_router, prefix="/api/pdf")
app.include_router(pdf_to_word_router, prefix="/api/pdf")
app.include_router(word_to_pdf_router, prefix="/api/pdf")
app.include_router(compress_router, prefix="/api/pdf")
app.include_router(pdf_to_text_router, prefix="/api/pdf")
app.include_router(text_to_pdf_router, prefix="/api/pdf")


@app.get("/")
async def health_check():
    return {"status": "ok"}
