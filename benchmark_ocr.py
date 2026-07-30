#!/usr/bin/env python3
"""
OCR performance benchmark for Tesseract configurations.
Tests various OEM/PSM modes, DPI settings, and preprocessing strategies.
"""
import os
import sys
import time
import statistics
import tempfile
import io
from functools import partial
from pathlib import Path

os.environ["LD_LIBRARY_PATH"] = "/tmp/tesseract-local/usr/lib/x86_64-linux-gnu"
os.environ["PATH"] = "/tmp/tesseract-local/usr/bin:" + os.environ.get("PATH", "")
os.environ["TESSDATA_PREFIX"] = "/tmp/tesseract-local/usr/share/tesseract-ocr/5/tessdata"

import pytesseract
pytesseract.pytesseract.tesseract_cmd = "/tmp/tesseract-local/usr/bin/tesseract"

from PIL import Image, ImageOps, ImageFilter, ImageDraw, ImageFont
from pdf2image import convert_from_bytes

# Configuration
DPI_BENCHMARKS = [200, 150, 125, 100, 75]
OEM_MODES = [0, 1, 2, 3]  # 0=legacy+LSTM, 1=LSTM-only, 2=legacy-only, 3=default
PSM_MODES = [3, 4, 6, 12]  # 3=auto, 4=single column, 6=uniform block, 12=sparse
PREPROCESS_MODES = ["grayscale", "binary", "grayscale_resize"]

_OUTPUT_DIR = Path("/tmp/ocr_benchmark_results")
_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

GROUND_TRUTH = """
This is a sample document for testing optical character recognition performance.
The quick brown fox jumps over the lazy dog near the riverbank.
Machine learning and artificial intelligence are transforming modern technology.
PDF toolkit provides powerful document processing capabilities including merge,
split, compress, and optical character recognition services.
Tesseract OCR engine is an open source text recognition system originally
developed by HP and now maintained by Google. It supports many languages.
The accuracy of OCR depends on image quality, resolution, and preprocessing.
"""


def generate_test_image(text, width=1650, height=2550, font_size=18, noise=False):
    """Generate a test PIL image with rendered text, simulating a clean scanned page."""
    img = Image.new("RGB", (width, height), "white")
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
    except (IOError, OSError):
        font = ImageFont.load_default()

    y = 80
    for line in text.strip().split("\n"):
        for attempt in [font_size, font_size - 2, font_size - 4]:
            try:
                f = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", attempt)
                bbox = draw.textbbox((60, y), line, font=f)
                if y + attempt + 10 < height - 60:
                    draw.text((60, y), line, fill="black", font=f)
                    y += attempt + 10
                    break
            except (IOError, OSError):
                pass

    if noise:
        import random
        random.seed(42)
        pixels = img.load()
        for _ in range(int(width * height * 0.01)):
            x = random.randint(0, width - 1)
            y = random.randint(0, height - 1)
            v = random.randint(0, 60)
            pixels[x, y] = (v, v, v)
    return img


def generate_test_pdf(text, num_pages=5):
    """Generate a multi-page PDF bytes from rendered text images."""
    images = []
    for i in range(num_pages):
        page_text = f"Page {i + 1}\n\n" + "\n".join(
            f"{j}. {line}" for j, line in enumerate(text.strip().split("\n"))
        )
        img = generate_test_image(page_text, font_size=20,
                                  width=1650, height=2550)
        images.append(img)

    pdf_bytes = _images_to_pdf(images)
    return pdf_bytes


def _images_to_pdf(images):
    """Convert PIL images to PDF bytes."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    from PIL import Image as PILImage

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    for i, img in enumerate(images):
        tmp_path = f"/tmp/ocr_benchmark_page_{i}.png"
        img.save(tmp_path, format="PNG")
        c.drawImage(tmp_path, 0, 0, width=letter[0], height=letter[1])
        c.showPage()
        os.unlink(tmp_path)
    c.save()
    buf.seek(0)
    return buf.read()


def preprocess(img, mode="grayscale", target_dpi=None):
    """Apply preprocessing and return PIL Image ready for OCR."""
    if target_dpi and target_dpi != 200:
        scale = target_dpi / 200.0
        new_w = max(1, int(img.width * scale))
        new_h = max(1, int(img.height * scale))
        img = img.resize((new_w, new_h), Image.LANCZOS)

    if mode == "grayscale":
        return ImageOps.grayscale(img)
    elif mode == "binary":
        gray = ImageOps.grayscale(img)
        return gray.point(lambda x: 0 if x < 128 else 255, "1")
    elif mode == "grayscale_resize":
        scale = 0.5
        new_w = max(1, int(img.width * scale))
        new_h = max(1, int(img.height * scale))
        img = img.resize((new_w, new_h), Image.LANCZOS)
        return ImageOps.grayscale(img)
    else:
        return ImageOps.grayscale(img)


def ocr_single(img, config):
    """Run OCR on a single image with given config."""
    return pytesseract.image_to_string(img, lang="eng", config=config)


def benchmark_config(label, config_str, images, preprocessing="grayscale", dpi=200):
    """Benchmark a single configuration across multiple images."""
    times = []
    texts = []
    errors = []

    for img in images:
        processed = preprocess(img, mode=preprocessing, target_dpi=dpi)
        t0 = time.perf_counter()
        try:
            text = ocr_single(processed, config_str)
        except pytesseract.TesseractError as e:
            return {
                "label": label,
                "config": config_str,
                "mean_time": 0,
                "total_time": 0,
                "chars": 0,
                "accuracy": 0,
                "times": [],
                "error": str(e),
            }
        elapsed = time.perf_counter() - t0
        times.append(elapsed)
        texts.append(text)

    mean_time = statistics.mean(times)
    total_time = sum(times)
    chars_extracted = sum(len(t) for t in texts)

    # Accuracy: simple character overlap with ground truth
    gt_clean = "".join(GROUND_TRUTH.lower().split())
    all_text = "".join("".join(texts).lower().split())
    # Character-level accuracy using common chars
    common = sum(1 for c in gt_clean if c in all_text)
    accuracy = common / len(gt_clean) if gt_clean else 0

    return {
        "label": label,
        "config": config_str,
        "mean_time": mean_time,
        "total_time": total_time,
        "chars": chars_extracted,
        "accuracy": accuracy,
        "times": times,
        "error": None,
    }


def main():
    print("=" * 80)
    print("TESSERACT OCR BENCHMARK")
    print("=" * 80)
    print(f"Tesseract: {pytesseract.get_tesseract_version()}")
    print()

    # Generate test data
    print("Generating test data...")
    test_pdf_bytes = generate_test_pdf(GROUND_TRUTH, num_pages=5)
    pdf_images = convert_from_bytes(test_pdf_bytes, dpi=200)
    print(f"  Generated {len(pdf_images)} pages from test PDF at 200 DPI")
    print()

    results = []

    # =============================================
    # 1. Baseline (current config)
    # =============================================
    print("=" * 60)
    print("1. BASELINE: --oem 1 --psm 3 (current)")
    print("=" * 60)
    r = benchmark_config("baseline", "--oem 1 --psm 3", pdf_images,
                         preprocessing="grayscale", dpi=200)
    results.append(r)
    print(f"  Total: {r['total_time']:.2f}s, Mean/page: {r['mean_time']:.3f}s, "
          f"Accuracy: {r['accuracy']:.2%}, Chars: {r['chars']}")
    print()

    # =============================================
    # 2. OEM Mode comparison
    # =============================================
    print("=" * 60)
    print("2. OEM MODE COMPARISON (with --psm 3)")
    print("=" * 60)
    for oem in OEM_MODES:
        if oem == 1:
            continue  # Already baseline
        label = f"oem{oem}"
        config = f"--oem {oem} --psm 3"
        r = benchmark_config(label, config, pdf_images,
                             preprocessing="grayscale", dpi=200)
        results.append(r)
        if r["error"]:
            print(f"  OEM={oem}: ERROR - {r['error']}")
        else:
            print(f"  OEM={oem}: Total: {r['total_time']:.2f}s, "
                  f"Mean/page: {r['mean_time']:.3f}s, "
                  f"Accuracy: {r['accuracy']:.2%}")
    print()

    # =============================================
    # 3. PSM Mode comparison
    # =============================================
    print("=" * 60)
    print("3. PSM MODE COMPARISON (with --oem 1)")
    print("=" * 60)
    for psm in PSM_MODES:
        if psm == 3:
            continue
        label = f"psm{psm}"
        config = f"--oem 1 --psm {psm}"
        r = benchmark_config(label, config, pdf_images,
                             preprocessing="grayscale", dpi=200)
        results.append(r)
        if r["error"]:
            print(f"  PSM={psm}: ERROR - {r['error']}")
        else:
            print(f"  PSM={psm}: Total: {r['total_time']:.2f}s, "
                  f"Mean/page: {r['mean_time']:.3f}s, "
              f"Accuracy: {r['accuracy']:.2%}")
    print()

    # =============================================
    # 4. DPI comparison
    # =============================================
    print("=" * 60)
    print("4. DPI COMPARISON (--oem 1 --psm 3)")
    print("=" * 60)
    for dpi in DPI_BENCHMARKS:
        label = f"{dpi}dpi"
        r = benchmark_config(label, "--oem 1 --psm 3", pdf_images,
                             preprocessing="grayscale", dpi=dpi)
        results.append(r)
        if r["error"]:
            print(f"  DPI={dpi}: ERROR - {r['error']}")
        else:
            print(f"  DPI={dpi}: Total: {r['total_time']:.2f}s, "
                  f"Mean/page: {r['mean_time']:.3f}s, "
                  f"Accuracy: {r['accuracy']:.2%}")
    print()

    # =============================================
    # 5. Preprocessing comparison
    # =============================================
    print("=" * 60)
    print("5. PREPROCESSING COMPARISON (--oem 1 --psm 3, DPI=200)")
    print("=" * 60)
    for prep in PREPROCESS_MODES:
        label = f"prep={prep}"
        r = benchmark_config(label, "--oem 1 --psm 3", pdf_images,
                             preprocessing=prep, dpi=200)
        results.append(r)
        if r["error"]:
            print(f"  {prep}: ERROR - {r['error']}")
        else:
            print(f"  {prep}: Total: {r['total_time']:.2f}s, "
                  f"Mean/page: {r['mean_time']:.3f}s, "
                  f"Accuracy: {r['accuracy']:.2%}")
    print()

    # =============================================
    # 6. Combined best candidates
    # =============================================
    print("=" * 60)
    print("6. BEST CANDIDATE COMBINATIONS")
    print("=" * 60)
    candidates = [
        ("--oem 1 --psm 6 + grayscale @ 150dpi", "--oem 1 --psm 6", "grayscale", 150),
        ("--oem 1 --psm 6 + grayscale @ 125dpi", "--oem 1 --psm 6", "grayscale", 125),
        ("--oem 1 --psm 6 + grayscale @ 100dpi", "--oem 1 --psm 6", "grayscale", 100),
        ("--oem 3 --psm 3 + grayscale @ 200dpi", "--oem 3 --psm 3", "grayscale", 200),
        ("--oem 1 --psm 6 + binary @ 200dpi", "--oem 1 --psm 6", "binary", 200),
        ("--oem 1 --psm 12 + grayscale @ 150dpi", "--oem 1 --psm 12", "grayscale", 150),
    ]
    for name, config_str, prep, d in candidates:
        r = benchmark_config(name, config_str, pdf_images,
                             preprocessing=prep, dpi=d)
        results.append(r)
        if r["error"]:
            print(f"  {name}: ERROR - {r['error']}")
        else:
            print(f"  {name}: Total: {r['total_time']:.2f}s, "
                  f"Mean/page: {r['mean_time']:.3f}s, "
                  f"Accuracy: {r['accuracy']:.2%}")
    print()

    # =============================================
    # RESULTS SUMMARY
    # =============================================
    print("=" * 80)
    print("RESULTS SUMMARY (sorted by total_time)")
    print("=" * 80)
    print(f"{'Rank':<5} {'Config':<45} {'Total':>8} {'Mean':>8} {'Acc':>7} {'ChEPs':>8}")
    print("-" * 81)
    valid_results = [r for r in results if not r["error"]]
    sorted_results = sorted(valid_results, key=lambda x: x["total_time"])
    rank = 1
    for r in sorted_results:
        chars_per_sec = r["chars"] / r["total_time"] if r["total_time"] > 0 else 0
        print(f"{rank:<5} {r['label']:<45} {r['total_time']:>8.2f}s "
              f"{r['mean_time']:>8.3f}s "
              f"{r['accuracy']:>6.1%} "
              f"{chars_per_sec:>8.0f}")
        rank += 1

    baseline = None
    for r in sorted_results:
        if r["label"] == "baseline":
            baseline = r
            break
    if baseline is None and sorted_results:
        baseline = sorted_results[0]

    print()
    print("=" * 80)
    print("RECOMMENDED CONFIGURATION")
    print("=" * 80)
    # Find best candidate that preserves accuracy within 5% of baseline
    best = None
    for r in sorted_results:
        if r["accuracy"] >= baseline["accuracy"] * 0.95 and r["total_time"] < baseline["total_time"]:
            if best is None or r["total_time"] < best["total_time"]:
                best = r
    if best:
        improvement = (baseline["total_time"] - best["total_time"]) / baseline["total_time"] * 100
        print(f"  Config: {best['config']}")
        print(f"  Label: {best['label']}")
        print(f"  Before: {baseline['total_time']:.2f}s (baseline)")
        print(f"  After:  {best['total_time']:.2f}s (optimized)")
        print(f"  Speedup: {improvement:.0f}%")
        print(f"  Accuracy: {best['accuracy']:.1%} (baseline: {baseline['accuracy']:.1%})")
    else:
        print("  No configuration found with >= 95% of baseline accuracy while being faster.")

    # Also show the fastest accurate option
    print()
    print("FASTEST OPTION (>90% baseline accuracy):")
    if baseline:
        for r in sorted_results:
            if r["accuracy"] >= baseline["accuracy"] * 0.90:
                improvement = (baseline["total_time"] - r["total_time"]) / baseline["total_time"] * 100
                print(f"  {r['label']:<50} {r['total_time']:>8.2f}s  acc={r['accuracy']:.1%}  "
                      f"speedup={improvement:+.0f}%")


if __name__ == "__main__":
    main()
