import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  items: NavItem[];
  activePath: string;
  userType?: "admin" | "merchant" | "customer";
  onUserTypeChange?: (type: "admin" | "merchant" | "customer") => void;
};

const moduleDescriptions: Record<string, string> = {
  "Manage it": "Company, users, security and platform controls",
  "Create it": "Create new work from any source",
  "Track it": "Track vehicles, jobs and deliveries in real time",
  "Store it": "Warehouse, inventory and documents",
  "Account it": "Customers, invoicing and payments",
  "Report it": "Dashboards, KPIs and business insights",
  "Improve it": "Feedback, automation and continuous improvement",
  "Tell it": "Contact us — support and feedback",
  Settings: "Workspace governance and configuration",
};

const moduleStatus: Record<string, string> = {
  "Manage it": "installed",
  "Create it": "installed",
  "Track it": "installed",
  "Store it": "available",
  "Account it": "installed",
  "Report it": "installed",
  "Improve it": "available",
  "Tell it": "installed",
  Settings: "installed",
};

const navIcons: Record<string, ReactNode> = {
  "Manage it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M4 12v8h6v-5h4v5h6v-8" />
    </svg>
  ),
  "Create it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  "Track it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  "Store it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 8l8-5 8 5v11H4V8z" />
      <path d="M12 3v18" />
      <path d="M8 12h8" />
    </svg>
  ),
  "Account it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
    </svg>
  ),
  "Report it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 6h16" />
      <path d="M7 6v12" />
      <path d="M12 10v8" />
      <path d="M17 14v4" />
      <path d="M4 18h16" />
    </svg>
  ),
  "Improve it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 2l3.2 6.5 7.2 1-5.2 5 1.2 7.3-6.4-3.4-6.4 3.4 1.2-7.3-5.2-5 7.2-1L12 2z" />
    </svg>
  ),
  "Tell it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
      <path d="M2 12h2m16 0h2M12 2v2m0 16v2m7.07-15.07l-1.41 1.41M6.34 17.66l-1.41 1.41m0-14.14l1.41 1.41m11.32 11.32l1.41 1.41" />
    </svg>
  ),
  // Legacy icons kept for backward compatibility
  "The Hub": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M4 12v8h6v-5h4v5h6v-8" />
    </svg>
  ),
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M4 12v8h6v-5h4v5h6v-8" />
    </svg>
  ),
};

export default function Sidebar({ items, activePath, userType = "admin", onUserTypeChange }: SidebarProps) {
  // TODO: support collapsible icon-only sidebar in a future design pass.
  return (
    <aside className="bg-[rgba(8,10,20,0.88)] text-slate-100 lg:min-h-screen lg:w-[22rem] lg:border-r lg:border-white/10">
      <div className="mx-auto flex max-w-xs flex-col gap-8 px-4 py-6 sm:px-6 lg:max-w-none lg:px-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-3 shadow-sm shadow-slate-950/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C3AED] text-base font-bold text-white shadow-[0_10px_24px_-10px_rgba(124,58,237,0.85)]">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nexus it</p>
              <p className="text-xs text-slate-400">Intelligent Transport</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-sm shadow-slate-950/20">
            <p className="font-medium text-slate-100">Choose it</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Get what you want from it!
            </p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#7C3AED]/20 to-white/5 p-4 shadow-sm shadow-slate-950/20">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-slate-300">View as</p>
            <div className="mt-3 space-y-2">
              {["admin", "merchant", "customer"].map((type) => (
                <button
                  key={type}
                  onClick={() => onUserTypeChange?.(type as "admin" | "merchant" | "customer")}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition ${
                    userType === type
                      ? "bg-[#7C3AED]/40 text-white shadow-[0_4px_12px_-3px_rgba(124,58,237,0.4)]"
                      : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <nav className="space-y-3">
          {items.map((item) => {
            const active = item.href === activePath || (item.href !== "/" && activePath.startsWith(item.href));
            const status = moduleStatus[item.label] ?? "installed";
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "group block rounded-2xl border px-4 py-3 transition " +
                  (active
                    ? "border-[#7C3AED]/60 bg-[rgba(124,58,237,0.2)] text-white shadow-lg shadow-slate-950/20"
                    : "border-white/10 bg-white/5 text-slate-300 hover:border-[#7C3AED]/35 hover:bg-white/10 hover:text-white")
                }
                aria-current={active ? "page" : undefined}
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 group-hover:bg-[#7C3AED]/20">
                    {navIcons[item.label] ?? <span className="block h-4 w-4 rounded-full bg-slate-300" />}
                  </span>
                  <span
                    className={
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] " +
                      (status === "installed"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : status === "available"
                          ? "bg-sky-500/20 text-sky-300"
                          : "bg-violet-500/20 text-violet-300")
                    }
                  >
                    {status}
                  </span>
                </div>
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  {moduleDescriptions[item.label] ?? "Nexus workspace capability"}
                </p>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Coming soon</p>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <p className="text-sm font-semibold text-white">Sell it</p>
              </div>
              <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-300">
                coming soon
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">Websites, marketing and customer acquisition.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-4 w-4">
                  <path d="M18 8h1a4 4 0 010 8h-1M2 8h16a4 4 0 014 4 4 4 0 01-4 4H2M2 8v8m2-4h12" />
                  <circle cx="6" cy="16" r="2" />
                  <circle cx="18" cy="16" r="2" />
                </svg>
                <p className="text-sm font-semibold text-white">Run it</p>
              </div>
              <span className="rounded-full bg-violet-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-300">
                coming soon
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-slate-400">Fleet, maintenance and asset management.</p>
          </div>
          <button
            type="button"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-left text-sm font-medium text-slate-200 transition hover:border-[#7C3AED]/40 hover:text-white"
          >
            Upgrade it
          </button>
        </div>
      </div>
    </aside>
  );
}
