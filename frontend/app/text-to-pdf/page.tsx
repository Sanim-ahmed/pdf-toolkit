"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://pdf-toolkit-backend-docker.onrender.com";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface Stats {
  chars: number;
  lines: number;
  pages: number;
  time: number;
}

export default function TextToPdfPage() {
  const [file, setFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (!f.name.toLowerCase().endsWith(".txt") && f.type !== "text/plain") return;
    setFile({
      file: f,
      name: f.name,
      size: formatSize(f.size),
    });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
  }, []);

  const addFile = useCallback(
    (newFiles: FileList | File[]) => {
      const txt = Array.from(newFiles).find(
        (f) => f.name.toLowerCase().endsWith(".txt") || f.type === "text/plain"
      );
      if (txt) handleFile(txt);
    },
    [handleFile]
  );

  const removeFile = useCallback(() => {
    setFile(null);
    setDownloadUrl(null);
    setStats(null);
    setError(null);
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
    try {
      const formData = new FormData();
      formData.append("file", file.file);

      const res = await fetch(`${API_BASE}/api/pdf/from-text`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Conversion failed" }));
        throw new Error(err.detail || "Conversion failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);

      const chars = parseInt(res.headers.get("X-Chars-Processed") || "0", 10);
      const lines = parseInt(res.headers.get("X-Lines-Processed") || "0", 10);
      const pages = parseInt(res.headers.get("X-Pages-Generated") || "0", 10);
      const time = parseFloat(res.headers.get("X-Processing-Time") || "0");
      setStats({ chars, lines, pages, time });
    } catch (e) {
      console.error("Conversion error:", e);
      setError(e instanceof Error ? e.message : "Failed to convert text to PDF");
    } finally {
      setIsConverting(false);
    }
  }, [file, isConverting]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl || !file) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = file.name.replace(/\.txt$/i, ".pdf");
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
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-blue-500/[0.06] blur-[120px]" />

          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-1.5 text-sm font-medium text-blue-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Text to PDF
            </div>

            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
              Text to
              <br />
              <span className="gradient-text">PDF</span>
            </h1>

            <p className="mx-auto mt-5 max-w-lg text-slate-400">
              Create clean, professionally formatted PDF files from plain text.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
              }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${
                isDragging
                  ? "border-blue-500 bg-blue-500/[0.08] scale-[1.02] shadow-2xl shadow-blue-500/10"
                  : "border-white/10 bg-white/[0.02] hover:border-blue-500/40 hover:bg-blue-500/[0.04]"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept=".txt"
                onChange={handleFileSelect}
                className="hidden"
              />

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10">
                <svg
                  className={`h-8 w-8 transition-colors ${
                    isDragging ? "text-blue-400" : "text-blue-500/60"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <p className="text-base font-medium text-white">
                {isDragging ? "Drop your text file here" : "Drag & drop a text file here"}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                or{" "}
                <span className="text-blue-400 underline underline-offset-2">
                  browse files
                </span>
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Supports TXT files up to 10 MB
              </p>
            </div>

            {file && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">1 file selected</p>
                  <button
                    onClick={removeFile}
                    className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400"
                  >
                    Clear all
                  </button>
                </div>

                <ul className="space-y-2" role="list">
                  <li className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-blue-500/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-white">
                        {file.name}
                      </p>
                      <p className="text-xs text-slate-500">{file.size}</p>
                    </div>

                    <button
                      onClick={removeFile}
                      className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Remove ${file.name}`}
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </li>
                </ul>

                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                    {error}
                  </div>
                )}

                {stats && (
                  <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <p className="text-xs text-slate-500">Characters</p>
                        <p className="text-sm font-medium text-white">{stats.chars.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Lines</p>
                        <p className="text-sm font-medium text-white">{stats.lines.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Pages</p>
                        <p className="text-sm font-medium text-white">{stats.pages}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">Processing time</p>
                        <p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p>
                      </div>
                    </div>
                  </div>
                )}

                {downloadUrl ? (
                  <button
                    onClick={handleDownload}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </button>
                ) : (
                  <button
                    onClick={handleConvert}
                    disabled={!file || isConverting}
                    className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-500/30 disabled:pointer-events-none disabled:opacity-40"
                  >
                    {isConverting ? (
                      <>
                        <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Converting...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Convert to PDF
                      </>
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
