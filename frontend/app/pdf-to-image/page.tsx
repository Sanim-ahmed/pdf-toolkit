"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingOverlay from "@/components/LoadingOverlay";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

interface Stats {
  pagesConverted: number;
  outputFormat: string;
  dpi: number;
  outputSize: number;
  time: number;
}

const FORMATS = [
  { value: "png", label: "PNG", desc: "Lossless, larger file size" },
  { value: "jpeg", label: "JPEG", desc: "Lossy, smaller file size" },
];

const DPIS = [
  { value: 100, label: "100 DPI", desc: "Smaller file size" },
  { value: 200, label: "200 DPI", desc: "Good quality" },
  { value: 300, label: "300 DPI", desc: "Highest quality" },
];

export default function PdfToImagePage() {
  const [file, setFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [fmt, setFmt] = useState("png");
  const [dpi, setDpi] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isMultiPage, setIsMultiPage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile({ file: f, name: f.name, size: formatSize(f.size) });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

  const addFile = useCallback(
    (newFiles: FileList | File[]) => {
      const pdf = Array.from(newFiles).find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
      );
      if (pdf) handleFile(pdf);
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

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
      if (e.dataTransfer.files.length) addFile(e.dataTransfer.files);
    },
    [addFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.length) addFile(e.target.files);
      e.target.value = "";
    },
    [addFile]
  );

  const handleConvert = useCallback(async () => {
    if (!file || isConverting) return;
    setIsConverting(true);
    setError(null);
    setDownloadUrl(null);
    setStats(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("fmt", fmt);
      formData.append("dpi", String(dpi));

      const res = await fetch(`${API_BASE}/api/pdf/to-image`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Conversion failed" }));
        throw new Error(err.detail || "Conversion failed");
      }

      const blob = await res.blob();
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);
      setSuccess(true);

      const pages = parseInt(res.headers.get("x-pages-converted") || "1");
      const multi = pages > 1;
      setIsMultiPage(multi);

      setStats({
        pagesConverted: pages,
        outputFormat: fmt,
        dpi,
        outputSize: blob.size,
        time: parseFloat(res.headers.get("x-processing-time") || "0"),
      });
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Failed to convert PDF"));
    } finally {
      setIsConverting(false);
    }
  }, [file, isConverting, fmt, dpi]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    const ext = fmt === "png" ? "png" : "jpg";
    const base = file.name.replace(/\.pdf$/i, "");
    a.download = isMultiPage ? `${base}.zip` : `${base}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [downloadUrl, file, fmt, isMultiPage]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              PDF to Image
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">PDF to<br /><span className="gradient-text">Image</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Convert PDF pages into high-quality PNG or JPEG images.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-blue-500 bg-blue-500/[0.08] scale-[1.02] shadow-2xl shadow-blue-500/10" : "border-white/10 bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/[0.04]"}`}>
              <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-blue-400" : "text-blue-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base font-medium text-white">{isDragging ? "Drop your PDF here" : "Drag & drop a PDF file here"}</p>
              <p className="mt-2 text-sm text-slate-500">or <span className="text-blue-400 underline underline-offset-2">browse files</span></p>
              <p className="mt-1 text-xs text-slate-600">Supports PDF files up to 100 MB</p>
            </div>
            {file && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">1 file selected</p>
                  <button onClick={removeFile} disabled={isConverting} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400 disabled:pointer-events-none disabled:opacity-40">Clear all</button>
                </div>
                <ul className="space-y-2" role="list">
                  <li className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-blue-500/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="text-xs text-slate-500">{file.size}</p></div>
                    <button onClick={removeFile} disabled={isConverting} className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-40" aria-label={`Remove ${file.name}`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                </ul>
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-300">Output Format</p>
                  {FORMATS.map((f) => (
                    <label key={f.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all ${isConverting ? "opacity-40 pointer-events-none" : ""} ${fmt === f.value ? "border-blue-500/40 bg-blue-500/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                      <input type="radio" name="format" value={f.value} checked={fmt === f.value} onChange={(e) => setFmt(e.target.value)} disabled={isConverting} className="h-4 w-4 accent-blue-500" />
                      <div><p className="text-sm font-medium text-white">{f.label}</p><p className="text-xs text-slate-500">{f.desc}</p></div>
                    </label>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-300">Resolution (DPI)</p>
                  {DPIS.map((d) => (
                    <label key={d.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all ${isConverting ? "opacity-40 pointer-events-none" : ""} ${dpi === d.value ? "border-blue-500/40 bg-blue-500/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                      <input type="radio" name="dpi" value={d.value} checked={dpi === d.value} onChange={(e) => setDpi(Number(e.target.value))} disabled={isConverting} className="h-4 w-4 accent-blue-500" />
                      <div><p className="text-sm font-medium text-white">{d.label}</p><p className="text-xs text-slate-500">{d.desc}</p></div>
                    </label>
                  ))}
                </div>
                {isConverting && <LoadingOverlay accent="blue" />}
                {error && <ErrorMessage error={error} />}
                {success && <SuccessMessage />}
                {stats && (
                  <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Pages Converted</p><p className="text-sm font-medium text-white">{stats.pagesConverted}</p></div>
                      <div><p className="text-xs text-slate-500">Output Format</p><p className="text-sm font-medium text-white uppercase">{stats.outputFormat}</p></div>
                      <div><p className="text-xs text-slate-500">DPI</p><p className="text-sm font-medium text-white">{stats.dpi}</p></div>
                      <div><p className="text-xs text-slate-500">Output Size</p><p className="text-sm font-medium text-white">{formatSize(stats.outputSize)}</p></div>
                      <div><p className="text-xs text-slate-500">Processing Time</p><p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p></div>
                    </div>
                  </div>
                )}
                {downloadUrl ? (
                  <button onClick={handleDownload} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    {isMultiPage ? "Download ZIP" : "Download Image"}
                  </button>
                ) : (
                  <button onClick={handleConvert} disabled={!file || isConverting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:pointer-events-none disabled:opacity-40">
                    {isConverting ? (
                      "Processing..."
                    ) : (
                      <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>Convert to Images</>
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
