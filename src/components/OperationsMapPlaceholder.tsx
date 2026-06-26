export default function OperationsMapPlaceholder() {
  return (
    <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Live Visibility</p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--nexus-graphite)]">Operations Map</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Real-time vehicle positions and delivery areas. Google Maps integration ready.
          </p>
        </div>
        <span className="inline-flex rounded-2xl bg-[var(--nexus-purple)]/10 px-4 py-2 text-sm font-semibold text-[var(--nexus-purple)]">
          Placeholder
        </span>
      </div>

      <div className="mt-6 relative overflow-hidden rounded-[28px] bg-gradient-to-br from-slate-100 to-slate-200 p-6 shadow-sm shadow-slate-200/30 h-96">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(124,58,237,0.08),transparent_50%),radial-gradient(circle_at_80%_80%,rgba(59,130,246,0.08),transparent_50%)]" />
        <div className="relative h-full rounded-[24px] bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200/50 flex items-center justify-center">
          <div className="text-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-16 w-16 mx-auto text-slate-400 mb-4">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
              <path d="M12 6v6l4 2.5" />
            </svg>
            <p className="text-slate-600 font-semibold">Map data will load here</p>
            <p className="text-sm text-slate-500 mt-2">Connect live location API to display vehicles</p>
          </div>
        </div>
      </div>
    </div>
  );
}
