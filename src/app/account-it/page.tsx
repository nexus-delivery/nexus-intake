import Link from "next/link";
import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "Company Profile",
    description: "Set up your company details, branding, contact information and notification preferences.",
    href: "/account-it/company-profile",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
      </svg>
    ),
  },
  {
    title: "POD Settings",
    description: "Configure branded proof of delivery — logo, header, footer, wording and disclaimers.",
    href: "/account-it/pod-settings",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    title: "Terms Library",
    description: "Manage your T&Cs and disclaimers. Add, edit, approve and select terms for generic PODs.",
    href: "/account-it/terms-library",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M9 12h6M9 16h6M9 8h6M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
      </svg>
    ),
  },
  {
    title: "Customers",
    description: "View and manage customer records, contacts and delivery history.",
    href: "/customers",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
      </svg>
    ),
  },
  {
    title: "Companies",
    description: "Manage company accounts, contracts and account-level settings.",
    href: "/customers",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 21h18" />
        <path d="M5 21V7l8-4v18" />
        <path d="M19 21V11l-6-4" />
        <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" />
      </svg>
    ),
  },
  {
    title: "Finance",
    description: "Track invoices, approvals, billing status and account balances.",
    href: "/finance",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 3v18" />
        <path d="M7 8h10" />
        <path d="M7 16h10" />
        <path d="M17 4h2a2 2 0 012 2v2" />
        <path d="M7 20H5a2 2 0 01-2-2v-2" />
      </svg>
    ),
  },
  {
    title: "Contacts",
    description: "Individual contact records linked to companies and delivery addresses.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M16 21v-2a4 4 0 00-8 0v2" />
        <circle cx="12" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    title: "Workspace access",
    description: "Configure customer-facing workspace access for creating and tracking work.",
    href: "/portal",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: "Credit Control",
    description: "Manage credit limits, overdue accounts and payment terms.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

export default function AccountItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Commercial control"
          title="Account it"
          description="Manage company settings, billing controls, commercial terms and account governance."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
              <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
            </svg>
          }
        />

        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
