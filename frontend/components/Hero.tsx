export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden px-6 pb-24 pt-20 md:pt-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-4 py-1.5 text-sm font-medium text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Trusted by 50,000+ users worldwide
        </div>

        <h1 className="text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          All your PDF tools
          <br />
          <span className="bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            in one place
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">
          Convert, merge, split, compress, and scan PDFs in seconds. No uploads
          to external servers — everything runs securely in your browser.
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a
            href="#tools"
            className="inline-flex items-center rounded-xl bg-primary px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/25"
          >
            Start Using Free
            <svg
              className="ml-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </a>
          <a
            href="#features"
            className="inline-flex items-center rounded-xl border border-surface-border bg-surface px-8 py-3.5 text-sm font-semibold text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-primary-light"
          >
            See Features
          </a>
        </div>

        <div className="mx-auto mt-16 grid max-w-md grid-cols-3 gap-8 text-center">
          <div>
            <p className="text-2xl font-bold">50K+</p>
            <p className="mt-1 text-sm text-muted">Active Users</p>
          </div>
          <div>
            <p className="text-2xl font-bold">10M+</p>
            <p className="mt-1 text-sm text-muted">Files Processed</p>
          </div>
          <div>
            <p className="text-2xl font-bold">4.9/5</p>
            <p className="mt-1 text-sm text-muted">User Rating</p>
          </div>
        </div>
      </div>
    </section>
  );
}
