import Link from "next/link";

const summaryCards = [
  { label: "Active Bookings", value: "128" },
  { label: "In-Transit Consignments", value: "46" },
  { label: "Delivered Today", value: "22" },
  { label: "Customers", value: "1,284" },
];

const recentBookings = [
  { id: "BK-20418", customer: "Hearthline Interiors", date: "26 Jun 2026", status: "In Transit" },
  { id: "BK-20409", customer: "Oakbridge Retail", date: "26 Jun 2026", status: "Out for Delivery" },
  { id: "BK-20397", customer: "Summit Foods", date: "25 Jun 2026", status: "Delivered" },
  { id: "BK-20381", customer: "Ridgeway Office", date: "25 Jun 2026", status: "Pending Pickup" },
];

const quickActions = [
  { label: "Create New Booking", href: "/portal/new-booking" },
  { label: "View My Bookings", href: "/portal/bookings" },
  { label: "Track Active Consignments", href: "/portal/tracking" },
  { label: "Open Document Centre", href: "/portal/documents" },
];

export default function MerchantPortalPage() {
  return (
    <div className="space-y-8">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-600">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--nexus-graphite)]">{card.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">Recent Bookings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Booking</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">{booking.id}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booking.customer}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{booking.date}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{booking.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <aside className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">Quick Actions</h2>
          <div className="mt-4 grid gap-3">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-[var(--nexus-graphite)] transition hover:border-purple-200 hover:bg-purple-50"
              >
                {action.label}
              </Link>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
