import Link from "next/link";

const bookingMethods = [
  {
    title: "Upload Documents",
    description: "Upload PDFs, images, and manifests to begin a booking.",
    href: "/portal/new-booking/upload-documents",
    available: true,
  },
  {
    title: "Manual Entry",
    description: "Create bookings with a guided form for customer and consignment details.",
    href: "/portal/new-booking/manual-entry",
    available: true,
  },
  {
    title: "CSV Import",
    description: "Bulk-create bookings from spreadsheet uploads.",
    href: "/portal/new-booking/csv-import",
    available: true,
  },
  {
    title: "Store Import",
    description: "Connect store channels and ingest booking requests automatically.",
    href: "/portal/new-booking/store-import",
    available: false,
  },
  {
    title: "API Integration",
    description: "Send bookings directly from your systems into NEXUS.",
    href: "/portal/new-booking/api-integration",
    available: false,
  },
];

export default function NewBookingPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">Create a New Booking</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Choose how you want to create bookings for your customers. Every booking can include one or more consignments.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {bookingMethods.map((method) => (
          <Link
            key={method.title}
            href={method.href}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-purple-200 hover:bg-purple-50"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--nexus-purple)]">
              {method.available ? "Available" : "Coming Soon"}
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[var(--nexus-graphite)]">{method.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{method.description}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
