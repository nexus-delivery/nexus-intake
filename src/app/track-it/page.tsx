import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Live Fleet",
    description: "Real-time vehicle positions and active route status across all depots.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
  {
    title: "Order Status",
    description: "Track every delivery from creation to final proof of delivery.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
        <path d="M12 3v18M3 7l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: "POD Tracking",
    description: "Proof of delivery capture and verification across all active orders.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
      </svg>
    ),
  },
  {
    title: "Delivery Timeline",
    description: "Chronological timeline of all delivery events and status changes.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 8v4l3 3" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
  },
  {
    title: "Customer Notifications",
    description: "Automated ETA and status notifications sent to customers.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    title: "Exception Alerts",
    description: "Instant alerts for delays, failures and critical delivery exceptions.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function TrackItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Track IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                For real-time tracking, visibility and delivery status.
              </p>
            </div>
          </div>
        </div>

        {/* Coming Soon Banner */}
        <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="9" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-900">Track IT is in development</p>
              <p className="text-sm text-amber-700">
                Real-time tracking features are coming soon. The foundation is being built this sprint.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div
              key={section.title}
              className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 opacity-65 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  {section.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#111827]">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
