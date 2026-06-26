import DashboardCard from "@/components/DashboardCard";

type DashboardCardData = {
  title: string;
  value: string;
  label: string;
  accent: "slate" | "blue" | "green" | "amber" | "rose" | "indigo";
};

export default function DashboardContent() {
  const cards: DashboardCardData[] = [
    { title: "Orders Today", value: "198", label: "+12%", accent: "blue" },
    { title: "Awaiting Validation", value: "34", label: "Review", accent: "amber" },
    { title: "Ready for Operations", value: "72", label: "Ready", accent: "green" },
    { title: "Collections Today", value: "56", label: "In progress", accent: "indigo" },
    { title: "Deliveries Today", value: "124", label: "On route", accent: "slate" },
    { title: "Exceptions", value: "8", label: "Alerts", accent: "rose" },
  ];

  return (
    <section className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Overview</p>
              <h2 className="mt-3 text-3xl font-semibold text-slate-950">NEXUS dispatch command center</h2>
            </div>
            <div className="rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm">
              iPad-ready control room
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Live load factor</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">82%</p>
            </div>
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Active carriers</p>
              <p className="mt-3 text-2xl font-semibold text-slate-950">14</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Activity</p>
            <p className="mt-4 text-2xl font-semibold text-slate-950">Ready for peak dispatch</p>
            <p className="mt-3 text-sm text-slate-600">
              Monitor key intake stages and keep the operation moving with clear task status.
            </p>
          </div>
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Summary</p>
            <div className="mt-5 space-y-3">
              <p className="text-sm text-slate-600">Orders are flowing from booking forms and customer feeds today.</p>
              <p className="text-sm text-slate-600">Exceptions are low, with validation and operations teams aligned.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          <DashboardCard
            key={card.title}
            title={card.title}
            value={card.value}
            label={card.label}
            accent={card.accent}
          />
        ))}
      </div>
    </section>
  );
}
