const documents = [
  {
    name: "BK-20418 Collection Manifest.pdf",
    booking: "BK-20418",
    consignment: "CN-77391",
    type: "Manifest",
  },
  {
    name: "CN-77374 POD.pdf",
    booking: "BK-20401",
    consignment: "CN-77374",
    type: "POD",
  },
  {
    name: "BK-20388 Invoice.pdf",
    booking: "BK-20388",
    consignment: "—",
    type: "Invoice",
  },
];

export default function DocumentsPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">Document Centre</h2>
        <p className="mt-1 text-sm text-slate-600">Centralized document storage for bookings and consignments.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Document</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Booking</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Consignment</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((document) => (
              <tr key={document.name} className="hover:bg-slate-50">
                <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">{document.name}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{document.booking}</td>
                <td className="px-6 py-4 text-sm text-slate-600">{document.consignment}</td>
                <td className="px-6 py-4 text-sm text-slate-700">{document.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
