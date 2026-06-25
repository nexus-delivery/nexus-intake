import AppShell from "@/components/AppShell";

export default function ConsignmentsPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Consignments</p>
          <h1 className="text-3xl font-semibold text-slate-950">Consignment pipeline</h1>
        </div>
        <p className="text-sm text-slate-600">
          Placeholder for the consignment lifecycle view. This area will display planning and delivery status.
        </p>
      </section>
    </AppShell>
  );
}
