const csvRequirements = [
  "One row per booking or consignment line",
  "Customer name and destination required",
  "Booking reference optional",
  "Supports thousands of rows per import",
];

export default function CsvImportBookingPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">CSV Import</h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">
        Import bookings in bulk for high-volume customers and validate data before creating consignments.
      </p>

      <ul className="mt-6 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {csvRequirements.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--nexus-purple)]" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="mt-6 rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Upload CSV
      </button>
    </section>
  );
}
