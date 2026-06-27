import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Suggest IT",
    description: "Submit a suggestion for a new platform feature or capability improvement.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
    ),
  },
  {
    title: "Vote IT",
    description: "Vote on platform feature requests and help prioritise the product roadmap.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" />
        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
      </svg>
    ),
  },
  {
    title: "Future IT",
    description: "See what capabilities are planned for future sprints and product phases.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  {
    title: "Report IT",
    description: "Report a bug, broken feature or unexpected behaviour on the platform.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: "Ideas",
    description: "Browse the community ideas board and contribute to platform innovation.",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 2a7 7 0 015.29 11.56 5 5 0 01-1.3 2.4A3 3 0 0113 18H11a3 3 0 01-2.99-2.04 5 5 0 01-1.3-2.4A7 7 0 0112 2z" />
        <line x1="12" y1="18" x2="12" y2="22" />
        <line x1="9" y1="21" x2="15" y2="21" />
      </svg>
    ),
  },
];

export default function ImproveItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Platform Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Improve IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                The customer improvement centre — suggest, vote and shape the future of the platform.
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
              <p className="text-sm font-semibold text-amber-900">Improve IT is coming soon</p>
              <p className="text-sm text-amber-700">
                The customer improvement centre is being built. All sections will be live in a future sprint.
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