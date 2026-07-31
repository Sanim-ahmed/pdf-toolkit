"use client";

import { useEffect, useRef, useState } from "react";

const MESSAGES = [
  "📤 Uploading file...",
  "📄 Preparing document...",
  "⚙️ Processing...",
  "🔄 Converting...",
  "📝 Generating output...",
  "📦 Finalizing...",
  "✅ Almost done...",
];

const MESSAGE_INTERVAL = 2500;
const FADE_DURATION = 350;

type Accent =
  | "emerald"
  | "amber"
  | "blue"
  | "purple"
  | "pink"
  | "cyan"
  | "rose"
  | "indigo"
  | "teal";

const ACCENTS: Record<Accent, { arc: string; bar: string; dot: string; glow: string }> = {
  emerald: {
    arc: "border-t-emerald-400 border-l-emerald-400/40 border-b-emerald-400/15",
    bar: "from-emerald-400 via-green-400 to-emerald-500",
    dot: "bg-emerald-400",
    glow: "from-emerald-400/25 via-green-400/10 to-transparent",
  },
  amber: {
    arc: "border-t-amber-400 border-l-amber-400/40 border-b-amber-400/15",
    bar: "from-amber-400 via-orange-400 to-amber-500",
    dot: "bg-amber-400",
    glow: "from-amber-400/25 via-orange-400/10 to-transparent",
  },
  blue: {
    arc: "border-t-blue-400 border-l-blue-400/40 border-b-blue-400/15",
    bar: "from-blue-400 via-indigo-400 to-blue-500",
    dot: "bg-blue-400",
    glow: "from-blue-400/25 via-indigo-400/10 to-transparent",
  },
  purple: {
    arc: "border-t-purple-400 border-l-purple-400/40 border-b-purple-400/15",
    bar: "from-purple-400 via-indigo-400 to-purple-500",
    dot: "bg-purple-400",
    glow: "from-purple-400/25 via-indigo-400/10 to-transparent",
  },
  pink: {
    arc: "border-t-pink-400 border-l-pink-400/40 border-b-pink-400/15",
    bar: "from-pink-400 via-rose-400 to-pink-500",
    dot: "bg-pink-400",
    glow: "from-pink-400/25 via-rose-400/10 to-transparent",
  },
  cyan: {
    arc: "border-t-cyan-400 border-l-cyan-400/40 border-b-cyan-400/15",
    bar: "from-cyan-400 via-teal-400 to-cyan-500",
    dot: "bg-cyan-400",
    glow: "from-cyan-400/25 via-teal-400/10 to-transparent",
  },
  rose: {
    arc: "border-t-rose-400 border-l-rose-400/40 border-b-rose-400/15",
    bar: "from-rose-400 via-pink-400 to-rose-500",
    dot: "bg-rose-400",
    glow: "from-rose-400/25 via-pink-400/10 to-transparent",
  },
  indigo: {
    arc: "border-t-indigo-400 border-l-indigo-400/40 border-b-indigo-400/15",
    bar: "from-indigo-400 via-purple-400 to-indigo-500",
    dot: "bg-indigo-400",
    glow: "from-indigo-400/25 via-purple-400/10 to-transparent",
  },
  teal: {
    arc: "border-t-teal-400 border-l-teal-400/40 border-b-teal-400/15",
    bar: "from-teal-400 via-emerald-400 to-teal-500",
    dot: "bg-teal-400",
    glow: "from-teal-400/25 via-emerald-400/10 to-transparent",
  },
};

interface LoadingOverlayProps {
  accent?: Accent;
  showOcrNotice?: boolean;
}

export default function LoadingOverlay({
  accent = "emerald",
  showOcrNotice = false,
}: LoadingOverlayProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [fading, setFading] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(0);
  const colors = ACCENTS[accent];

  useEffect(() => {
    startRef.current = Date.now();

    const elapsedTimer = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 1000);

    const cycleTimer = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
        setFading(false);
      }, FADE_DURATION);
    }, MESSAGE_INTERVAL);

    return () => {
      window.clearInterval(elapsedTimer);
      window.clearInterval(cycleTimer);
    };
  }, []);

  return (
    <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.02] p-8">
      <div className="flex flex-col items-center gap-6">
        <div className="relative h-16 w-16" role="status" aria-label="Processing">
          <div className={`absolute -inset-2 rounded-full bg-gradient-to-br ${colors.glow} blur-lg animate-pulse`} />
          <div className="absolute inset-0 rounded-full border-2 border-white/[0.06]" />
          <div className={`absolute inset-0 rounded-full border-2 border-transparent animate-spin ${colors.arc}`} />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/15 animate-spin [animation-direction:reverse] [animation-duration:1.6s]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`h-2.5 w-2.5 rounded-full ${colors.dot} shadow-lg`} />
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            <div className={`absolute h-full w-1/3 rounded-full bg-gradient-to-r ${colors.bar} animate-progress-indeterminate`} />
          </div>
        </div>

        <div className="flex h-8 items-center justify-center">
          <p
            key={messageIndex}
            aria-live="polite"
            className={`text-base font-medium text-white ${fading ? "animate-message-out" : "animate-message-in"}`}
          >
            {MESSAGES[messageIndex]}
          </p>
        </div>

        <p className="text-sm text-slate-400">
          Processing time:{" "}
          <span className="font-semibold text-slate-200 tabular-nums">{elapsed}s</span>
        </p>
      </div>

      {showOcrNotice && (
        <div className="mt-6 flex items-start gap-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-left">
          <span aria-hidden="true" className="mt-0.5 shrink-0">⚠️</span>
          <p className="text-sm text-amber-200/90">
            OCR may take longer than other tools depending on the image quality, file size, and
            current server load. Please keep this page open until processing is complete.
          </p>
        </div>
      )}
    </div>
  );
}
