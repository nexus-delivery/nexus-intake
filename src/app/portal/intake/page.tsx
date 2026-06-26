import type { ReactNode } from "react";

type PipelineStage = {
  step: number;
  title: string;
  status: "done" | "current" | "pending";
};

type LabeledValue = {
  label: string;
  value: string;
};

const pipelineStages: PipelineStage[] = [
  { step: 1, title: "Upload Document", status: "done" },
  { step: 2, title: "Store Original PDF", status: "done" },
  { step: 3, title: "Document Processing", status: "done" },
  { step: 4, title: "Draft Order Created", status: "done" },
  { step: 5, title: "Merchant Review", status: "current" },
  { step: 6, title: "Approve Order", status: "pending" },
  { step: 7, title: "Send to Operations", status: "pending" },
  { step: 8, title: "Ready for Track-POD", status: "pending" },
];

const uploadTypes = ["Upload PDF", "Upload Delivery Note", "Upload Invoice", "Upload Purchase Order", "Upload CSV"];

const extractedFields: LabeledValue[] = [
  { label: "Collection name", value: "Nook Home Warehouse" },
  { label: "Collection address", value: "25 River Way, Birmingham, B7 4QN" },
  { label: "Collection contact", value: "Harvey Mills · +44 20 7444 5533" },
  { label: "Delivery name", value: "Doorway Group Store" },
  { label: "Delivery address", value: "88 Dockside Road, London, E16 2QT" },
  { label: "Delivery contact", value: "Mina Patel · +44 20 7000 1188" },
  { label: "Goods description", value: "Kitchen fixtures and boxed retail units" },
  { label: "Quantity", value: "64 cartons" },
  { label: "Weight", value: "1,245 kg" },
  { label: "Dimensions", value: "6 pallets · 120×100×160 cm" },
  { label: "Delivery date", value: "Jun 30, 2026" },
  { label: "Reference number", value: "NEX-PO-48291" },
  { label: "Special instructions", value: "Dock access only after 08:30, call 30 mins before arrival." },
  { label: "Customs required", value: "No" },
  { label: "Currency", value: "GBP" },
  { label: "Declared value", value: "£18,550.00" },
];

const draftOrderFields: LabeledValue[] = [
  { label: "Order title", value: "Doorway Group retail replenishment" },
  { label: "Service level", value: "Standard next-day" },
  { label: "Vehicle type", value: "7.5T box truck" },
  { label: "Collection window", value: "07:30 - 09:00" },
  { label: "Delivery window", value: "11:30 - 14:00" },
  { label: "Contact email", value: "ops@doorway-group.co.uk" },
  { label: "Internal notes", value: "Priority aisle drop, receiving manager informed." },
];

const statusCards = [
  { label: "Awaiting upload", value: "0 files pending", tone: "text-slate-600" },
  { label: "Extraction complete", value: "16 fields mapped", tone: "text-[var(--nexus-info)]" },
  { label: "Review required", value: "3 checks to confirm", tone: "text-[var(--nexus-warning)]" },
  { label: "Approved", value: "Pending merchant action", tone: "text-slate-600" },
  { label: "Sent to operations", value: "Not sent yet", tone: "text-slate-600" },
];

const sourceDocumentUrl = "https://nexus.delivery/documents/warehouse-receipt-2455.pdf";

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-4 space-y-1">
        <h2 className="text-lg font-semibold text-[var(--nexus-graphite)]">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}

export default function MerchantIntakePage() {
  return (
    <div className="space-y-6 pb-8">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--nexus-purple)]">
          Document Intake v0.6.0
        </p>
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">
          Delivery intake workflow
        </h1>
        <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
          Upload your source documents, review extracted details, and approve before we send to operations.
        </p>
      </header>

      <SectionCard title="Pipeline status display" subtitle="Full document processing flow from upload to Track-POD readiness.">
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {pipelineStages.map((stage) => (
            <li
              key={stage.step}
              className={`rounded-xl border p-3 ${
                stage.status === "done"
                  ? "border-purple-200 bg-purple-50"
                  : stage.status === "current"
                    ? "border-[var(--nexus-purple)] bg-white"
                    : "border-slate-200 bg-slate-50"
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Step {stage.step}</p>
              <p className="mt-1 text-sm font-medium text-[var(--nexus-graphite)]">{stage.title}</p>
            </li>
          ))}
        </ol>
      </SectionCard>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <SectionCard title="Upload panel" subtitle="Use any intake source. This view is mock data only.">
            <div className="grid gap-3 sm:grid-cols-2">
              {uploadTypes.map((label) => (
                <button
                  key={label}
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-medium text-[var(--nexus-graphite)] transition hover:border-purple-200 hover:bg-purple-50"
                >
                  {label}
                </button>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Extraction preview" subtitle="Extracted fields from your document.">
            <dl className="grid gap-4 sm:grid-cols-2">
              {extractedFields.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</dt>
                  <dd className="mt-1 text-sm text-[var(--nexus-graphite)]">{item.value}</dd>
                </div>
              ))}
            </dl>
          </SectionCard>

          <SectionCard title="Draft order review" subtitle="Editable-style layout for merchant review (mock only).">
            <div className="grid gap-4 sm:grid-cols-2">
              {draftOrderFields.map((item) => (
                <label key={item.label} className="space-y-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{item.label}</span>
                  <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                    {item.value}
                  </div>
                </label>
              ))}
            </div>
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="Source document" subtitle="Original source file and Track-POD note preview.">
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-medium text-[var(--nexus-graphite)]">Original PDF</p>
              <p className="truncate">{sourceDocumentUrl}</p>
              <button
                type="button"
                className="rounded-lg bg-[var(--nexus-purple)] px-3 py-2 text-sm font-medium text-white transition hover:opacity-90"
              >
                View Document
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-purple-100 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Track-POD note preview</p>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-[var(--nexus-graphite)]">
{`NEXUS source document:
{{sourceDocumentUrl}}`}
              </pre>
            </div>
          </SectionCard>

          <SectionCard title="Status cards" subtitle="Quick status summary for this intake request.">
            <div className="space-y-3">
              {statusCards.map((card) => (
                <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
                  <p className={`mt-1 text-sm font-medium ${card.tone}`}>{card.value}</p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Actions" subtitle="Complete your approval steps in order.">
            <div className="grid gap-3">
              <button
                type="button"
                className="rounded-lg border border-purple-200 bg-purple-50 px-4 py-2 text-sm font-semibold text-[var(--nexus-purple)]"
              >
                Review Draft
              </button>
              <button
                type="button"
                className="rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white"
              >
                Approve Order
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[var(--nexus-graphite)]"
              >
                Send to Operations
              </button>
            </div>
          </SectionCard>
        </aside>
      </div>
    </div>
  );
}
