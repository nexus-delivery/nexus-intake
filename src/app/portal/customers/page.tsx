import Link from "next/link";

const customers = [
  {
    name: "Hearthline Interiors",
    contact: "ops@hearthline.co.uk",
    address: "11 Camden Rise, London",
    bookings: 214,
  },
  {
    name: "Oakbridge Retail",
    contact: "dispatch@oakbridge.com",
    address: "Warehouse 3, Birmingham",
    bookings: 173,
  },
  {
    name: "Northpoint Medical",
    contact: "deliveries@northpoint.co",
    address: "2 Riverside Court, Leeds",
    bookings: 89,
  },
];

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">Customer Directory</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Manage saved customers, delivery addresses, contacts, booking history, and create new bookings quickly.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Contact</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Primary Address</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Bookings</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {customers.map((customer) => (
                <tr key={customer.name} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-sm font-medium text-[var(--nexus-graphite)]">{customer.name}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.contact}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.address}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{customer.bookings}</td>
                  <td className="px-6 py-4 text-sm">
                    <Link href="/portal/new-booking" className="font-medium text-[var(--nexus-purple)] hover:underline">
                      New Booking
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
