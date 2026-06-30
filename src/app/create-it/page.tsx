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
    status: "coming-soon",
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
        <WorkspaceHero
          kicker="Create actions"
          title="Choose how you'd like to create work."
          description="Each method is an installable intake path inside the Create it product."
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
            className="group inline-flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-[#7C3AED]/30 hover:text-[#7C3AED]"
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
