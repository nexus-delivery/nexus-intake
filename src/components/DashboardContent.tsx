import LiveOperationsDashboard from '@/components/LiveOperationsDashboard';
import WorkflowStageBanner from '@/components/WorkflowStageBanner';

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <WorkflowStageBanner
        currentStage="review"
        orderStatus="Operational oversight across all stages"
        nextRequiredAction="Resolve queue blockers and progress orders to Process it"
      />

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Today's activity</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">246 events</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Orders</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">184 live</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Exceptions</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">5 active</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Notifications</p>
          <p className="mt-1 text-xl font-semibold text-slate-900">12 unread</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
          <p className="text-xs font-semibold uppercase text-slate-500">Live operational status</p>
          <p className="mt-1 text-xl font-semibold text-emerald-700">Stable</p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Search</p>
        <form action="/manage-it/search-it" method="get" className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            name="q"
            type="search"
            placeholder="Search order ref, customer, route, or invoice"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white">
            Search Operations
          </button>
        </form>
      </section>

      <LiveOperationsDashboard />
    </div>
  );
}
