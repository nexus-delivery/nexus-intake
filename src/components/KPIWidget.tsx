interface KPIWidgetProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: 'truck' | 'collection' | 'driver' | 'vehicle' | 'warehouse' | 'clipboard' | 'invoice' | 'cash' | 'alert' | 'customs' | 'brain' | 'package';
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    label: string;
  };
  status?: 'success' | 'warning' | 'issue' | 'info' | 'neutral';
  onClick?: () => void;
}

const statusColors: Record<string, string> = {
  success: 'bg-[var(--nexus-success)]/10 text-[var(--nexus-success)] border-[var(--nexus-success)]/20',
  warning: 'bg-[var(--nexus-warning)]/10 text-[var(--nexus-warning)] border-[var(--nexus-warning)]/20',
  issue: 'bg-[var(--nexus-issue)]/10 text-[var(--nexus-issue)] border-[var(--nexus-issue)]/20',
  info: 'bg-[var(--nexus-info)]/10 text-[var(--nexus-info)] border-[var(--nexus-info)]/20',
  neutral: 'bg-slate-50 text-slate-700 border-slate-200',
};

const iconMap: Record<KPIWidgetProps['icon'], React.ReactNode> = {
  truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 13h13v6H3z" />
      <path d="M16 13h3l2 3v3h-5" />
      <path d="M7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
    </svg>
  ),
  collection: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 7v10c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V7" />
      <path d="M3 7h18M6 7v-2c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v2" />
    </svg>
  ),
  driver: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  vehicle: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 15h18" />
      <path d="M5 15V9h14v6" />
      <path d="M5 9l1-3h12l1 3" />
      <path d="M7 15a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
    </svg>
  ),
  warehouse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 8l9-5 9 5v11H3z" />
      <path d="M12 3v16" />
      <path d="M6 12h12" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M9 3h6a1 1 0 011 1v1h6a2 2 0 012 2v14a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h6V4a1 1 0 011-1z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  ),
  invoice: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M6 3h9l5 5v13H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  ),
  cash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <circle cx="12" cy="12" r="1" />
      <path d="M3 6h18v12H3z" />
      <path d="M3 9a3 3 0 013-3h12a3 3 0 013 3" />
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M12 9v4M12 17h.01" />
      <path d="M10 3h4l6 11-6 7H10L4 14 10 3z" />
    </svg>
  ),
  customs: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 3h18v18H3z" />
      <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
    </svg>
  ),
  brain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M9 3a3 3 0 016 0M3 12a6 6 0 1112 0M9 16a3 3 0 016 0" />
    </svg>
  ),
  package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
      <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
      <path d="M12 3v18" />
      <path d="M3 7l9 4 9-4" />
    </svg>
  ),
};

export default function KPIWidget({
  title,
  value,
  unit,
  icon,
  trend,
  status = 'neutral',
  onClick,
}: KPIWidgetProps) {
  return (
    <article
      onClick={onClick}
      className={`rounded-[32px] border p-6 shadow-sm shadow-slate-200/30 transition ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_24px_80px_-40px_rgba(124,58,237,0.35)]' : ''
      } ${statusColors[status]} bg-white`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{title}</p>
          <div className="mt-4 flex items-baseline gap-2">
            <p className="text-4xl font-semibold tracking-tight text-[var(--nexus-graphite)]">
              {value}
            </p>
            {unit && <span className="text-sm text-slate-600">{unit}</span>}
          </div>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--nexus-purple)] text-white shadow-sm shadow-[var(--nexus-purple)]/30">
          {iconMap[icon]}
        </div>
      </div>

      {trend && (
        <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">Trend</p>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
              trend.direction === 'up'
                ? 'bg-[var(--nexus-purple)]/10 text-[var(--nexus-purple)]'
                : trend.direction === 'down'
                ? 'bg-slate-100 text-slate-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              {trend.direction === 'up' ? (
                <path d="M5 12l7-7 7 7" />
              ) : trend.direction === 'down' ? (
                <path d="M5 12l7 7 7-7" />
              ) : (
                <path d="M5 12h14" />
              )}
            </svg>
            {trend.label}
          </span>
        </div>
      )}
    </article>
  );
}
