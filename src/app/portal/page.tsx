import Link from "next/link";
import OrdersStatusBoard from "@/components/OrdersStatusBoard";
import OverseeSummaryPanel from "@/components/OverseeSummaryPanel";

const moduleCards = [
  { title: "Create-it", href: "/portal/create-it", detail: "Merchant order workspace for Deliver it, Return it, and Request it." },
  { title: "New Order", href: "/portal/book-it", detail: "Create a new order using shared intake services." },
  { title: "Booking Forms", href: "/portal/booking-forms", detail: "Deliver it, Return it, and Request it on one intake service." },
  { title: "Draft Orders", href: "/portal/draft-orders", detail: "Review staged bookings before operations handoff." },
  { title: "Orders", href: "/portal/orders", detail: "Live order lifecycle with Track-POD synchronized timeline visibility." },
  { title: "Manage-it", href: "/portal/manage-it", detail: "Company, users, customers, address books, settings and controls." },
  { title: "Public Booking Forms", href: "/portal/public-booking-forms", detail: "External forms routing into Create-it standard intake." },
  { title: "Booking Templates", href: "/portal/booking-templates", detail: "Reusable address books and operational defaults." },
  { title: "WooCommerce Imports", href: "/portal/woocommerce-imports", detail: "Deferred until Wodely replacement is fully live and stable." },
  { title: "OCR Upload", href: "/portal/ocr-upload", detail: "Upload Doorway documents, run OCR extraction, and review draft jobs." },
  { title: "Document Upload", href: "/portal/document-upload", detail: "Upload operational documents and continue directly to review." },
  { title: "Integrate-it", href: "/portal/integrate-it", detail: "Manage provider connections and tenant-scoped integration configuration." },
  { title: "Documents", href: "/portal/documents", detail: "Upload and manage operational/customer documents." },
  { title: "Reports", href: "/portal/reports", detail: "Company-scoped reporting and exports." },
  { title: "Settings", href: "/portal/settings", detail: "Portal preferences, access, and defaults." },
];

export default function MerchantPortalPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Merchant Portal Dashboard</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Merchant admins can manage customers, create bookings, and monitor orders for their own company only.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {moduleCards.map((card) => (
            <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-[#7C3AED] hover:bg-white">
              <p className="text-lg font-semibold text-slate-900">{card.title}</p>
              <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
            </Link>
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          NEXUS is the system of record for intake, customer management, address books, and order visibility across all source channels.
        </div>
      </section>

      <OverseeSummaryPanel scope="merchant" />

      <OrdersStatusBoard
        scope="merchant"
        title="Merchant Oversee it"
        subtitle="Only your own orders, review items, accepted work, planning, transit, delivered state, tracking links, and operational updates."
      />
    </div>
  );
}
