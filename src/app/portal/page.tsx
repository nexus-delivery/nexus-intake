import Link from "next/link";
import CommunicationsComingSoon from "@/components/CommunicationsComingSoon";
import OrdersStatusBoard from "@/components/OrdersStatusBoard";
import OverseeSummaryPanel from "@/components/OverseeSummaryPanel";

const moduleCards = [
  { title: "Create it", href: "/portal/create-it", detail: "Start a new booking or move straight into merchant intake." },
  { title: "Oversee it", href: "/portal/orders", detail: "Today's orders, status counts, filters, Track-POD links, and pagination." },
  { title: "Manage it", href: "/portal/manage-it", detail: "Customers, addresses, workspaces, users, and merchant controls." },
  { title: "Reports", href: "/portal/reports", detail: "Merchant reporting and exports." },
  { title: "Settings", href: "/portal/settings", detail: "Portal defaults, access, and configuration." },
  { title: "Documents", href: "/portal/documents", detail: "Access uploaded paperwork and supporting files." },
];

export default function MerchantPortalPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
          <h1 className="text-3xl font-semibold text-slate-950">Merchant Portal Dashboard</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Merchant admins can create bookings, oversee today's work, and manage their own workspace without scrolling through months of history.
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
        subtitle="Today-first merchant operations with Track-POD links, focused filters, and pagination."
      />

      <CommunicationsComingSoon subtitle="Merchant-facing communication tools are placeholder-only for now." />
    </div>
  );
}
