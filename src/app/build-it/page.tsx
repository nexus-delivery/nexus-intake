import Link from "next/link";
import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Learn IT",
    description: "The platform knowledge base. Every agent reads this before writing code.",
    href: "/build-it/learn-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    title: "Steer IT",
    description: "Steer product direction with priorities, constraints and operating principles.",
    href: "/build-it/steer-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v18" />
        <path d="M3 12h18" />
      </svg>
    ),
  },
  {
    title: "Think IT",
    description: "Capture thinking work, assumptions and strategic options for upcoming work.",
    href: "/build-it/think-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 2a7 7 0 015.29 11.56A5 5 0 0115 17H9a5 5 0 01-2.29-3.44A7 7 0 0112 2z" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    title: "Market IT",
    description: "Coordinate launch messaging, positioning and campaign readiness.",
    href: "/build-it/market-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 11v2" />
        <path d="M7 8v8" />
        <path d="M11 5v14" />
        <path d="M15 9v6" />
        <path d="M19 7v10" />
      </svg>
    ),
  },
  {
    title: "Sell IT",
    description: "Prepare value propositions, sales assets and commercial rollout readiness.",
    href: "/build-it/sell-it",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 1v22" />
        <path d="M17 5H9a4 4 0 000 8h6a4 4 0 010 8H7" />
      </svg>
    ),
  },
  {
    title: "Roadmap",
    description: "Strategic product roadmap showing upcoming initiatives and milestones.",
    href: "/build-it/roadmap",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M3 12h18" />
        <path d="M3 6h18" />
        <path d="M3 18h18" />
        <circle cx="17" cy="6" r="2" fill="currentColor" stroke="none" />
        <circle cx="7" cy="12" r="2" fill="currentColor" stroke="none" />
        <circle cx="14" cy="18" r="2" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: "Sprint",
    description: "Current sprint cards, progress and team velocity at a glance.",
    href: "/build-it/sprint",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="3" y="3" width="5" height="18" rx="1" />
        <rect x="10" y="3" width="5" height="11" rx="1" />
        <rect x="17" y="3" width="5" height="14" rx="1" />
      </svg>
    ),
  },
  {
    title: "Progress",
    description: "Sprint velocity, feature completion percentages and milestone tracking.",
    href: "/build-it/progress",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    ),
  },
  {
    title: "Architecture",
    description: "System design, data models, infrastructure diagrams and technical decisions.",
    href: "/build-it/architecture",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <rect x="2" y="3" width="6" height="6" rx="1" />
        <rect x="16" y="3" width="6" height="6" rx="1" />
        <rect x="9" y="15" width="6" height="6" rx="1" />
        <path d="M5 9v3h14V9" />
        <path d="M12 12v3" />
      </svg>
    ),
  },
  {
    title: "Integrations",
    description: "Third-party service integrations, API connections and webhook registry.",
    href: "/build-it/integrations",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    title: "Issues",
    description: "Open bugs, technical debt and known limitations tracked in one place.",
    href: "/build-it/issues",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  {
    title: "Decisions",
    description: "Architectural decision records (ADRs) and key product choices made.",
    href: "/build-it/decisions",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M9 12l2 2 4-4" />
        <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" />
      </svg>
    ),
  },
  {
    title: "Release Notes",
    description: "Changelog of every deployed release, feature and breaking change.",
    href: "/build-it/release-notes",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
];

export default function BuildItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Platform Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Build IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                The development brain — roadmap, sprint board, architecture and integrations.
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
