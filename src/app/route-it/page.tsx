import Link from "next/link";
import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Plan Routes",
    description: "Build and optimise delivery routes for the day's fleet schedule.",
    href: "/consignments",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 12h18" />
        <path d="M8 7l-5 5 5 5" />
        <path d="M16 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    title: "Consignments",
    description: "View and manage all consignment records across routes and depots.",
    href: "/consignments",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
        <path d="M12 3v18M3 7l9 4 9-4" />
      </svg>
    ),
  },
  {
    title: "Fleet Management",
    description: "Manage vehicles, assign drivers and track fleet readiness.",
    href: "/drivers",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 13h13v6H3z" />
        <path d="M16 13h3l2 3v3h-5" />
        <path d="M6 13V7h10v6" />
        <circle cx="7.5" cy="19.5" r="1.5" />
        <circle cx="17.5" cy="19.5" r="1.5" />
      </svg>
    ),
  },
  {
    title: "Driver Dispatch",
    description: "Assign and dispatch drivers to routes with real-time updates.",
    href: "/drivers",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M5 20h14" />
        <path d="M8 20a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z" />
        <path d="M6 16l1-5h10l1 5" />
        <path d="M7 11V8a2 2 0 012-2h6a2 2 0 012 2v3" />
      </svg>
    ),
  },
  {
    title: "Route Optimisation",
    description: "AI-powered route sequencing to reduce mileage and delivery windows.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="3" />
        <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
      </svg>
    ),
  },
  {
    title: "Live Map",
    description: "Real-time map view of all active routes and vehicle positions.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
        <line x1="9" y1="3" x2="9" y2="18" />
        <line x1="15" y1="6" x2="15" y2="21" />
      </svg>
    ),
  },
];

export default function RouteItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M3 12h18" />
                <path d="M8 7l-5 5 5 5" />
                <path d="M16 7l5 5-5 5" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Route IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                For route planning, optimisation and driver dispatch.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <div key={section.title} className="relative">
              {section.status === "coming-soon" ? (
                <div className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 opacity-60 shadow-sm">
                  <div className="flex items-start justify-between gap-3 mb-4">
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
              ) : (
                <Link
                  href={section.href}
                  className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/30 hover:shadow-[0_8px_32px_-8px_rgba(124,58,237,0.2)]"
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] transition group-hover:bg-[#7C3AED] group-hover:text-white">
                      {section.icon}
                    </div>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      Live
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-[#111827]">{section.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{section.description}</p>
                  <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#7C3AED] opacity-0 transition-opacity group-hover:opacity-100">
                    Open <span className="ml-1">→</span>
                  </div>
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
