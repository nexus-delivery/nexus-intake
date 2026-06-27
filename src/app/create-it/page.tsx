import Link from "next/link";
import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "New Delivery",
    description: "Create a new delivery request and dispatch it for same-day or scheduled delivery.",
    href: "/portal/intake",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: "Upload Orders",
    description: "Bulk-upload order files and documents to create multiple deliveries at once.",
    href: "/portal/intake",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M12 5v10" />
        <path d="M8 11l4-4 4 4" />
        <path d="M8 19h8" />
      </svg>
    ),
  },
  {
    title: "Booking Forms",
    description: "Use structured booking forms for customer portal entries.",
    href: "/booking-forms",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M6 3h9l5 5v13H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    title: "Draft Orders",
    description: "Resume and complete delivery requests saved as drafts.",
    href: "/orders",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 7h16M4 12h12M4 17h8" />
      </svg>
    ),
  },
  {
    title: "Order Input",
    description: "Advanced order entry for operations teams entering jobs directly.",
    href: "/order-input",
    status: "live",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5" />
        <path d="M17.5 3.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 8.5-8.5z" />
      </svg>
    ),
  },
  {
    title: "Recurring Deliveries",
    description: "Set up scheduled and recurring delivery programmes for regular customers.",
    href: "#",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M17.65 6.35A7.958 7.958 0 0012 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0112 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z" />
      </svg>
    ),
  },
];

export default function CreateItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Create IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                For creating delivery requests, orders and bookings.
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
