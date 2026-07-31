import logging
import os
import shutil
import subprocess
import tempfile
import time
from functools import lru_cache

logger = logging.getLogger(__name__)

_LOCATE_CANDIDATES = [
    "soffice",
    "/usr/bin/soffice",
    "/usr/lib/libreoffice/program/soffice",
    "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
    "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe",
]


@lru_cache(maxsize=1)
def _find_soffice() -> str:
    for candidate in _LOCATE_CANDIDATES:
        found = shutil.which(candidate)
        if found:
            return found
    raise RuntimeError(
        "LibreOffice (soffice) not found. "
        "Install LibreOffice or verify it is on the system PATH."
    )


@lru_cache(maxsize=1)
def _get_soffice_version(soffice_path: str) -> str:
    try:
        result = subprocess.run(
            [soffice_path, "--version"],
            capture_output=True,
            text=True,
            timeout=15,
        )
        return (result.stdout or result.stderr or "unknown").strip()
    except Exception as exc:
        logger.warning("Failed to read LibreOffice version: %s", exc)
        return "unknown"


def convert(docx_bytes: bytes) -> bytes:
    soffice_path = _find_soffice()
    lo_version = _get_soffice_version(soffice_path)

    logger.debug("LibreOffice executable: %s", soffice_path)
    logger.debug("LibreOffice version: %s", lo_version)

    tmp_dir: str | None = None
    try:
        tmp_dir = tempfile.mkdtemp(prefix="docx2pdf_")

        docx_path = os.path.join(tmp_dir, "input.docx")
        with open(docx_path, "wb") as f:
            f.write(docx_bytes)

        pdf_path = os.path.join(tmp_dir, "input.pdf")
        outdir = tmp_dir

        cmd = [
            soffice_path,
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            outdir,
            docx_path,
        ]

        logger.debug("Conversion command: %s", " ".join(cmd))

        env = os.environ.copy()
        env["HOME"] = tmp_dir
        env["TMPDIR"] = tmp_dir

        start = time.perf_counter()
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=60,
            env=env,
        )
        elapsed = time.perf_counter() - start

        logger.debug("LibreOffice exit code: %d", result.returncode)
        logger.debug("LibreOffice stdout: %s", result.stdout.strip() if result.stdout else "(empty)")
        logger.debug("LibreOffice stderr: %s", result.stderr.strip() if result.stderr else "(empty)")
        logger.debug("Conversion time: %.2f seconds", elapsed)

        if result.returncode != 0:
            raise RuntimeError(
                f"LibreOffice exited with code {result.returncode}. "
                f"stdout: {result.stdout.strip()}; "
                f"stderr: {result.stderr.strip()}"
            )

        if not os.path.isfile(pdf_path):
            raise RuntimeError(
                f"LibreOffice finished successfully but output PDF was not found at {pdf_path}. "
                f"stdout: {result.stdout.strip()}; "
                f"stderr: {result.stderr.strip()}"
            )

        with open(pdf_path, "rb") as f:
            pdf_bytes = f.read()

        if not pdf_bytes:
            raise RuntimeError("Output PDF is empty (0 bytes).")

        logger.debug(
            "Generated PDF size: %s bytes (%.2f KB)",
            len(pdf_bytes),
            len(pdf_bytes) / 1024,
        )

        return pdf_bytes

    except subprocess.TimeoutExpired:
        logger.error("LibreOffice conversion timed out after 60 seconds")
        raise RuntimeError(
            "LibreOffice conversion timed out after 60 seconds. "
            "The document may be too large or corrupted."
        )
    except FileNotFoundError:
        raise RuntimeError(
            f"LibreOffice executable not found at '{soffice_path}'. "
            "It may have been removed or the installation is incomplete."
        )
    except RuntimeError:
        raise
    except Exception as exc:
        logger.error("Unexpected error during DOCX to PDF conversion: %s", exc)
        raise RuntimeError(f"Unexpected conversion error: {exc}")
    finally:
        if tmp_dir and os.path.isdir(tmp_dir):
            try:
                shutil.rmtree(tmp_dir, ignore_errors=True)
            except Exception as exc:
                logger.warning("Failed to clean up temporary directory %s: %s", tmp_dir, exc)
