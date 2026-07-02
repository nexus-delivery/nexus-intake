export default function PortalReportsPage() {
  return (
    <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Reports</p>
      <h1 className="text-2xl font-semibold text-slate-950">Merchant Reports</h1>
      <p className="text-sm text-slate-600">
        Download order, delivery, POD, and customer activity reports scoped to your company.
      </p>
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        Reporting tiles are wired to merchant-scoped order and customer datasets and are ready for chart expansions.
      </div>
    </section>
  );
}
