const consignments = [
  { id: "CN-77391", booking: "BK-20418", customer: "Hearthline Interiors", status: "In Transit" },
  { id: "CN-77387", booking: "BK-20412", customer: "Harborview Electronics", status: "Pending Pickup" },
  { id: "CN-77374", booking: "BK-20401", customer: "Summit Foods", status: "Delivered" },
  { id: "CN-77352", booking: "BK-20388", customer: "Northpoint Medical", status: "Out for Delivery" },
];

export default function TrackingPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">Live Consignment Tracking</h2>
        <p className="mt-1 text-sm text-slate-600">Real-time status updates for active consignments.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Consignment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Booking</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {consignments.map((consignment) => (
              <tr key={consignment.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">{consignment.id}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{consignment.booking}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{consignment.customer}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{consignment.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
