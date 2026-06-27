import Link from "next/link";
import AppShell from "@/components/AppShell";

const customer = {
  companyName: "Doorway Group LTD",
  tradingName: null,
  status: "Active",
  owner: "Hannah Lee",
  nextDelivery: "Tomorrow, 07:45",
  portalMethod: "PDF upload and email",
};

const orderMethods = [
  { label: "PDF Upload", value: "Preferred" },
  { label: "Email orders@doorwaygroup.co.uk", value: "Backup" },
  { label: "Portal requests", value: "Coming soon" },
];

// Order intake workflow steps
const orderIntakeWorkflow = [
  { step: 1, label: "Document Uploaded", status: "Complete" },
  { step: 2, label: "Booking Created", status: "Complete" },
  { step: 3, label: "In Progress", status: "In Progress" },
  { step: 4, label: "Delivered", status: "Pending" },
  { step: 5, label: "Proof of Delivery Ready", status: "Pending" },
];

// Source documents section
// Internal: sourceDocumentUrl
const sourceDocuments = [
  {
    id: "doc-001",
    name: "Warehouse receipt #2455",
    date: "Today, 09:30",
    sourceDocumentUrl: "https://nexus.delivery/documents/warehouse-receipt-2455.pdf",
    status: "Processed",
  },
  {
    id: "doc-002",
    name: "Invoice #7801",
    date: "Jun 24, 14:15",
    sourceDocumentUrl: "https://nexus.delivery/documents/invoice-7801.pdf",
    status: "Processed",
  },
];

// Track-POD note preview
// Internal: trackpodGoodsNote
const trackpodGoodsNotePreview = (sourceDocumentUrl: string) => `
NEXUS source document:
${sourceDocumentUrl}
`;

// Delivery documents placeholders
// Internal: merchantBrandedPodUrl
const deliveryDocuments = [
  {
    id: "pod-001",
    label: "Merchant-branded POD",
    type: "Proof of Delivery",
    status: "Pending",
    placeholder: "Awaiting delivery completion and signature",
    merchantBrandedPodUrl: null,
  },
  {
    id: "pod-002",
    label: "Signed delivery note",
    type: "Signed Document",
    status: "Pending",
    placeholder: "Will be captured upon delivery",
  },
  {
    id: "pod-003",
    label: "Delivery photos",
    type: "Evidence",
    status: "Pending",
    placeholder: "Photos from driver mobile app",
  },
  {
    id: "pod-004",
    label: "Recipient signature",
    type: "Signature",
    status: "Pending",
    placeholder: "Captured via mobile device",
  },
  {
    id: "pod-005",
    label: "Tracking link",
    type: "Customer Visibility",
    status: "Ready",
    placeholder: "https://nexus.delivery/track/DEL-1324",
  },
];

const documents = [
  { name: "Warehouse receipt #2455", date: "Today", status: "Ready" },
  { name: "Invoice #7801", date: "Jun 24", status: "Sent" },
  { name: "Delivery note #574", date: "Jun 22", status: "Done" },
];

const deliveries = [
  { name: "Bristol store drop", date: "Jun 24", status: "Delivered" },
  { name: "London showroom", date: "Jun 23", status: "In transit" },
  { name: "Manchester pickup", date: "Jun 22", status: "Completed" },
];

const trackingInfo = {
  currentStatus: "Awaiting Tracking Link",
  trackingLink: "https://nexus.delivery/track/placeholder",
  provider: "Track-POD",
  trackingUrl: "https://track-pod.example/track/1234",
  lastSync: "Just now",
  deliveryId: "DEL-1324",
  collectionId: "COL-781",
};

const trackingEvents = [
  { label: "Driver allocated", time: "2 min ago" },
  { label: "Vehicle loaded", time: "5 min ago" },
  { label: "Out for delivery", time: "In progress" },
  { label: "Delivered", time: "Pending" },
];

const supportNotes = [
  "Weekly delivery window confirmed for 07:00–08:30.",
  "Customer prefers layout labels in plain English.",
  "Next order due after stock review on Monday.",
];

export default function DoorwayGroupPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Customer portal</p>
            <h1 className="text-3xl font-semibold text-slate-950">Doorway Group LTD</h1>
            <p className="max-w-2xl text-sm text-slate-600">
              Mock customer view with deliveries, documents, tracking and support notes in plain English.
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

            {/* Order Intake Workflow - NEW SECTION */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Booking Status</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">Booking Journey</h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {orderIntakeWorkflow.map((step, index) => (
                  <div key={step.step} className="flex items-center gap-4">
                    <div className="flex flex-shrink-0 items-center justify-center">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${
                          step.status === "Complete"
                            ? "bg-emerald-500"
                            : step.status === "In Progress"
                              ? "bg-[#7C3AED]"
                              : "bg-slate-300"
                        }`}
                      >
                        {step.status === "Complete" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-5 w-5">
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        ) : (
                          step.step
                        )}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-slate-950">{step.label}</p>
                      <p className="text-xs text-slate-500 uppercase tracking-[0.12em]">{step.status}</p>
                    </div>
                    {index < orderIntakeWorkflow.length - 1 && (
                      <div
                        className={`absolute left-[19px] top-[60px] h-8 w-0.5 ${
                          step.status === "Complete" ? "bg-emerald-500" : "bg-slate-200"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="rounded-2xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]"
                >
                  Upload Documents
                </button>
                <button
                  type="button"
                  className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  Create Booking
                </button>
              </div>
            </div>

            {/* Source Documents - NEW SECTION */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Order documents</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">Source Documents</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {sourceDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-grow">
                        <p className="font-semibold text-slate-950">{doc.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{doc.date}</p>

                        {/* Document URL - Internal field name: sourceDocumentUrl */}
                        <div className="mt-3 rounded-2xl bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Document URL</p>
                          <p className="mt-1 break-all text-xs font-mono text-slate-600">{doc.sourceDocumentUrl}</p>
                        </div>

                        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                          <p className="text-xs uppercase tracking-[0.12em] text-slate-400">Document preview</p>
                          <p className="mt-2 whitespace-pre-wrap font-mono text-xs text-slate-600">
                            {trackpodGoodsNotePreview(doc.sourceDocumentUrl)}
                          </p>
                        </div>
                      </div>

                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700 flex-shrink-0">
                        {doc.status}
                      </span>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        className="rounded-2xl bg-[#7C3AED] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#6d28d9]"
                      >
                        View Document
                      </button>
                      <button
                        type="button"
                        className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery Documents - NEW SECTION */}
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">After delivery</p>
                  <h2 className="mt-3 text-2xl font-semibold text-slate-950">Delivery Documents</h2>
                </div>
              </div>

              <p className="mt-2 text-sm text-slate-600">Proof of delivery documents and supporting evidence</p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {deliveryDocuments.map((doc) => (
                  <div key={doc.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 shadow-sm shadow-slate-200/20">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-grow">
                        <p className="font-semibold text-slate-950">{doc.label}</p>
                        <p className="mt-1 text-xs text-slate-500">{doc.type}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold uppercase tracking-[0.2em] flex-shrink-0 ${
                          doc.status === "Ready"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {doc.status}
                      </span>
                    </div>

                    <div className="mt-3 rounded-2xl bg-white p-3">
                      <p className="text-xs text-slate-500">{doc.placeholder}</p>
                    </div>

                    {/* Internal field names for reference: */}
                    {/* merchantBrandedPodUrl - URL to merchant-branded POD once generated */}
                    {doc.label === "Merchant-branded POD" && (
                      <p className="mt-2 text-xs text-slate-400">Internal: merchantBrandedPodUrl</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Next steps</p>
                <ol className="mt-3 space-y-2 text-sm text-slate-600">
                  <li>1. Track delivery progress from your live tracking link.</li>
                  <li>2. Delivery is completed and recorded automatically.</li>
                  <li>3. Proof of delivery documents are prepared for your team.</li>
                  <li>4. Documents become available here once ready.</li>
                  <li>5. Share updates with your customer using the tracking link.</li>
                </ol>
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
                          {delivery.status}</span>
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
                </div>
                <span className="inline-flex items-center rounded-full bg-[#ede9fe] px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#7C3AED]">
                  Track Delivery
                </span>
              </div>

              <div className="mt-6 grid gap-6">
                <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
                  <div className="rounded-3xl bg-slate-50 p-5">
                    <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tracking status</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#ede9fe] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#3730a3]">Awaiting Tracking Link</span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-700">Live Tracking</span>
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

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className="rounded-2xl bg-[#7C3AED] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#6d28d9]"
                  >
                    View Tracking
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Copy Tracking Link
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Send to Customer
                  </button>
                  <button
                    type="button"
                    className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-950 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    Send to Merchant
                  </button>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
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
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Tracking details</p>
                  <p className="mt-2 text-sm text-slate-600">Live updates and delivery references for your booking.</p>
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
                  <p className="mt-2 text-2xl font-semibold text-slate-950">£4,280.00</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-5">
                  <p className="text-sm text-slate-500">Last payment</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">£12,500 · Jun 20</p>
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
