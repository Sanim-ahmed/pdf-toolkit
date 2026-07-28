import ToolCard from "./ToolCard";

const tools = [
  {
    name: "PDF to Word",
    description: "Convert PDF documents to editable Word files with formatting preserved.",
    gradient: "bg-gradient-to-br from-blue-500 to-blue-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    name: "Word to PDF",
    description: "Transform Word documents into universally compatible PDF files instantly.",
    gradient: "bg-gradient-to-br from-indigo-500 to-indigo-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Merge PDF",
    description: "Combine multiple PDF files into a single document in the order you choose.",
    gradient: "bg-gradient-to-br from-purple-500 to-purple-600",
    href: "/merge-pdf",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    name: "Split PDF",
    description: "Separate a PDF into individual pages or extract specific page ranges.",
    gradient: "bg-gradient-to-br from-pink-500 to-pink-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    name: "Compress PDF",
    description: "Reduce PDF file size while maintaining quality for easy sharing.",
    gradient: "bg-gradient-to-br from-emerald-500 to-emerald-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
      </svg>
    ),
  },
  {
    name: "OCR Scan",
    description: "Extract text from scanned documents and images using OCR technology.",
    gradient: "bg-gradient-to-br from-amber-500 to-orange-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    ),
  },
  {
    name: "PDF to Text",
    description: "Extract plain text content from any PDF document quickly and accurately.",
    gradient: "bg-gradient-to-br from-cyan-500 to-cyan-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
      </svg>
    ),
  },
  {
    name: "Text to PDF",
    description: "Create clean, professionally formatted PDF files from plain text.",
    gradient: "bg-gradient-to-br from-rose-500 to-rose-600",
    icon: (
      <svg className="h-7 w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
];

export default function ToolGrid() {
  return (
    <section id="tools" className="relative px-6 py-24">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.04] blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">
            Tools
          </p>
          <h2 className="mt-3 text-3xl font-bold text-white md:text-4xl">
            Everything you need for PDFs
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Powerful tools to handle any PDF task. Fast, free, and secure.
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {tools.map((tool) => (
            <ToolCard
              key={tool.name}
              name={tool.name}
              description={tool.description}
              icon={tool.icon}
              gradient={tool.gradient}
              href={"href" in tool ? tool.href : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
