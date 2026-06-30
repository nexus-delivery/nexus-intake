import Link from "next/link";
import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "Stock Management",
    description: "View current stock levels, locations and movement history.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 8l8-5 8 5v11H4V8z" />
        <path d="M12 3v18" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    title: "Inventory Count",
    description: "Conduct and record physical inventory counts and audits.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 7h16M4 12h12M4 17h8" />
      </svg>
    ),
  },
  {
    title: "Locations",
    description: "Manage warehouse locations, zones, bays and shelf positions.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Goods In",
    description: "Receive and log inbound stock from suppliers and returns.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M16 16l-4 4-4-4" />
        <path d="M12 12v8" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
  {
    title: "Goods Out",
    description: "Process outbound despatch and confirm collections from warehouse.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M8 16l4-4 4 4" />
        <path d="M12 12V4" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
  {
    title: "Returns",
    description: "Handle customer returns, damage reports and reverse logistics.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    ),
  },
];

export default function StoreItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Storage operations"
          title="Store it"
          description="Coordinate warehouse, inventory, documents and media from one storage workspace."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M4 8l8-5 8 5v11H4V8z" />
              <path d="M12 3v18" />
              <path d="M8 12h8" />
            </svg>
          }
        />

        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
