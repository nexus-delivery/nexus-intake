import Link from "next/link";

const moduleCards = [
  { title: "Book it", href: "/portal/book-it", detail: "Create the Doorway demo booking and any future merchant booking." },
  { title: "Orders", href: "/portal/orders", detail: "Review bookings before they progress to Track-POD." },
  { title: "Track it", href: "/portal/track-it", detail: "Open tracking and delivery visibility." },
  { title: "Documents", href: "/portal/documents", detail: "Upload, store, and retrieve source files and PODs." },
  { title: "Customers", href: "/portal/customers", detail: "View merchant and customer accounts." },
  { title: "Catalogue it", href: "/portal/catalogue-it", detail: "Merchant catalogue for products and services." },
  { title: "Price it", href: "/portal/price-it", detail: "Commercial pricing foundation by merchant and catalogue item." },
  { title: "Market it", href: "/portal/market-it", detail: "Placeholder navigation for future merchant growth workflows." },
  { title: "Notify it", href: "/portal/notify-it", detail: "Placeholder module foundation for internal communication." },
  { title: "Discuss it", href: "/portal/discuss-it", detail: "Placeholder module foundation for an operational timeline." },
  { title: "Settings", href: "/portal/settings", detail: "Portal preferences, access, and defaults." },
];

export default function MerchantPortalPage() {
  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
        <h1 className="text-3xl font-semibold text-slate-950">Merchant Portal Dashboard</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Doorway can book work, review orders, open tracking, and return to Workspace from every module.
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
        Merchant defaults are loaded from the current company. Sales channels are learned over time and reused in future bookings.
      </div>
    </section>
  );
}
