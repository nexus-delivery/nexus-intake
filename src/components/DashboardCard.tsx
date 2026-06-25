type DashboardCardProps = {
  title: string;
  value: string;
  label: string;
  accent?: "slate" | "blue" | "green" | "amber" | "rose" | "indigo";
};

const accentClasses: Record<NonNullable<DashboardCardProps["accent"]>, string> = {
  slate: "bg-slate-100 text-slate-700",
  blue: "bg-sky-100 text-sky-700",
  green: "bg-emerald-100 text-emerald-700",
  amber: "bg-amber-100 text-amber-700",
  rose: "bg-rose-100 text-rose-700",
  indigo: "bg-indigo-100 text-indigo-700",
};

export default function DashboardCard({
  title,
  value,
  label,
  accent = "blue",
}: DashboardCardProps) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-950">{value}</p>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${accentClasses[accent]}`}>
          {label}
        </span>
      </div>
    </article>
  );
}
