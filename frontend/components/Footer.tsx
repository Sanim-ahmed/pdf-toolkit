import Link from "next/link";

const toolLinks = [
  "PDF to Word",
  "Word to PDF",
  "Merge PDF",
  "Split PDF",
  "Compress PDF",
  "OCR Scan",
  "PDF to Text",
  "Text to PDF",
];

const companyLinks = ["About", "Pricing", "Blog", "Contact"];

const legalLinks = ["Privacy Policy", "Terms of Service", "Cookie Policy"];

export default function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-white">
                P
              </span>
              PDF Toolkit
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Free, fast, and private PDF tools. Process your files directly in
              the browser — nothing is uploaded to any server.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Tools</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {toolLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#tools"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Company</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {companyLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold">Legal</h4>
            <ul className="mt-4 flex flex-col gap-2.5">
              {legalLinks.map((link) => (
                <li key={link}>
                  <a
                    href="#"
                    className="text-sm text-muted transition-colors hover:text-foreground"
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-surface-border">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
          <p className="text-sm text-muted">
            &copy; {new Date().getFullYear()} PDF Toolkit. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-muted transition-colors hover:text-foreground" aria-label="Twitter">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a href="#" className="text-muted transition-colors hover:text-foreground" aria-label="GitHub">
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
