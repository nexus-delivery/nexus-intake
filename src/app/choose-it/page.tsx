import AppShell from "@/components/AppShell";

const marketplaceCards = [
  {
    section: "Installed Apps",
    items: ["Create it", "Process it", "Track it", "Route it", "Store it", "Account it", "Manage it", "Report it"],
  },
  {
    section: "Available Apps",
    items: ["Price it", "Notify it", "Integrate it", "Document it", "Communicate it"],
  },
  {
    section: "Coming Soon",
    items: ["Future AI Apps", "Advanced Reporting", "Warehouse", "Marketplace Billing"],
  },
];

const commercialCards = [
  { label: "Current Plan", value: "Scale" },
  { label: "Usage", value: "68% monthly allowance" },
  { label: "Billing", value: "Healthy" },
  { label: "Trials", value: "3 active trials" },
  { label: "Updates", value: "2 pending" },
  { label: "Release Notes", value: "Sprint 3A live" },
];

export default function ChooseItPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Marketplace</p>
          <h1 className="text-3xl font-semibold text-slate-950">Choose it</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Install, upgrade, and subscribe to NEXUS applications. Apps remain independently roadmap-ready while the user flow stays operationally focused.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {marketplaceCards.map((card) => (
            <article key={card.section} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{card.section}</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {card.items.map((item) => (
                  <li key={item} className="rounded-lg border border-slate-200 bg-white px-3 py-2">{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {commercialCards.map((card) => (
            <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-xs uppercase tracking-[0.12em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-sm font-semibold text-slate-900">{card.value}</p>
            </article>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
