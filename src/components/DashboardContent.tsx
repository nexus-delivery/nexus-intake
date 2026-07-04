import Link from 'next/link';
import LiveOperationsDashboard from '@/components/LiveOperationsDashboard';
import WorkflowStageBanner from '@/components/WorkflowStageBanner';

const primaryModules = [
  { label: 'Create it', href: '/create-it', detail: 'Booking and intake orchestration' },
  { label: 'Process it', href: '/process-it', detail: 'Review, route, dispatch and track workflow' },
  { label: 'Oversee it', href: '/manage-it', detail: 'Admin control centre for merchants and CRM' },
  { label: 'Account it', href: '/account-it', detail: 'Finance workspace and invoice operations' },
  { label: 'Store it', href: '/store-it', detail: 'Inventory and warehouse operations' },
  { label: 'Report it', href: '/report-it', detail: 'Operational reporting and KPI analysis' },
  { label: 'Improve it', href: '/improve-it', detail: 'Continuous improvement and optimisation' },
];

export default function DashboardContent() {
  return (
    <div className="space-y-6">
      <WorkflowStageBanner
        currentStage="review"
        orderStatus="Operational oversight across all stages"
        nextRequiredAction="Resolve queue blockers and progress orders to Process it"
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Primary Modules</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {primaryModules.map((module) => (
            <Link
              key={module.label}
              href={module.href}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 transition hover:border-[#7C3AED]/40 hover:bg-white"
            >
              <p className="text-sm font-semibold text-slate-900">{module.label}</p>
              <p className="mt-1 text-xs text-slate-600">{module.detail}</p>
            </Link>
          ))}
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
