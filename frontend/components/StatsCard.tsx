interface StatItem {
  label: string;
  value: string;
}

interface StatsCardProps {
  stats: StatItem[];
  accent?: string;
}

export default function StatsCard({ stats, accent = "blue" }: StatsCardProps) {
  const borderColor = `border-${accent}-500/20`;
  const bgColor = `bg-${accent}-500/[0.04]`;

  return (
    <div className={`mt-5 rounded-xl border ${borderColor} ${bgColor} p-4`}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-sm font-medium text-white">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
