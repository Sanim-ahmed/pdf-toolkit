import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about PDF Toolkit — a modern web application for fast, secure, and easy-to-use PDF utilities.",
};

const tools = [
  "Merge PDF",
  "Split PDF",
  "Compress PDF",
  "PDF to Word",
  "Word to PDF",
  "PDF to Text",
  "Text to PDF",
  "Image to PDF",
  "PDF to Image",
  "OCR",
];

const techs = [
  "Next.js",
  "FastAPI",
  "Python",
  "Docker",
  "LibreOffice",
  "Ghostscript",
  "Tesseract OCR",
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <section className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36">
          <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />
          <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-indigo-500/[0.06] blur-[120px]" />

          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">
                About
                <br />
                <span className="gradient-text">PDF Toolkit</span>
              </h1>
            </div>

            <div className="mt-12 space-y-8">
              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">Developer</h2>
                <div className="mt-4 space-y-3">
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">Name:</span>{" "}
                    Sanim Ahmed Khan
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">Email:</span>{" "}
                    <a
                      href="mailto:sanimahmedofficial@gmail.com"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      sanimahmedofficial@gmail.com
                    </a>
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">GitHub:</span>{" "}
                    <a
                      href="https://github.com/Sanim-ahmed"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      https://github.com/Sanim-ahmed
                    </a>
                  </p>
                  <p className="text-slate-400">
                    <span className="font-medium text-slate-300">LinkedIn:</span>{" "}
                    <a
                      href="https://www.linkedin.com/in/sanimahmedkhan/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:text-indigo-300 transition-colors"
                    >
                      https://www.linkedin.com/in/sanimahmedkhan/
                    </a>
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">About</h2>
                <p className="mt-4 text-slate-400 leading-relaxed">
                  PDF Toolkit is a modern web application developed by Sanim
                  Ahmed Khan to provide fast, secure, and easy-to-use PDF
                  utilities.
                </p>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">Tools</h2>
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {tools.map((tool) => (
                    <li
                      key={tool}
                      className="flex items-center gap-2 text-sm text-slate-400"
                    >
                      <svg
                        className="h-4 w-4 shrink-0 text-indigo-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {tool}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="glass-card rounded-2xl p-8">
                <h2 className="text-xl font-bold text-white">Built With</h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {techs.map((tech) => (
                    <span
                      key={tech}
                      className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-1.5 text-sm font-medium text-indigo-400"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
