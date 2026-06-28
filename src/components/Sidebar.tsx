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

const navIcons: Record<string, ReactNode> = {
  "Manage it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M4 12v8h6v-5h4v5h6v-8" />
    </svg>
  ),
  "Create it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  "Upload it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  "Document it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  "Search it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  "Plan it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  "Route it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 12h18" />
      <path d="M8 7l-5 5 5 5" />
      <path d="M16 7l5 5-5 5" />
    </svg>
  ),
  "Track it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  "Account it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
      <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
    </svg>
  ),
  "Manage it. (Admin)": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  "Report it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 6h16" />
      <path d="M7 6v12" />
      <path d="M12 10v8" />
      <path d="M17 14v4" />
      <path d="M4 18h16" />
    </svg>
  ),
  "Build it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  "Improve it.": (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
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
    <aside className="bg-[#111827] text-slate-100 lg:min-h-screen lg:w-72">
      <div className="mx-auto flex max-w-xs flex-col gap-8 px-4 py-6 sm:px-6 lg:max-w-none lg:px-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-white/10 bg-[#111827] px-4 py-3 shadow-sm shadow-slate-950/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#7C3AED] text-base font-bold text-white">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Nexus it.</p>
              <p className="text-xs text-slate-400">Intelligent Transport Platform</p>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-[#111827] p-4 text-sm text-slate-300 shadow-sm shadow-slate-950/20">
            <p className="font-medium text-slate-100">Nexus it. starts here</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Select a module below to begin. Every capability lives in Manage it.
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active = item.href === activePath || (item.href !== "/" && activePath.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition " +
                  (active
                    ? "bg-white/10 text-white shadow-lg shadow-slate-950/20 border-l-4 border-[#7C3AED]"
                    : "text-slate-300 hover:bg-white/5 hover:text-white")
                }
                aria-current={active ? "page" : undefined}
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-lg">
                  {navIcons[item.label] ?? <span className="block h-4 w-4 rounded-full bg-slate-300" />}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
