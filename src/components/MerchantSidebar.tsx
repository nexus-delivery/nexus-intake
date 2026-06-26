"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { merchantNavItems } from "@/lib/merchantNavigation";

type SidebarProps = {
  activePath: string;
};

const navIcons: Record<string, ReactNode> = {
  Home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 11.5L12 4l9 7.5" />
      <path d="M4 12v8h6v-5h4v5h6v-8" />
    </svg>
  ),
  Package: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Truck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <rect x="1" y="6" width="22" height="12" rx="2" />
      <path d="M1 12h22" />
      <circle cx="5" cy="19" r="2" />
      <circle cx="19" cy="19" r="2" />
    </svg>
  ),
  BarChart: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="19" x2="19" y2="19" />
      <rect x="6" y="14" width="4" height="5" />
      <rect x="14" y="9" width="4" height="10" />
    </svg>
  ),
  Settings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="1.8" className="h-5 w-5">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m5.08 5.08l4.24 4.24M1 12h6m6 0h6m-15.78 7.78l4.24-4.24m5.08-5.08l4.24-4.24" />
    </svg>
  ),
};

export default function MerchantSidebar({ activePath }: SidebarProps) {
  return (
    <aside className="hidden h-screen w-64 flex-col border-r border-slate-200 bg-white lg:flex">
      <div className="flex items-center gap-3 border-b border-slate-200 px-6 py-4">
        <div className="h-8 w-8 rounded-lg bg-[var(--nexus-purple)]" />
        <span className="font-semibold text-[var(--nexus-graphite)]">Merchant Portal</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
        {merchantNavItems.map((item) => {
          const isActive = activePath === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-purple-50 text-[var(--nexus-purple)]"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center">
                {navIcons[item.icon]}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 px-6 py-4">
        <p className="text-xs text-slate-500">Merchant v0.5.0</p>
      </div>
    </aside>
  );
}