import Link from "next/link";

const moduleCards = [
  { title: "Book Create-it", href: "/portal/book-it", detail: "Create merchant bookings with customer defaults and intake controls." },
  { title: "Orders", href: "/portal/orders", detail: "Live order lifecycle with Track-POD synchronized timeline visibility." },
  { title: "Customers", href: "/portal/customers", detail: "Manage customers, contacts, defaults, pricing profiles, and invites." },
  { title: "Integrate-it", href: "/portal/integrate-it", detail: "Manage provider connections and tenant-scoped integration configuration." },
  { title: "Documents", href: "/portal/documents", detail: "Upload and manage operational/customer documents." },
  { title: "Reports", href: "/portal/reports", detail: "Company-scoped reporting and exports." },
  { title: "Settings", href: "/portal/settings", detail: "Portal preferences, access, and defaults." },
];

export default function MerchantPortalPage() {
  return (
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
        NEXUS is the system of record for intake, customer management, and order visibility across all source channels.
      </div>
    </section>
  );
}
