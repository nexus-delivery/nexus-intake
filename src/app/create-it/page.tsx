import Link from "next/link";
import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

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
    title: "Connect it",
    description: "Use API integrations to push jobs from third-party systems.",
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
    title: "Sync it",
    description: "Sync commerce channels including WooCommerce and Shopify.",
    href: "/build-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 12a9 9 0 0115.55-6.36" />
        <path d="M21 3v6h-6" />
        <path d="M21 12a9 9 0 01-15.55 6.36" />
        <path d="M3 21v-6h6" />
      </svg>
    ),
  },
];

export default function CreateItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Create actions"
          title="Create it"
          description="Every way your team creates work, from booking forms to deep integrations."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M12 5v14M5 12h14" />
            </svg>
          }
        />

        <WorkspaceCardGrid items={sections} />
        <div className="nexus-surface rounded-[24px] p-5">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            Common setup
          </p>
          <Link
            href="/account-it/pod-settings"
            className="group inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-200 shadow-sm transition hover:border-[#7C3AED]/30 hover:text-[#A78BFA]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-[#7C3AED]">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
            </svg>
            Configure POD settings
            <span className="ml-auto opacity-0 transition-opacity group-hover:opacity-100">→</span>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
