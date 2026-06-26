import AppShell from "@/components/AppShell";

const customers = [
  {
    companyName: "Doorway Group LTD",
    tradingName: null,
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
  },
  {
    companyName: "DI Designs LTD",
    tradingName: null,
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
  },
  {
    companyName: "BLB Group LTD",
    tradingName: "Nook Home",
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
  },
];

export default function CustomersPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Customers</p>
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">Customer network</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Active customers with order input method, documents and orders summary. Operations users can open each customer’s portal view — placeholder only.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20">
              {customers.length} customers active
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {customers.map((customer) => (
              <article
                key={customer.companyName}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-950">{customer.companyName}</p>
                    {customer.tradingName ? (
                      <p className="text-sm text-slate-500">Trading as {customer.tradingName}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {customer.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Order Input Method</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {customer.intakeType}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Documents</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{customer.documentsCount}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Orders</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{customer.ordersCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-2xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]"
                  >
                    View as Customer
                  </button>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Upload PDF
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">Operations users can open each customer’s portal view. This is a placeholder only.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
