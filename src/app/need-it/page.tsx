import Link from "next/link";
import AppShell from "@/components/AppShell";

const sections = [
  {
    title: "Talk About IT",
    description: "Live chat with the NEXUS support team for immediate assistance.",
    href: "/need-it/talk-about-it",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    title: "Ask IT",
    description: "Submit a support ticket and track its resolution through the support queue.",
    href: "/need-it/ask-it",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
  {
    title: "Read About IT",
    description: "Help articles, user guides and documentation for every platform feature.",
    href: "/need-it/read-about-it",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
        <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
      </svg>
    ),
  },
  {
    title: "Contact IT",
    description: "Get in touch with the NEXUS team by phone, email or scheduled call.",
    href: "/need-it/contact-it",
    status: "coming-soon",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.09 9.82 19.79 19.79 0 01.07 1.18 2 2 0 012.02 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
];

export default function NeedItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                Platform Spotlight
              </p>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Need IT</h1>
              <p className="mt-1.5 text-sm text-slate-500">
                Customer support — help articles, live chat and contact resources.
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
              <p className="text-sm font-semibold text-amber-900">Need IT is coming soon</p>
              <p className="text-sm text-amber-700">
                The customer support centre is being built. All help resources will be available in a future sprint.
              </p>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {sections.map((section) => (
            <Link
              href={section.href}
              key={section.title}
              className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 opacity-65 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/30 hover:opacity-100 hover:shadow-[0_8px_32px_-8px_rgba(124,58,237,0.2)]"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 transition group-hover:bg-[#7C3AED]/10 group-hover:text-[#7C3AED]">
                  {section.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                  Coming Soon
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#111827]">{section.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{section.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
