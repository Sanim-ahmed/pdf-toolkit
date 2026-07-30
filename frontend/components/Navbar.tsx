"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Tools", href: "/#tools" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6" aria-label="Main navigation">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="PDF Toolkit Home">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/20 transition-shadow group-hover:shadow-indigo-500/30">
            <span className="text-sm font-bold text-white">P</span>
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            PDF Toolkit
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex" role="list">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/#tools"
          className="hidden rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-400 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/20 hover:text-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 md:inline-flex"
        >
          Get Started
        </Link>

        <button
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 transition-colors hover:text-white md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-white/[0.06] bg-[#0a0a0f]/95 backdrop-blur-xl md:hidden" role="dialog" aria-label="Mobile navigation">
          <div className="space-y-1 px-6 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-4 py-3 text-sm font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-white"
                onClick={closeMobile}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/#tools"
              className="mt-3 block rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-5 py-3 text-center text-sm font-semibold text-indigo-400 transition-all hover:bg-indigo-500/20"
              onClick={closeMobile}
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
