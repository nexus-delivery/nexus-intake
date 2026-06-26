const fields = [
  "Customer name",
  "Delivery address",
  "Contact details",
  "Booking references",
  "Consignment quantity",
  "Service date",
];

export default function ManualEntryBookingPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">Manual Entry</h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">
        Enter booking details directly and add one or more consignments before submission.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field} className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{field}</span>
            <input
              type="text"
              placeholder={`Enter ${field.toLowerCase()}`}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-[var(--nexus-graphite)]"
            />
          </label>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Save Booking Draft
      </button>
    </section>
  );
}
