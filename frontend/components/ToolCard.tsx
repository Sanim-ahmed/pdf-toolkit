import Link from "next/link";

interface ToolCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  href?: string;
}

export default function ToolCard({ name, description, icon, gradient, href }: ToolCardProps) {
  const content = (
    <div className="group relative cursor-pointer rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 transition-all duration-300 hover:-translate-y-2 hover:border-indigo-500/30 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-indigo-500/[0.08]">
      <div
        className={`mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${gradient} text-white shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-indigo-300">
        {name}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        {description}
      </p>
      <div className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 opacity-0 transition-all duration-300 group-hover:opacity-100">
        Use Tool
        <svg
          className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-b from-indigo-500/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
