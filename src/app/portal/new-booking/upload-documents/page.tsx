const supportedFormats = ["PDF shipping instructions", "Delivery images", "Manifest documents", "Supplier paperwork"];

export default function UploadDocumentsBookingPage() {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-semibold text-[var(--nexus-graphite)]">Upload Documents</h2>
      <p className="mt-2 text-sm text-slate-600 sm:text-base">
        Upload files to start a booking draft. NEXUS will guide you through customer details and consignment setup.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {supportedFormats.map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            {item}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-6 rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Upload Files
      </button>
    </section>
  );
}
