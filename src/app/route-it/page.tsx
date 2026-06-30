import Link from "next/link";
import AppShell from "@/components/AppShell";

const workflowStates = [
  "Book it",
  "Check it",
  "Process it",
  "Move it / Route it",
  "Planning",
  "Routing",
  "Driver allocation",
  "Collection + Delivery execution",
  "Sent to Track-POD",
  "Tracking Available",
  "Track it",
  "Invoice it",
  "See it",
];

export default function RouteItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M3 12h18" />
                <path d="M8 7l-5 5 5 5" />
                <path d="M16 7l5 5-5 5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Route IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Move it / Route it handles planning, routing, driver allocation and movement execution.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Operational Flow</p>
          <p className="mt-2 text-sm text-slate-600">
            Process it creates Track-POD collection and delivery orders, stores IDs/tracking links, and marks jobs ready for planning.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {workflowStates.map((state) => (
              <div
                key={state}
                className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
              >
                {state}
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/portal/intake"
              className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              Review Job
            </Link>
            <Link
              href="/portal/intake"
              className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              Create Job
            </Link>
            <Link
              href="/portal/intake"
              className="rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]"
            >
              Send to Track-POD
            </Link>
            <Link
              href="/track-it"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#111827] hover:bg-slate-50"
            >
              Track it
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
