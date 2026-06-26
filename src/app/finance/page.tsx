import AppShell from "@/components/AppShell";

const mock = [
  { title: "Invoices", value: "$24,120" },
  { title: "Payments", value: "$18,900" },
  { title: "Cashflow", value: "$5,220" },
  { title: "Factoring", value: "$12,000" },
  { title: "Xero", value: "Connected" },
  { title: "Reports", value: "3 available" },
];

export default function FinancePage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Finance</p>
          <h1 className="text-3xl font-semibold text-slate-950">Finance dashboard (placeholder)</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Mock overview of invoices, payments and cashflow. Replace with real data later.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {mock.map((m) => (
            <div key={m.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm text-slate-500">{m.title}</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">{m.value}</p>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
