import Link from "next/link";
import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Stock Management",
    description: "View current stock levels, locations and movement history.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 8l8-5 8 5v11H4V8z" />
        <path d="M12 3v18" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    title: "Inventory Count",
    description: "Conduct and record physical inventory counts and audits.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 7h16M4 12h12M4 17h8" />
      </svg>
    ),
  },
  {
    title: "Locations",
    description: "Manage warehouse locations, zones, bays and shelf positions.",
    href: "/warehouse",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    title: "Goods In",
    description: "Receive and log inbound stock from suppliers and returns.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M16 16l-4 4-4-4" />
        <path d="M12 12v8" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
  {
    title: "Goods Out",
    description: "Process outbound despatch and confirm collections from warehouse.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M8 16l4-4 4 4" />
        <path d="M12 12V4" />
        <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
      </svg>
    ),
  },
  {
    title: "Returns",
    description: "Handle customer returns, damage reports and reverse logistics.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    ),
  },
];

export default function StoreItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M4 8l8-5 8 5v11H4V8z" />
                <path d="M12 3v18" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Store IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                For warehouse management, inventory and stock control.
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
