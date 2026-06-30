import Link from "next/link";
import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "Book it",
    description: "Customer booking forms for fast, structured job requests.",
    href: "/booking-forms",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: "Enter it",
    description: "Manual job entry for operations teams handling bespoke requests.",
    href: "/order-input",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path d="M17.5 3.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
  },
  {
    title: "Upload it",
    description: "Document uploads that convert paperwork into dispatch-ready work.",
    href: "/portal/intake",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 5v10" />
        <path d="M8 11l4-4 4 4" />
        <path d="M8 19h8" />
      </svg>
    ),
  },
  {
    title: "Email it",
    description: "Convert inbound booking emails into jobs without re-keying details.",
    href: "/create-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 6h16v12H4z" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
  },
  {
    title: "Connect it",
    description: "Use API integrations to push jobs from external systems.",
    href: "/build-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M15 7h4v4" />
        <path d="M9 17H5v-4" />
        <path d="M19 7l-6 6" />
        <path d="M5 13l6-6" />
      </svg>
    ),
  },
  {
    title: "Import it",
    description: "CSV and spreadsheet imports for batch creation at scale.",
    href: "/portal/intake",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 7h16M4 12h12M4 17h8" />
      </svg>
    ),
  },
  {
    title: "Embed it",
    description: "Publish booking forms on your own website to capture demand directly.",
    href: "/booking-forms",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path d="M17.5 3.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
  },
  {
    title: "WooCommerce",
    description: "Commerce connector for storefront order intake automation.",
    href: "/build-it",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M6 7h12l-1 10H7L6 7z" />
        <path d="M9 7a3 3 0 116 0" />
      </svg>
    ),
  },
  {
    title: "Shopify",
    description: "Install when released to sync online store checkouts.",
    href: "/build-it",
    status: "available",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M6 20l1.2-12h9.6L18 20z" />
        <path d="M9 9c0-3 1.8-5 4-5s4 2 4 5" />
      </svg>
    ),
  },
  {
    title: "CSV",
    description: "Bulk spreadsheet intake templates for scheduled imports.",
    href: "/portal/intake",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 4h16v16H4z" />
        <path d="M4 9h16M9 4v16" />
      </svg>
    ),
  },
];

export default function CreateItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <div className="nexus-card rounded-[30px] p-7">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                  <path d="M12 5v14M5 12h14" />
                </svg>
              </div>
              <div>
                <p className="nexus-kicker">Create it</p>
                <h1 className="mt-1 text-4xl font-semibold text-slate-900">Choose how you'd like to create work.</h1>
                <p className="mt-1.5 text-sm text-slate-600">Each method below is an intake path inside the Create it product.</p>
              </div>
            </div>
            <div className="inline-flex h-10 items-center rounded-full border border-slate-200 bg-white p-1 text-sm">
              <button type="button" className="rounded-full bg-[var(--nexus-purple)] px-4 py-1 font-semibold text-white">
                Grid
              </button>
              <button type="button" className="rounded-full px-4 py-1 font-semibold text-slate-500">
                List
              </button>
            </div>
          </div>
        </div>

        <WorkspaceCardGrid items={sections} />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="nexus-card rounded-[24px] p-5">
            <p className="text-xl font-semibold text-slate-900">Quick actions</p>
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                "Create new job",
                "View today's jobs",
                "Upload document",
                "Track a job",
              ].map((action) => (
                <button
                  key={action}
                  type="button"
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-medium text-slate-600 transition hover:border-[#7C3AED]/40 hover:text-[#7C3AED]"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          <div className="nexus-card rounded-[24px] p-5">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-slate-900">Recent activity</p>
              <Link href="/orders" className="text-sm font-semibold text-[#7C3AED]">
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center justify-between">
                <span>12 new bookings received</span>
                <span>5m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>8 jobs updated</span>
                <span>15m ago</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Driver check-in: John D.</span>
                <span>32m ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
