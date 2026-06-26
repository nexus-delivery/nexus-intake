import AppShell from "@/components/AppShell";

export default function ReportsPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Reports</p>
          <h1 className="text-3xl font-semibold text-slate-950">Reports</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Placeholder reports area. Mock data only.</p>
        </div>
      </section>
    </AppShell>
  );
}
