export default function RecentAlertsPlaceholder() {
  const alerts = [
    {
      id: 1,
      type: 'warning',
      title: 'Driver Delay',
      description: 'Driver 14 is running 12 minutes behind schedule on Route 205',
    },
    {
      id: 2,
      type: 'info',
      title: 'POD Missing',
      description: 'Proof of delivery not received for Order 4521',
    },
    {
      id: 3,
      type: 'issue',
      title: 'Failed Collection',
      description: 'Collection attempt failed at 42 King Street, London',
    },
  ];

  const typeStyles: Record<string, string> = {
    warning: 'border-[var(--nexus-warning)] bg-[var(--nexus-warning)]/10 text-[var(--nexus-warning)]',
    info: 'border-[var(--nexus-info)] bg-[var(--nexus-info)]/10 text-[var(--nexus-info)]',
    issue: 'border-[var(--nexus-issue)] bg-[var(--nexus-issue)]/10 text-[var(--nexus-issue)]',
  };

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Operations</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--nexus-graphite)]">Recent Alerts</h2>
        </div>
        <a href="#" className="text-sm font-semibold text-[var(--nexus-purple)] hover:text-[var(--nexus-purple)]/80">
          View all →
        </a>
      </div>

      <div className="mt-6 space-y-4">
        {alerts.map((alert) => (
          <div key={alert.id} className={`rounded-[28px] border p-4 shadow-sm shadow-slate-200/20 ${typeStyles[alert.type]} bg-white`}>
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white flex-shrink-0">
                {alert.type === 'warning' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path d="M12 9v4M12 17h.01" />
                    <path d="M10 3h4l6 11-6 7H10L4 14 10 3z" />
                  </svg>
                ) : alert.type === 'issue' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-slate-900">{alert.title}</p>
                <p className="text-sm text-slate-600 mt-1">{alert.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
