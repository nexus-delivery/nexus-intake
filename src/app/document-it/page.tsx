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

        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Framework</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">All Merchant Documents</h2>
          <p className="mt-1 text-sm text-slate-600">Framework view for cross-merchant document operations. Advanced OCR remains coming soon.</p>

          <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {[
                    "Status",
                    "Merchant",
                    "Customer",
                    "Collection",
                    "Delivery Postcode",
                    "Route Date",
                    "ETA",
                    "Order Number",
                    "Document Type",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                <tr>
                  <td className="px-3 py-2">Coming Soon</td>
                  <td className="px-3 py-2">All merchants</td>
                  <td className="px-3 py-2">All customers</td>
                  <td className="px-3 py-2">Collection address</td>
                  <td className="px-3 py-2">Postcode</td>
                  <td className="px-3 py-2">Route date</td>
                  <td className="px-3 py-2">ETA</td>
                  <td className="px-3 py-2">Order number</td>
                  <td className="px-3 py-2">POD/Invoice/Other</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="rounded border border-slate-200 px-2 py-1">Call</span>
                      <span className="rounded border border-slate-200 px-2 py-1">Email</span>
                      <span className="rounded border border-slate-200 px-2 py-1">WhatsApp</span>
                      <span className="rounded border border-slate-200 px-2 py-1">View Order</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
