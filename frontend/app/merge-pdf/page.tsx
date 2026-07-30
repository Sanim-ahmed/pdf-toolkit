"use client";

import { useState, useCallback, useRef } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SuccessMessage from "@/components/SuccessMessage";
import ErrorMessage from "@/components/ErrorMessage";
import { API_BASE, formatSize, friendlyError } from "@/lib/constants";

interface FileItem {
  id: string;
  file: File;
  name: string;
  size: string;
}

export default function MergePdfPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [progressText, setProgressText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const pdfs = Array.from(newFiles).filter(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    const mapped = pdfs.map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      name: file.name,
      size: formatSize(file.size),
    }));
    setFiles((prev) => [...prev, ...mapped]);
    setError(null);
    setSuccess(false);
  }, []);

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setFiles([]);
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

  const handleMerge = useCallback(async () => {
    if (!files.length || isMerging) return;
    setIsMerging(true);
    setError(null);
    setSuccess(false);
    setProgressText("Uploading...");

    try {
      const formData = new FormData();
      files.forEach((f) => formData.append("files", f.file));

      setProgressText("Processing...");
      const res = await fetch(`${API_BASE}/api/pdf/merge`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Merge failed" }));
        throw new Error(err.detail || "Merge failed");
      }

      setProgressText("Preparing download...");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "merged.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSuccess(true);
    } catch (e) {
      setError(friendlyError(e instanceof Error ? e.message : "Merge failed"));
    } finally {
      setIsMerging(false);
      setProgressText("");
    }
  }, [files, isMerging]);

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-purple-500/[0.06] blur-[120px]" />
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/20 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>
              Merge PDF
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Merge PDF<br /><span className="gradient-text">Files</span></h1>
            <p className="mx-auto mt-5 max-w-lg text-slate-400">Combine multiple PDF files into one document quickly and securely.</p>
          </div>
          <div className="mx-auto mt-12 max-w-2xl">
            <div onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              onClick={() => inputRef.current?.click()} role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-300 ${isDragging ? "border-purple-500 bg-purple-500/[0.08] scale-[1.02] shadow-2xl shadow-purple-500/10" : "border-white/10 bg-white/[0.02] hover:border-purple-500/40 hover:bg-purple-500/[0.04]"}`}>
              <input ref={inputRef} type="file" accept=".pdf" multiple onChange={handleFileSelect} className="hidden" />
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
                <svg className={`h-8 w-8 transition-colors ${isDragging ? "text-purple-400" : "text-purple-500/60"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
              </div>
              <p className="text-base font-medium text-white">{isDragging ? "Drop your PDFs here" : "Drag & drop PDF files here"}</p>
              <p className="mt-2 text-sm text-slate-500">or <span className="text-purple-400 underline underline-offset-2">browse files</span></p>
              <p className="mt-1 text-xs text-slate-600">Supports PDF files up to 50 MB each</p>
            </div>
            {files.length > 0 && (
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-300">{files.length} {files.length === 1 ? "file" : "files"} selected</p>
                  <button onClick={clearAll} className="text-xs font-medium text-slate-500 transition-colors hover:text-red-400">Clear all</button>
                </div>
                <ul className="space-y-2" role="list">
                  {files.map((f, i) => (
                    <li key={f.id} className="glass-card flex items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:border-purple-500/20">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
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
                <button onClick={handleMerge} disabled={files.length === 0 || isMerging} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-500/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-purple-500/30 disabled:pointer-events-none disabled:opacity-40">
                  {isMerging ? (
                    <><svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>{progressText || "Merging..."}</>
                  ) : (
                    <><svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" /></svg>Merge PDF</>
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
