import AppShell from "@/components/AppShell";
import { WorkspaceInfoStrip } from "@/components/WorkspaceDesignSystem";

export default function GetItPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[28px] border border-slate-200 bg-white p-7 shadow-sm shadow-slate-200/30">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Future Module</p>
          <h1 className="text-3xl font-semibold text-slate-950">Get it</h1>
          <p className="text-sm text-slate-600">
            Inactive placeholder for the future Create it, Send it, Track it, Get it workflow.
          </p>
        </header>

        <WorkspaceInfoStrip
          title="Inactive by plan"
          description="No workflows are enabled in Get it yet. Current delivery focus remains replacing Wodely integrations with WooCommerce and other intake forms, then stabilizing Track-POD handoff."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <circle cx="12" cy="12" r="9" />
              <path d="M9 9l6 6M15 9l-6 6" />
            </svg>
          }
        />
      </section>
    </AppShell>
  );
}
