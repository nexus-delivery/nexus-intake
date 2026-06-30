import Link from "next/link";
import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "Performance Reports",
    description: "Key performance metrics across deliveries, drivers and routes.",
    href: "/reports",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 6h16" />
        <path d="M7 6v12" />
        <path d="M12 10v8" />
        <path d="M17 14v4" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    title: "Daily Summary",
    description: "End-of-day summary report for deliveries completed, failed and outstanding.",
    href: "/reports",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Driver Reports",
    description: "Individual driver performance, mileage and delivery completion rates.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M5 20h14" />
        <path d="M8 20a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z" />
        <path d="M6 16l1-5h10l1 5" />
        <path d="M7 11V8a2 2 0 012-2h6a2 2 0 012 2v3" />
      </svg>
    ),
  },
  {
    title: "Finance Reports",
    description: "Revenue, invoice ageing, outstanding balances and payment summaries.",
    href: "#",
    status: "coming-soon",
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
    title: "Customer Reports",
    description: "Delivery history, SLA compliance and customer activity summaries.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
      </svg>
    ),
  },
  {
    title: "Export Data",
    description: "Export reports in CSV, Excel and PDF formats for external analysis.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
];

export default function ReportItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Performance intelligence"
          title="Report it"
          description="Build operational reporting, analytics and business intelligence from live workflow data."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M4 6h16" />
              <path d="M7 6v12" />
              <path d="M12 10v8" />
              <path d="M17 14v4" />
              <path d="M4 18h16" />
            </svg>
          }
        />

        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
