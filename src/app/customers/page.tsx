import AppShell from "@/components/AppShell";
import Link from "next/link";

const merchants = [
  {
    companyName: "Doorway Group LTD",
    tradingName: null,
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
    href: "/customers/doorway-group",
  },
  {
    companyName: "DI Designs LTD",
    tradingName: null,
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
    href: "/customers/di-designs",
  },
  {
    companyName: "BLB Group LTD",
    tradingName: "Nook Home",
    status: "Active",
    intakeType: "PDF Upload",
    documentsCount: "—",
    ordersCount: "—",
    href: "/customers/nook-home",
  },
];

export default function MerchantsPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Merchants</p>
              <div>
                <h1 className="text-3xl font-semibold text-slate-950">Merchant network</h1>
                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Active merchants and shippers with order input method, documents, and order summary. Operations users can open each merchant portal view — placeholder only.
                </p>
              </div>
            </div>

            <div className="inline-flex items-center rounded-3xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-slate-950/20">
              {merchants.length} merchants active
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {merchants.map((merchant) => (
              <article
                key={merchant.companyName}
                className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <p className="text-base font-semibold text-slate-950">{merchant.companyName}</p>
                    {merchant.tradingName ? (
                      <p className="text-sm text-slate-500">Trading as {merchant.tradingName}</p>
                    ) : null}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                    {merchant.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-3">
                  <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                    <div className="flex items-center justify-between gap-4 text-sm text-slate-700">
                      <span className="font-medium text-slate-900">Order Input Method</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                        {merchant.intakeType}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
                    <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Documents</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{merchant.documentsCount}</p>
                    </div>
                    <div className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/30">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Orders</p>
                      <p className="mt-2 text-lg font-semibold text-slate-950">{merchant.ordersCount}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={merchant.href}
                    className="inline-flex justify-center rounded-2xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]"
                  >
                    View merchant portal
                  </Link>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Upload PDF
                  </button>
                </div>
                <p className="mt-3 text-xs text-slate-500">Operations users can open each merchant portal view. This is a placeholder only.</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
