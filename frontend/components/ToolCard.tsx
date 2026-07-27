interface ToolCardProps {
  name: string;
  description: string;
  icon: React.ReactNode;
}

export default function ToolCard({ name, description, icon }: ToolCardProps) {
  return (
    <div className="group relative cursor-pointer rounded-2xl border border-surface-border bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{description}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition-all group-hover:opacity-100">
        Use Tool
        <svg
          className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </div>
  );
}
