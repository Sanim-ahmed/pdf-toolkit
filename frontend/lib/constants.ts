export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://pdf-toolkit-backend-docker.onrender.com";

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function friendlyError(detail: string): string {
  const lower = detail.toLowerCase();
  if (lower.includes("unsupported file") || lower.includes("not a valid pdf"))
    return "Unsupported file format. Please upload a supported file type.";
  if (lower.includes("exceeds") && lower.includes("limit"))
    return "File size exceeds the maximum upload limit.";
  if (lower.includes("password") || lower.includes("encrypt"))
    return "This file is password protected. Please provide an unprotected file.";
  if (lower.includes("no pages") || lower.includes("empty"))
    return "The file appears to be empty or has no pages.";
  if (lower.includes("corrupt") || lower.includes("invalid") || lower.includes("could not process"))
    return "The file appears to be corrupted. Please try a different file.";
  if (lower.includes("tesseract") || lower.includes("not found") || lower.includes("not installed"))
    return "OCR engine is not available. Please contact support.";
  if (lower.includes("network") || lower.includes("timeout") || lower.includes("fetch"))
    return "Network error. Please check your connection and try again.";
  return "Conversion failed. Please try again.";
}
