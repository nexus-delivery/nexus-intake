import AppShell from "@/components/AppShell";
import { WorkspaceCardGrid, WorkspaceHero } from "@/components/WorkspaceDesignSystem";

const sections = [
  {
    title: "My Documents",
    description: "Merchant-scoped document library for uploads and POD evidence.",
    href: "/portal/documents",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  {
    title: "OCR Upload",
    description: "Coming soon. Manual and OCR-assisted upload flows will be added later.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: "PODs",
    description: "Proof of delivery evidence linked back to the order timeline.",
    href: "/portal/documents",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <path d="M10 14l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: "Invoices",
    description: "Merchant invoice documents and export hand-off views.",
    href: "/customer/invoices",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 3v18" />
        <path d="M7 8h10" />
        <path d="M7 16h10" />
      </svg>
    ),
  },
  {
    title: "Collections",
    description: "Collection-side paperwork and dispatch records.",
    href: "/portal/documents",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 3h18v18H3z" />
        <path d="M7 7h10M7 11h10M7 15h6" />
      </svg>
    ),
  },
  {
    title: "Deliveries",
    description: "Delivery-side documentation and customer handover records.",
    href: "/portal/documents",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M5 12h14" />
        <path d="M13 5l7 7-7 7" />
      </svg>
    ),
  },
];

export default function DocumentItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkspaceHero
          kicker="Documents"
          title="Document it"
          description="The document layer for merchants and administrators. OCR and enhanced upload flows come later; the structure is here now."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
          }
        />
        <WorkspaceCardGrid items={sections} />
      </div>
    </AppShell>
  );
}
