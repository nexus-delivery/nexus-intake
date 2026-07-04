"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import WorkspaceSelector from "@/components/WorkspaceSelector";
import PlatformBreadcrumbs from "@/components/PlatformBreadcrumbs";

const navItems = [
  { label: "Dashboard", href: "/customer" },
  { label: "Orders", href: "/customer/orders" },
  { label: "Track Order", href: "/customer/track-order" },
  { label: "Documents", href: "/customer/documents" },
  { label: "Invoices", href: "/customer/invoices" },
  { label: "Notifications", href: "/customer/notifications" },
];

export default function CustomerPortalShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/customer";

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Customer Portal</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-950">NEXUS Customer Workspace</h1>
          <p className="mt-2 text-sm text-slate-600">
            View your own orders, live delivery status, documents, invoices, and notifications.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <WorkspaceSelector />
            <PlatformBreadcrumbs />
          </div>
          <nav className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    active
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </div>
  );
}
