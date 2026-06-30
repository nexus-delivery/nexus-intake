import Link from "next/link";
import AppShell from "@/components/AppShell";

const customer = {
  companyName: "DI Designs LTD",
  tradingName: null,
  status: "Active",
  owner: "Marcus Shaw",
  nextDelivery: "Today, 13:30",
  portalMethod: "PDF upload and portal request",
};

const orderMethods = [
  { label: "PDF Upload", value: "Preferred" },
  { label: "Dedicated order email", value: "Active" },
  { label: "Workspace requests", value: "Available" },
];

const documents = [
  { name: "Order confirmation #129", date: "Today", status: "Ready" },
  { name: "Invoice #1112", date: "Jun 22", status: "Sent" },
  { name: "Packing list #44", date: "Jun 19", status: "Done" },
];

const deliveries = [
  { name: "Cardiff stock run", date: "Jun 26", status: "In transit" },
  { name: "Edinburgh retail drop", date: "Jun 25", status: "Delivered" },
  { name: "Birmingham handover", date: "Jun 24", status: "Completed" },
];

const trackingInfo = {
  currentStatus: "Live Tracking",
  trackingLink: "https://nexus.delivery/track/placeholder",
  provider: "Track-POD",
  trackingUrl: "https://track-pod.example/track/2291",
  lastSync: "Just now",
  deliveryId: "DEL-2291",
  collectionId: "COL-942",
};

// TODO: Import Track-POD tracking URL
// TODO: Import delivery status and ETA
// TODO: Import POD
// TODO: Notify customer, merchant, collection point
// TODO: Generate branded NEXUS tracking emails

const trackingEvents = [
  { label: "Driver allocated", time: "3 min ago" },
  { label: "Vehicle loaded", time: "7 min ago" },
  { label: "Out for delivery", time: "In progress" },
  { label: "Delivered", time: "Pending" },
];

const supportNotes = [
  "Please keep package labels in plain English.",
  "Confirm next delivery slot before 09:00 on Monday.",
  "Customer wants delivery alerts by email.",
];

export default function DiDesignsPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Customer portal</p>
            <h1 className="text-3xl font-semibold text-slate-950">DI Designs LTD</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Mock customer portal view for deliveries, documents, tracking and support notes.
            </p>
          </div>
          <Link
            href="/customers"
            className="inline-flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
          >
            Back to Customers
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Summary</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">Customer summary</h2>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">
                  {customer.status}
                </span>
              </div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/30">
                  <p className="text-sm text-slate-500">Account owner</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{customer.owner}</p>
                </div>
                <div className="rounded-3xl bg-white p-5 shadow-sm shadow-slate-200/30">
                  <p className="text-sm text-slate-500">Next delivery</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{customer.nextDelivery}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Order input methods</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                {orderMethods.map((method) => (
                  <div key={method.label} className="rounded-3xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-950">{method.label}</p>
                    <p className="mt-2 text-sm text-slate-600">{method.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-2">
              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent documents</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Last 7 days</span>
                </div>
                <div className="mt-4 space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.name} className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{doc.name}</p>
                          <p className="text-sm text-slate-500">{doc.date}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent deliveries</p>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Latest activity</span>
                </div>
                <div className="mt-4 space-y-3">
                  {deliveries.map((delivery) => (
                    <div key={delivery.name} className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-950">{delivery.name}</p>
                          <p className="text-sm text-slate-500">{delivery.date}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                          {delivery.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Delivery tracking</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">Live Delivery Status</h2>
                  <p className="mt-2 text-sm text-slate-600">Operations staff will paste or import a NEXUS tracking link here.</p>
                </div>
                <span className="inline-flex items-center rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7C3AED]">
                  Track Delivery
                </span>
              </div>

              <div className="mt-6 grid gap-6">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tracking status</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">Awaiting Tracking Link</span>
                      <span className="rounded-full bg-[#ede9fe] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3730a3]">Live Tracking</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">Delivered</span>
                    </div>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tracking link</p>
                    <div className="mt-4 rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/20">
                      <p className="text-sm text-slate-600 break-words">{trackingInfo.trackingLink}</p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  <button type="button" className="rounded-2xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]">
                    View Tracking
                  </button>
                  <button type="button" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50">
                    Copy Tracking Link
                  </button>
                  <button type="button" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50">
                    Send to Customer
                  </button>
                  <button type="button" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50">
                    Send to Merchant
                  </button>
                  {trackingInfo.collectionId ? (
                    <button type="button" className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50">
                      Send to Collection Contact
                    </button>
                  ) : null}
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Recent tracking events</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Delivery updates</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {trackingEvents.map((event) => (
                      <div key={event.label} className="rounded-3xl bg-white p-4 shadow-sm shadow-slate-200/20">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-950">{event.label}</p>
                            <p className="text-sm text-slate-500">{event.time}</p>
                          </div>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">
                            {event.label === "Out for delivery" ? "Live" : event.label === "Delivered" ? "Delivered" : "Done"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Operations notes</p>
                  <p className="mt-2 text-sm text-slate-600">Visible only in Operations View.</p>
                  <div className="mt-4 grid gap-3">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tracking provider</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{trackingInfo.provider}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Tracking URL</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950 break-words">{trackingInfo.trackingUrl}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Last sync</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{trackingInfo.lastSync}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Delivery ID</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{trackingInfo.deliveryId}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Collection ID</p>
                      <p className="mt-2 text-sm font-semibold text-slate-950">{trackingInfo.collectionId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Billing summary</p>
              <div className="mt-4 grid gap-4">
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Outstanding balance</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">£2,050.00</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Last payment</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">£8,000 · Jun 21</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Support notes</p>
              <div className="mt-4 space-y-3 text-sm text-slate-600">
                {supportNotes.map((note) => (
                  <p key={note} className="rounded-3xl bg-slate-50 p-4">
                    {note}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
