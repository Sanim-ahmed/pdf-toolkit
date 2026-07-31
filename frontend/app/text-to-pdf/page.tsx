"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingOverlay from "@/components/LoadingOverlay";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

interface Stats {
  chars: number;
  lines: number;
  pages: number;
  time: number;
}

export default function TextToPdfPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [file, setFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [text, setText] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
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
    if (!f.name.toLowerCase().endsWith(".txt") && f.type !== "text/plain") return;
    setFile({ file: f, name: f.name, size: formatSize(f.size) });
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
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
    if (isConverting) return;
    if (activeTab === "upload" && !file) return;
    if (activeTab === "paste" && !text.trim()) return;

    setIsConverting(true);
    setError(null);
    setDownloadUrl(null);
    setStats(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      if (activeTab === "upload" && file) {
        formData.append("file", file.file);
      } else {
        formData.append("text", text);
      }

      const res = await fetch(`${API_BASE}/api/pdf/from-text`, {
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

      const chars = parseInt(res.headers.get("X-Chars-Processed") || "0", 10);
      const lines = parseInt(res.headers.get("X-Lines-Processed") || "0", 10);
      const pages = parseInt(res.headers.get("X-Pages-Generated") || "0", 10);
      const time = parseFloat(res.headers.get("X-Processing-Time") || "0");
      setStats({ chars, lines, pages, time });
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Conversion failed"));
    } finally {
      setIsConverting(false);
    }
  }, [file, text, activeTab, isConverting]);

  const handleDownload = useCallback(() => {
    if (!downloadUrl) return;
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = activeTab === "upload" && file ? file.name.replace(/\.txt$/i, ".pdf") : "document.pdf";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [downloadUrl, file, activeTab]);

  const charCount = text.length;
  const lineCount = text === "" ? 0 : text.split("\n").length;

  const handleTabChange = useCallback((tab: "upload" | "paste") => {
    setActiveTab(tab);
    setDownloadUrl(null);
    setStats(null);
    setError(null);
    setSuccess(false);
  }, []);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-rose-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/10 px-4 py-1.5 text-sm font-medium text-rose-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Text to PDF
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Text to<br /><span className="gradient-text">PDF</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Create clean, professionally formatted PDF files from plain text.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div className="mb-8 flex items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/[0.02] p-1">
              <button onClick={() => handleTabChange("upload")} disabled={isConverting} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none ${activeTab === "upload" ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-slate-400 hover:text-white"} ${isConverting ? "opacity-40" : ""}`}>Upload TXT</button>
              <button onClick={() => handleTabChange("paste")} disabled={isConverting} className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:pointer-events-none ${activeTab === "paste" ? "bg-rose-500/20 text-rose-400 shadow-sm" : "text-slate-400 hover:text-white"} ${isConverting ? "opacity-40" : ""}`}>Paste Text</button>
            </div>
            {activeTab === "upload" ? (
              <>
                <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
                  className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-rose-500 bg-rose-500/[0.08] scale-[1.02] shadow-2xl shadow-rose-500/10" : "border-white/10 bg-white/[0.02] hover:border-rose-500/40 hover:bg-rose-500/[0.04]"}`}>
                  <input ref={inputRef} type="file" accept=".txt" onChange={handleFileSelect} className="hidden" />
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10">
                    <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-rose-400" : "text-rose-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                  </div>
                  <p className="text-base font-medium text-white">{isDragging ? "Drop your text file here" : "Drag & drop a text file here"}</p>
                  <p className="mt-2 text-sm text-slate-500">or <span className="text-rose-400 underline underline-offset-2">browse files</span></p>
                  <p className="mt-1 text-xs text-slate-600">Supports TXT files up to 10 MB</p>
                </div>
                {file && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-medium text-slate-300">1 file selected</p>
                      <button onClick={removeFile} disabled={isConverting} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400 disabled:pointer-events-none disabled:opacity-40">Clear all</button>
                    </div>
                    <ul className="space-y-2" role="list">
                      <li className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-rose-500/20">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="text-xs text-slate-500">{file.size}</p></div>
                        <button onClick={removeFile} disabled={isConverting} className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-40" aria-label={`Remove ${file.name}`}>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </li>
                    </ul>
                    {isConverting && <LoadingOverlay accent="rose" />}
                    {error && <ErrorMessage error={error} />}
                    {success && <SuccessMessage />}
                    {stats && (
                      <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
                        <div className="grid grid-cols-4 gap-3">
                          <div><p className="text-xs text-slate-500">Characters</p><p className="text-sm font-medium text-white">{stats.chars.toLocaleString()}</p></div>
                          <div><p className="text-xs text-slate-500">Lines</p><p className="text-sm font-medium text-white">{stats.lines.toLocaleString()}</p></div>
                          <div><p className="text-xs text-slate-500">Pages</p><p className="text-sm font-medium text-white">{stats.pages}</p></div>
                          <div><p className="text-xs text-slate-500">Processing time</p><p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p></div>
                        </div>
                      </div>
                    )}
                    {downloadUrl ? (
                      <button onClick={handleDownload} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        Download PDF
                      </button>
                    ) : (
                      <button onClick={handleConvert} disabled={!file || isConverting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/30 disabled:pointer-events-none disabled:opacity-40">
                        {isConverting ? (
                          "Processing..."
                        ) : (
                          <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Convert to PDF</>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="mt-6">
                <textarea value={text} onChange={(e) => { setText(e.target.value); setDownloadUrl(null); setStats(null); setError(null); setSuccess(false); }} disabled={isConverting}
                  placeholder="Type or paste your text here..."
                  className="min-h-[280px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white placeholder-slate-500 outline-none transition-all focus:border-rose-500/40 focus:bg-rose-500/[0.04] disabled:pointer-events-none disabled:opacity-40"
                  spellCheck={false} />
                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                  <span>Characters: <span className="font-medium text-slate-300">{charCount.toLocaleString()}</span></span>
                  <span>Lines: <span className="font-medium text-slate-300">{lineCount.toLocaleString()}</span></span>
                </div>
                {isConverting && <LoadingOverlay accent="rose" />}
                {error && <ErrorMessage error={error} />}
                {success && <SuccessMessage />}
                {stats && (
                  <div className="mt-5 rounded-xl border border-rose-500/20 bg-rose-500/[0.04] p-4">
                    <div className="grid grid-cols-4 gap-3">
                      <div><p className="text-xs text-slate-500">Characters</p><p className="text-sm font-medium text-white">{stats.chars.toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500">Lines</p><p className="text-sm font-medium text-white">{stats.lines.toLocaleString()}</p></div>
                      <div><p className="text-xs text-slate-500">Pages</p><p className="text-sm font-medium text-white">{stats.pages}</p></div>
                      <div><p className="text-xs text-slate-500">Processing time</p><p className="text-sm font-medium text-white">{stats.time.toFixed(2)}s</p></div>
                    </div>
                  </div>
                )}
                {downloadUrl ? (
                  <button onClick={handleDownload} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/30">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    Download PDF
                  </button>
                ) : (
                  <button onClick={handleConvert} disabled={!text.trim() || isConverting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-rose-500/30 disabled:pointer-events-none disabled:opacity-40">
                    {isConverting ? (
                      "Processing..."
                    ) : (
                      <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>Convert to PDF</>
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
