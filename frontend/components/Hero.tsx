export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-6 pb-24 pt-28 md:pt-36"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 bg-mesh" />

      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-indigo-500/[0.07] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/4 -z-10 h-[400px] w-[400px] rounded-full bg-purple-500/[0.05] blur-[100px]" />

      <div className="mx-auto max-w-4xl text-center">
        <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-400 backdrop-blur-sm">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500" />
          </span>
          Trusted by 50,000+ users worldwide
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-7xl">
          All Your PDF Tools
          <br />
          <span className="gradient-text">in One Place</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 md:text-xl">
          Convert, merge, split, compress and scan PDF files securely.
          Everything runs in your browser — nothing leaves your device.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#tools"
            className="group relative inline-flex items-center overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-indigo-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-indigo-500/30"
          >
            <span className="relative z-10">Get Started</span>
            <svg
              className="relative z-10 ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </a>
          <a
            href="#tools"
            className="glass-card inline-flex items-center rounded-xl px-8 py-4 text-sm font-semibold text-slate-300 transition-all hover:-translate-y-0.5 hover:text-white"
          >
            Browse Tools
          </a>
        </div>

        <div className="mx-auto mt-20 grid max-w-lg grid-cols-3 gap-8">
          {[
            { value: "50K+", label: "Active Users" },
            { value: "10M+", label: "Files Processed" },
            { value: "4.9/5", label: "User Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl font-bold text-white md:text-3xl">{stat.value}</p>
              <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
