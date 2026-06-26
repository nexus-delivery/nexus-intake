export default function ActiveRoutesPlaceholder() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Execution</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--nexus-graphite)]">Active Routes</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Current driver assignments and route progress from Track-POD integration.
          </p>
        </div>
        <span className="inline-flex rounded-2xl bg-[var(--nexus-purple)]/10 px-4 py-2 text-sm font-semibold text-[var(--nexus-purple)]">
          Placeholder
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((route) => (
          <div key={route} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/20">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-900">Route {100 + route}</p>
                <p className="text-sm text-slate-600 mt-1">Driver assigned</p>
              </div>
              <span className="inline-flex items-center rounded-full bg-[var(--nexus-success)]/10 px-2.5 py-1 text-xs font-semibold text-[var(--nexus-success)]">
                Active
              </span>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <p className="text-slate-600">Stops: <span className="font-semibold text-slate-900">12/18</span></p>
              <p className="text-slate-600">ETA: <span className="font-semibold text-slate-900">14:32</span></p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
