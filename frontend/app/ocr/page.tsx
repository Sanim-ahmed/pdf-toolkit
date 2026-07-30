"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

const ACCEPTED_TYPES = [
  ".pdf", ".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif",
];

const ACCEPT_STRING = ACCEPTED_TYPES.join(",");

const LANGUAGES = [
  { value: "eng", label: "English" },
];

interface Stats {
  pagesProcessed: number;
  charsExtracted: number;
  time: number;
}

const isAccepted = (f: File) => {
  const ext = "." + f.name.split(".").pop()?.toLowerCase();
  return ACCEPTED_TYPES.includes(ext);
};

export default function OcrPage() {
  const [file, setFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [language, setLanguage] = useState("eng");
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progressText, setProgressText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const downloadUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
    };
  }, []);

  const handleFile = useCallback((f: File) => {
    if (!isAccepted(f)) return;
    setFile({ file: f, name: f.name, size: formatSize(f.size) });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

  const addFile = useCallback(
    (newFiles: FileList | File[]) => {
      const accepted = Array.from(newFiles).find((f) => isAccepted(f));
      if (accepted) handleFile(accepted);
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

  const handleExtract = useCallback(async () => {
    if (!file || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    setDownloadUrl(null);
    setStats(null);
    setSuccess(false);
    setProgressText("Uploading...");

    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("language", language);

      setProgressText("Processing...");
      const res = await fetch(`${API_BASE}/api/pdf/ocr`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "OCR extraction failed" }));
        throw new Error(err.detail || "OCR extraction failed");
      }

      setProgressText("Preparing download...");
      const blob = await res.blob();
      if (downloadUrlRef.current) URL.revokeObjectURL(downloadUrlRef.current);
      const url = URL.createObjectURL(blob);
      downloadUrlRef.current = url;
      setDownloadUrl(url);
      setSuccess(true);

      setStats({
        pagesProcessed: parseInt(res.headers.get("X-Pages-Processed") || "1"),
        charsExtracted: parseInt(res.headers.get("X-Chars-Extracted") || "0"),
        time: parseFloat(res.headers.get("X-Processing-Time") || "0"),
      });
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Failed to extract text"));
    } finally {
      setIsProcessing(false);
      setProgressText("");
    }
  }, [file, isProcessing, language]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name.replace(/\.[^.]+$/, "") + ".txt";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [downloadUrl, file]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-amber-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>
              OCR
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">OCR<br /><span className="gradient-text">Text Extraction</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Extract text from scanned documents and images using OCR technology.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-amber-500 bg-amber-500/[0.08] scale-[1.02] shadow-2xl shadow-amber-500/10" : "border-white/10 bg-white/[0.02] hover:border-amber-500/40 hover:bg-amber-500/[0.04]"}`}>
              <input ref={inputRef} type="file" accept={ACCEPT_STRING} onChange={handleFileSelect} className="hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-amber-400" : "text-amber-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base font-medium text-white">{isDragging ? "Drop your file here" : "Drag & drop a file here"}</p>
              <p className="mt-2 text-sm text-slate-500">or <span className="text-amber-400 underline underline-offset-2">browse files</span></p>
              <p className="mt-1 text-xs text-slate-600">Supports PDF, PNG, JPG, WEBP, BMP, TIFF &mdash; up to 100 MB</p>
            </div>
            {file && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">1 file selected</p>
                  <button onClick={removeFile} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400">Clear all</button>
                </div>
                <ul className="space-y-2" role="list">
                  <li className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-amber-500/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="text-xs text-slate-500">{file.size}</p></div>
                    <button onClick={removeFile} className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400" aria-label={`Remove ${file.name}`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                </ul>
                <div className="mt-5 space-y-3">
                  <p className="text-sm font-medium text-slate-300">Language</p>
                  {LANGUAGES.map((lang) => (
                    <label key={lang.value} className={`flex cursor-pointer items-center gap-4 rounded-xl border px-4 py-3 transition-all ${language === lang.value ? "border-amber-500/40 bg-amber-500/[0.06]" : "border-white/10 bg-white/[0.02] hover:border-white/20"}`}>
                      <input type="radio" name="language" value={lang.value} checked={language === lang.value} onChange={(e) => setLanguage(e.target.value)} className="h-4 w-4 accent-amber-500" />
                      <div><p className="text-sm font-medium text-white">{lang.label}</p></div>
                    </label>
                  ))}
                </div>
                {error && <ErrorMessage error={error} />}
                {success && <SuccessMessage />}
                {stats && (
                  <div className="mt-5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div><p className="text-xs text-slate-500">Pages Processed</p><p className="text-sm font-medium text-white">{stats.pagesProcessed}</p></div>
                      <div><p className="text-xs text-slate-500">Characters Extracted</p><p className="text-sm font-medium text-white">{stats.charsExtracted.toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500">Processing Time</p><p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p></div>
                    </div>
                  </div>
                )}
                {downloadUrl ? (
                  <button onClick={handleDownload} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download TXT
                  </button>
                ) : (
                  <button onClick={handleExtract} disabled={!file || isProcessing} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/30 disabled:pointer-events-none disabled:opacity-40">
                    {isProcessing ? (
                      <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{progressText || "Extracting Text..."}</>
                    ) : (
                      <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" /></svg>Extract Text</>
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
