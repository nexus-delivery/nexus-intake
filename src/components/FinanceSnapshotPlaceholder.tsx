export default function FinanceSnapshotPlaceholder() {
  const metrics = [
    { label: 'Revenue Today', value: '£12,450', trend: '+8%', direction: 'up' as const },
    { label: 'Pending Invoices', value: '£84,200', trend: '-3%', direction: 'down' as const },
    { label: 'Cash Position', value: '£342,100', trend: '+2%', direction: 'up' as const },
  ];

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Finance</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--nexus-graphite)]">Finance Snapshot</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Integration with Xero for real-time financial metrics.
          </p>
        </div>
        <span className="inline-flex rounded-2xl bg-[var(--nexus-purple)]/10 px-4 py-2 text-sm font-semibold text-[var(--nexus-purple)]">
          Placeholder
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/20">
            <p className="text-sm text-slate-600">{metric.label}</p>
            <p className="mt-3 text-2xl font-semibold text-slate-900">{metric.value}</p>
            <div className="mt-4 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  metric.direction === 'up'
                    ? 'bg-[var(--nexus-success)]/10 text-[var(--nexus-success)]'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3">
                  {metric.direction === 'up' ? (
                    <path d="M5 12l7-7 7 7" />
                  ) : (
                    <path d="M5 12l7 7 7-7" />
                  )}
                </svg>
                {metric.trend}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
