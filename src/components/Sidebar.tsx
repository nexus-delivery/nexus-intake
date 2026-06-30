import Link from "next/link";
import type { ReactNode } from "react";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  items: NavItem[];
  activePath: string;
};

const moduleDescriptions: Record<string, string> = {
  "Manage it": "Company, users, security and platform controls",
  "Create it": "Create new work from any source",
  "Track it": "Track vehicles, jobs and deliveries in real time",
  "Store it": "Warehouse, inventory and documents",
  "Account it": "Customers, invoicing and payments",
  "Report it": "Dashboards, KPIs and business insights",
  "Improve it": "Feedback, automation and continuous improvement",
  Settings: "Workspace governance and configuration",
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

export default function Sidebar({ items, activePath }: SidebarProps) {
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
              <p className="text-xs text-slate-400">Nexus Intelligent Transport</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-sm shadow-slate-950/20">
            <p className="font-medium text-slate-100">Products</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Install only the products your business needs.
            </p>
          </div>
        </div>

        <nav className="space-y-3">
          {items.map((item) => {
            const active = item.href === activePath || (item.href !== "/" && activePath.startsWith(item.href));
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
                      "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] " +
                      (active ? "bg-[#7C3AED]/40 text-[#d7c9ff]" : "bg-white/10 text-slate-300")
                    }
                  >
                    Product
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

        <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3">
          <p className="text-sm font-semibold text-white">Sell it</p>
          <p className="mt-1 text-xs leading-5 text-slate-400">Available soon · Install when released</p>
        </div>
      </div>
    </aside>
  );
}
