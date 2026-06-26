const bookings = [
  { id: "BK-20418", customer: "Hearthline Interiors", consignments: 3, date: "26 Jun 2026", status: "In Transit" },
  { id: "BK-20412", customer: "Harborview Electronics", consignments: 1, date: "26 Jun 2026", status: "Pending Pickup" },
  { id: "BK-20401", customer: "Summit Foods", consignments: 4, date: "25 Jun 2026", status: "Delivered" },
  { id: "BK-20388", customer: "Northpoint Medical", consignments: 2, date: "25 Jun 2026", status: "Out for Delivery" },
];

export default function MyBookingsPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">All Bookings</h2>
        <p className="mt-1 text-sm text-slate-600">Track every booking created for your customers.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Booking</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Consignments</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {bookings.map((booking) => (
              <tr key={booking.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">{booking.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{booking.customer}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{booking.consignments}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{booking.date}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{booking.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
