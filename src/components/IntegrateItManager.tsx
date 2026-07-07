export default function IntegrateItManager() {
  const providers = [
    { name: "WooCommerce", description: "Commerce order ingestion" },
    { name: "Track-POD", description: "Dispatch and POD sync" },
    { name: "Xero", description: "Accounting export" },
    { name: "Stripe", description: "Payments and reconciliation" },
    { name: "Airtable", description: "Operational data bridge" },
    { name: "QuickFile", description: "Accounting export" },
    { name: "Resend", description: "Operational email notifications" },
  ];

  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Integrate it</p>
        <h1 className="text-3xl font-semibold text-slate-950">Integration Management</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Placeholder-only integration area. Provider setup and connection workflows are intentionally disabled for now.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {providers.map((provider) => (
          <article key={provider.name} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-lg font-semibold text-slate-900">{provider.name}</p>
            <p className="mt-1 text-sm text-slate-600">{provider.description}</p>
            <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-3 py-3 text-sm font-semibold text-slate-500">
              Coming Soon
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
