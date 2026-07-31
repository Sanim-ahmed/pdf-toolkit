"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import LoadingOverlay from "@/components/LoadingOverlay";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

export default function SplitPdfPage() {
  const [file, setFile] = useState<{ file: File; name: string; size: string } | null>(null);
  const [pageRange, setPageRange] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isSplitting, setIsSplitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) return;
    setFile({ file: f, name: f.name, size: formatSize(f.size) });
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

  const removeFile = useCallback(() => setFile(null), []);

  const clearAll = useCallback(() => {
    setFile(null);
    setPageRange("");
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

  const handleSplit = useCallback(async () => {
    if (!file || !pageRange.trim() || isSplitting) return;
    setIsSplitting(true);
    setError(null);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("file", file.file);
      formData.append("page_range", pageRange.trim());

      const res = await fetch(`${API_BASE}/api/pdf/split`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Split failed" }));
        throw new Error(err.detail || "Split failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "split.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Split failed"));
    } finally {
      setIsSplitting(false);
    }
  }, [file, pageRange, isSplitting]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-pink-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-sm font-medium text-pink-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
              Split PDF
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Split PDF<br /><span className="gradient-text">Pages</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Extract specific pages or ranges from a PDF document.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-pink-500 bg-pink-500/[0.08] scale-[1.02] shadow-2xl shadow-pink-500/10" : "border-white/10 bg-white/[0.02] hover:border-pink-500/40 hover:bg-pink-500/[0.04]"}`}>
              <input ref={inputRef} type="file" accept=".pdf" onChange={handleFileSelect} className="hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-pink-500/10">
                <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-pink-400" : "text-pink-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base font-medium text-white">{isDragging ? "Drop your PDF here" : "Drag & drop a PDF file here"}</p>
              <p className="mt-2 text-sm text-slate-500">or <span className="text-pink-400 underline underline-offset-2">browse files</span></p>
              <p className="mt-1 text-xs text-slate-600">Supports PDF files up to 50 MB</p>
            </div>
            {file && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">1 file selected</p>
                  <button onClick={clearAll} disabled={isSplitting} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400 disabled:pointer-events-none disabled:opacity-40">Clear all</button>
                </div>
                <ul className="space-y-2" role="list">
                  <li className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-pink-500/20">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-pink-500/10 text-pink-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-white">{file.name}</p><p className="text-xs text-slate-500">{file.size}</p></div>
                    <button onClick={removeFile} disabled={isSplitting} className="ml-1 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:pointer-events-none disabled:opacity-40" aria-label={`Remove ${file.name}`}>
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                </ul>
                <div className="mt-4">
                  <label htmlFor="page-range" className="mb-2 block text-sm font-medium text-slate-300">Page Range</label>
                  <input id="page-range" type="text" value={pageRange} onChange={(e) => setPageRange(e.target.value)} disabled={isSplitting}
                    placeholder="e.g. 1-3, 5, 2,4,7-9"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-pink-500/50 focus:bg-pink-500/[0.04] focus:ring-1 focus:ring-pink-500/20 disabled:pointer-events-none disabled:opacity-40" />
                  <p className="mt-1.5 text-xs text-slate-500">Specify pages to extract (e.g. 1-3, 5, 2,4,7-9)</p>
                </div>
                {isSplitting && <LoadingOverlay accent="pink" />}
                {error && <ErrorMessage error={error} />}
                {success && <SuccessMessage />}
                <button onClick={handleSplit} disabled={!file || !pageRange.trim() || isSplitting} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-pink-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-pink-500/30 disabled:pointer-events-none disabled:opacity-40">
                  {isSplitting ? (
                    "Processing..."
                  ) : (
                    <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>Split PDF</>
                  )}
                </button>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
