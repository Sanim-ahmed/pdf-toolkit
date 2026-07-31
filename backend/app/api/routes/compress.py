import logging
import os
import shutil
import subprocess
import tempfile
import time
from functools import lru_cache

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import Response

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/compress", tags=["Compress"])

_GS_CANDIDATES = [
    "gs",
    "gswin64c.exe",
    "gswin32c.exe",
    "/usr/bin/gs",
]

_PRESETS: dict[str, dict[str, str | int]] = {
    "high": {
        "pdfsettings": "/screen",
        "downsample_resolution": 72,
        "jpeg_quality": 50,
    },
    "medium": {
        "pdfsettings": "/ebook",
        "downsample_resolution": 150,
        "jpeg_quality": 75,
    },
    "low": {
        "pdfsettings": "/printer",
        "downsample_resolution": 300,
        "jpeg_quality": 90,
    },
}

_MAX_SIZE = 50 * 1024 * 1024


@lru_cache(maxsize=1)
def _find_gs() -> str:
    for candidate in _GS_CANDIDATES:
        found = shutil.which(candidate)
        if found:
            return found
    raise RuntimeError(
        "Ghostscript (gs) not found. Install ghostscript on the server."
    )


@lru_cache(maxsize=1)
def _gs_version(gs_path: str) -> str:
    try:
        result = subprocess.run(
            [gs_path, "--version"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return (result.stdout or "unknown").strip()
    except Exception:
        return "unknown"


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
async def compress(
    file: UploadFile = File(...),
    preset: str = Form("medium"),
    background_tasks: BackgroundTasks = BackgroundTasks(),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=400,
            detail=f"File '{file.filename}' is not a valid PDF (got {file.content_type}).",
        )

    content = await file.read()

    if len(content) > _MAX_SIZE:
        raise HTTPException(status_code=400, detail="File exceeds 50 MB limit.")

    if preset not in _PRESETS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid preset '{preset}'. Choose from: {', '.join(_PRESETS)}.",
        )

    gs_path = _find_gs()
    gs_ver = _gs_version(gs_path)
    cfg = _PRESETS[preset]
    res = cfg["downsample_resolution"]
    jpeg_q = cfg["jpeg_quality"]

    logger.debug("Ghostscript executable: %s", gs_path)
    logger.debug("Ghostscript version: %s", gs_ver)
    logger.debug("Compression preset: %s (settings=%s, res=%d, jpeg_q=%d)", preset, cfg["pdfsettings"], res, jpeg_q)
    logger.debug("Original size: %d bytes (%.2f KB)", len(content), len(content) / 1024)

    tmp_input: str | None = None
    tmp_output: str | None = None
    tmpdir: str | None = None

    try:
        tmpdir = tempfile.mkdtemp(prefix="compress_")
        tmp_input = os.path.join(tmpdir, "input.pdf")
        tmp_output = os.path.join(tmpdir, "output.pdf")

        with open(tmp_input, "wb") as f:
            f.write(content)

        cmd = [
            gs_path,
            "-sDEVICE=pdfwrite",
            f"-dPDFSETTINGS={cfg['pdfsettings']}",
            "-dNOPAUSE",
            "-dQUIET",
            "-dBATCH",
            "-dDetectDuplicateImages=true",
            "-dCompressPages=true",
            "-dDownsampleColorImages=true",
            "-dDownsampleGrayImages=true",
            "-dDownsampleMonoImages=true",
            f"-dColorImageResolution={res}",
            f"-dGrayImageResolution={res}",
            f"-dMonoImageResolution={res}",
            "-dColorImageDownsampleThreshold=1.0",
            "-dGrayImageDownsampleThreshold=1.0",
            "-dMonoImageDownsampleThreshold=1.0",
            "-dAutoFilterColorImages=false",
            "-dAutoFilterGrayImages=false",
            "-dColorImageFilter=/DCTEncode",
            "-dGrayImageFilter=/DCTEncode",
            "-dMonoImageFilter=/CCITTFaxEncode",
            f"-dJPEGQ={jpeg_q}",
            "-dEmbedAllFonts=true",
            "-dSubsetFonts=true",
            f"-sOutputFile={tmp_output}",
            tmp_input,
        ]

        logger.debug("Ghostscript command: %s", " ".join(cmd))

        start = time.perf_counter()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
        )
        elapsed = time.perf_counter() - start

        logger.debug("Ghostscript exit code: %d", result.returncode)
        logger.debug("Ghostscript stdout: %s", result.stdout.strip() if result.stdout else "(empty)")
        logger.debug("Ghostscript stderr: %s", result.stderr.strip() if result.stderr else "(empty)")
        logger.debug("Conversion time: %.2f seconds", elapsed)

        if result.returncode != 0:
            raise RuntimeError(
                f"Ghostscript exited with code {result.returncode}. "
                f"stderr: {result.stderr.strip()}"
            )

        if not os.path.isfile(tmp_output):
            raise RuntimeError("Ghostscript finished but output file was not found.")

        compressed_size = os.path.getsize(tmp_output)
        if compressed_size == 0:
            raise RuntimeError("Ghostscript produced an empty output file.")

        ratio = (1 - compressed_size / len(content)) * 100 if len(content) > 0 else 0

        if compressed_size < len(content):
            with open(tmp_output, "rb") as f:
                pdf_bytes = f.read()
            effective_size = compressed_size
            effective_ratio = ratio
            compression_applied = True
            logger.debug(
                "Compressed size: %d bytes (%.2f KB), reduction: %.1f%%",
                compressed_size, compressed_size / 1024, ratio,
            )
        else:
            pdf_bytes = content
            effective_size = len(content)
            effective_ratio = 0.0
            compression_applied = False
            logger.debug(
                "Compressed size (%d) >= original (%d) — returning original.",
                compressed_size, len(content),
            )

        output_filename = os.path.splitext(file.filename or "document")[0] + ".pdf"

        background_tasks.add_task(cleanup, [tmp_input, tmp_output, tmpdir])

        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f'attachment; filename="{output_filename}"',
                "X-Original-Size": str(len(content)),
                "X-Compressed-Size": str(effective_size),
                "X-Compression-Ratio": f"{effective_ratio:.1f}",
                "X-Compression-Time": f"{elapsed:.2f}",
                "X-Compression-Applied": str(compression_applied).lower(),
            },
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(
            status_code=500,
            detail="PDF compression timed out. The file may be too large or corrupted.",
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail=str(exc))
    except Exception as exc:
        logger.error("Unexpected compression error: %s", exc)
        raise HTTPException(status_code=500, detail=f"Compression failed: {exc}")
