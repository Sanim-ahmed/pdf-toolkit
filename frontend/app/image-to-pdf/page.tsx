"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

const SUPPORTED_EXTS = ["png", "jpg", "jpeg", "webp", "bmp"];
const MAX_IMAGES = 30;

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: string;
  rawSize: number;
  preview: string;
}

interface Stats {
  imageCount: number;
  pageCount: number;
  originalSize: number;
  outputSize: number;
  time: number;
}

function isImage(file: File): boolean {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  return SUPPORTED_EXTS.includes(ext);
}

export default function ImageToPdfPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progressText, setProgressText] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      files.forEach((f) => URL.revokeObjectURL(f.preview));
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, [files]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const images = Array.from(newFiles).filter(isImage);
    if (images.length === 0) return;

    setFiles((prev) => {
      const remaining = MAX_IMAGES - prev.length;
      if (remaining <= 0) return prev;
      const toAdd = images.slice(0, remaining);
      const mapped = toAdd.map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        name: file.name,
        size: formatSize(file.size),
        rawSize: file.size,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...mapped];
    });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const item = prev.find((f) => f.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return prev.filter((f) => f.id !== id);
    });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

  const clearAll = useCallback(() => {
    files.forEach((f) => URL.revokeObjectURL(f.preview));
    setFiles([]);
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, [files]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  const handleDragStart = useCallback((idx: number) => {
    setDragIdx(idx);
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setOverIdx(idx);
  }, []);

  const handleDragLeaveItem = useCallback(() => {
    setOverIdx(null);
  }, []);

  const handleDropItem = useCallback(
    (e: React.DragEvent, dropIdx: number) => {
      e.preventDefault();
      setOverIdx(null);
      if (dragIdx === null || dragIdx === dropIdx) return;
      setFiles((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(dropIdx, 0, moved);
        return next;
      });
      setDragIdx(null);
    },
    [dragIdx]
  );

  const handleDragEnd = useCallback(() => {
    setDragIdx(null);
    setOverIdx(null);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!files.length || isConverting) return;
    setIsConverting(true);
    setError(null);
    setDownloadUrl(null);
    setStats(null);
    setSuccess(false);
    setProgressText("Uploading...");

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f.file));

    try {
      const xhr = new XMLHttpRequest();

      const result = await new Promise<{ blob: Blob; headers: Record<string, string> }>(
        (resolve, reject) => {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              setProgressText(e.loaded < e.total ? "Uploading..." : "Processing...");
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              const headers: Record<string, string> = {};
              const headerStr = xhr.getAllResponseHeaders();
              headerStr.split("\r\n").forEach((line) => {
                const idx = line.indexOf(": ");
                if (idx > 0) {
                  headers[line.slice(0, idx).toLowerCase()] = line.slice(idx + 2);
                }
              });
              resolve({ blob: xhr.response, headers });
            } else {
              try {
                const err = JSON.parse(xhr.responseText);
                reject(new Error(err.detail || "Conversion failed"));
              } catch {
                reject(new Error("Conversion failed"));
              }
            }
          };

          xhr.onerror = () => reject(new Error("Network error"));
          xhr.open("POST", `${API_BASE}/api/pdf/from-image`);
          xhr.responseType = "blob";
          xhr.send(formData);
        }
      );

      setProgressText("Preparing download...");

      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
      const url = URL.createObjectURL(result.blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);
      setSuccess(true);

      const origSize = files.reduce((sum, f) => sum + f.rawSize, 0);
      setStats({
        imageCount: parseInt(result.headers["x-image-count"] || String(files.length)),
        pageCount: parseInt(result.headers["x-page-count"] || String(files.length)),
        originalSize: parseInt(result.headers["x-original-size"] || String(origSize)),
        outputSize: parseInt(result.headers["x-output-size"] || String(result.blob.size)),
        time: parseFloat(result.headers["x-processing-time"] || "0"),
      });
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Failed to convert images"));
    } finally {
      setIsConverting(false);
      setProgressText("");
    }
  }, [files, isConverting]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = "images.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [downloadUrl]);

  const totalSize = files.reduce((s, f) => s + f.rawSize, 0);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-teal-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-500/20 bg-teal-500/10 px-4 py-1.5 text-sm font-medium text-teal-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Image to PDF
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Image to<br /><span className="gradient-text">PDF</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Convert multiple images into a single PDF document. Each image becomes one page.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-teal-500 bg-teal-500/[0.08] scale-[1.02] shadow-2xl shadow-teal-500/10" : "border-white/10 bg-white/[0.02] hover:border-teal-500/40 hover:bg-teal-500/[0.04]"}`}>
              <input ref={inputRef} type="file" accept=".png,.jpg,.jpeg,.webp,.bmp" multiple onChange={handleFileSelect} className="hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500/10">
                <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-teal-400" : "text-teal-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base font-medium text-white">{isDragging ? "Drop your images here" : "Drag & drop images here"}</p>
              <p className="mt-2 text-sm text-slate-500">or <span className="text-teal-400 underline underline-offset-2">browse files</span></p>
              <p className="mt-1 text-xs text-slate-600">PNG, JPG, JPEG, WEBP, BMP &mdash; up to {MAX_IMAGES} images, 100 MB total</p>
            </div>
            {files.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">{files.length} {files.length === 1 ? "image" : "images"} selected{files.length === MAX_IMAGES && <span className="ml-2 text-amber-400">(max reached)</span>}</p>
                  <button onClick={clearAll} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400">Clear all</button>
                </div>
                <ul className="space-y-2" role="list">
                  {files.map((f, i) => (
                    <li key={f.id} draggable onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOverItem(e, i)} onDragLeave={handleDragLeaveItem} onDrop={(e) => handleDropItem(e, i)} onDragEnd={handleDragEnd}
                      className={`glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 ${overIdx === i && dragIdx !== i ? "border-teal-500/40 shadow-lg shadow-teal-500/5" : "hover:border-teal-500/20"} ${dragIdx === i ? "opacity-40" : ""}`}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-teal-500/10">
                        <img src={f.preview} alt={f.name} className="h-full w-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{f.name}</p><p className="text-xs text-slate-500">{f.size}</p></div>
                      <span className="text-xs font-medium text-slate-600">{i + 1}</span>
                      <button onClick={() => removeFile(f.id)} className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${f.name}`}>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
                {error && <ErrorMessage error={error} />}
                {success && <SuccessMessage />}
                {stats && (
                  <div className="mt-5 rounded-xl border border-teal-500/20 bg-teal-500/[0.04] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Images</p><p className="text-sm font-medium text-white">{stats.imageCount}</p></div>
                      <div><p className="text-xs text-slate-500">Pages</p><p className="text-sm font-medium text-white">{stats.pageCount}</p></div>
                      <div><p className="text-xs text-slate-500">Original Size</p><p className="text-sm font-medium text-white">{formatSize(stats.originalSize)}</p></div>
                      <div><p className="text-xs text-slate-500">Output PDF</p><p className="text-sm font-medium text-white">{formatSize(stats.outputSize)}</p></div>
                      <div><p className="text-xs text-slate-500">Processing Time</p><p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p></div>
                    </div>
                  </div>
                )}
                {downloadUrl ? (
                  <button onClick={handleDownload} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download PDF
                  </button>
                ) : (
                  <button onClick={handleConvert} disabled={files.length === 0 || isConverting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:pointer-events-none disabled:opacity-40">
                    {isConverting ? (
                      <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{progressText || "Creating PDF..."}</>
                    ) : (
                      <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Create PDF</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
