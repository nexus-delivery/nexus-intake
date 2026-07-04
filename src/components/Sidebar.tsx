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
  "Oversee it": "Operational dashboard with queue health and live status",
  "Manage it": "CRM for merchants, customers, addresses and users",
  "Create it": "Order intake with Book it, Upload it, Send it, and Get it",
  "Process it": "Review, dispatch, route planning, driver allocation and exceptions",
  "Track it": "Track vehicles, jobs and deliveries in real time",
  "Store it": "Inventory and warehouse operations",
  "Account it": "Operational invoicing, payments and accounting visibility",
  "Integrate it": "Connect Xero, commerce, messaging and dispatch providers",
  Settings: "Workspace governance and configuration",
};

const moduleStatus: Record<string, string> = {
  "Oversee it": "installed",
  "Manage it": "installed",
  "Create it": "installed",
  "Process it": "installed",
  "Track it": "installed",
  "Store it": "installed",
  "Account it": "installed",
  "Integrate it": "installed",
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
  "Process it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M5 12h14" />
      <path d="M12 5l7 7-7 7" />
      <circle cx="7" cy="12" r="2" fill="#7C3AED" stroke="none" />
    </svg>
  ),
  "Oversee it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 13h8V3H3v10z" />
      <path d="M13 21h8V11h-8v10z" />
      <path d="M13 3h8v6h-8V3z" />
      <path d="M3 21h8v-6H3v6z" />
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
      <path d="M3 6h18v12H3z" />
      <path d="M3 10h18" />
      <path d="M7 15h4" />
    </svg>
  ),
  "Integrate it": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="7" cy="12" r="3" />
      <circle cx="17" cy="7" r="3" />
      <circle cx="17" cy="17" r="3" />
      <path d="M9.5 10.5l5-2" />
      <path d="M9.5 13.5l5 2" />
    </svg>
  ),
  Dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 13h8V3H3v10z" />
      <path d="M13 21h8V11h-8v10z" />
      <path d="M13 3h8v6h-8V3z" />
      <path d="M3 21h8v-6H3v6z" />
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

          <form
            action="/manage-it/search-it"
            method="get"
            className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300 shadow-sm shadow-slate-950/20"
          >
            <label htmlFor="sidebarSearch" className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
              Search Orders And Data
            </label>
            <input
              id="sidebarSearch"
              name="q"
              type="search"
              placeholder="Order ref, Track-POD ref, customer"
              className="mt-2 w-full rounded-xl border border-white/15 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#7C3AED] focus:outline-none"
            />
            <div className="mt-3 flex gap-2">
              <button type="submit" className="rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white">
                Search
              </button>
              <Link href="/orders" className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
                Orders
              </Link>
            </div>
          </form>
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
      </div>
    </aside>
  );
}
