"use client";

import { ReactNode, useEffect } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getTitleForPath } from "@/lib/routeTitles";

const navItems = [
  { label: "The Hub", href: "/" },
  { label: "Create IT", href: "/create-it" },
  { label: "Route IT", href: "/route-it" },
  { label: "Track IT", href: "/track-it" },
  { label: "Store IT", href: "/store-it" },
  { label: "Account IT", href: "/account-it" },
  { label: "Manage IT", href: "/manage-it" },
  { label: "Report IT", href: "/report-it" },
  { label: "Build IT", href: "/build-it" },
  { label: "Improve IT", href: "/improve-it" },
  { label: "Need IT", href: "/need-it" },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePath = pathname;
  const pageTitle = getTitleForPath(activePath);

  useEffect(() => {
    // keep browser title in sync with page title mapping
    if (typeof document !== "undefined") {
      document.title = `${pageTitle} — NEXUS`;
    }
  }, [pageTitle]);

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-graphite)]">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar items={navItems} activePath={activePath} />

        <div className="flex-1 lg:min-h-screen lg:overflow-hidden">
          <div className="border-b border-slate-200 bg-white/95 backdrop-blur">
            <Header title={pageTitle} subtitle="Logistics control room" />
          </div>

          <main className="px-4 py-6 sm:px-6 lg:px-8 lg:pb-10">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
