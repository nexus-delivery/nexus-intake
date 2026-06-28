"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getManageItAccessProfile } from "@/lib/manageIt";
import { getTitleForPath } from "@/lib/routeTitles";

const navItems = [
  { label: "Manage it.", href: "/" },
  { label: "Create it.", href: "/create-it" },
  { label: "Upload it.", href: "/portal/intake" },
  { label: "Document it.", href: "/manage-it/document-it" },
  { label: "Search it.", href: "/manage-it/search-it" },
  { label: "Plan it.", href: "/route-it" },
  { label: "Route it.", href: "/route-it" },
  { label: "Track it.", href: "/track-it" },
  { label: "Account it.", href: "/account-it" },
  { label: "Manage it. (Admin)", href: "/manage-it" },
  { label: "Report it.", href: "/report-it" },
  { label: "Build it.", href: "/build-it" },
  { label: "Improve it.", href: "/improve-it" },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePath = pathname;
  const pageTitle = getTitleForPath(activePath);
  const [showManageIt, setShowManageIt] = useState(pathname.startsWith("/manage-it"));

  useEffect(() => {
    // keep browser title in sync with page title mapping
    if (typeof document !== "undefined") {
      document.title = `${pageTitle} — NEXUS`;
    }
  }, [pageTitle]);

  useEffect(() => {
    let active = true;

    async function hydrateAccess() {
      try {
        const profile = await getManageItAccessProfile();
        if (active) {
          setShowManageIt(profile.canAccessManageIt || pathname.startsWith("/manage-it"));
        }
      } catch {
        if (active) {
          setShowManageIt(pathname.startsWith("/manage-it"));
        }
      }
    }

    void hydrateAccess();

    return () => {
      active = false;
    };
  }, [pathname]);

  const filteredNavItems = navItems.filter(
    (item) => {
      const isManageItOnly =
        item.href === "/manage-it" ||
        item.href === "/manage-it/document-it" ||
        item.href === "/manage-it/search-it";
      return !isManageItOnly || showManageIt;
    },
  );

  return (
    <div className="min-h-screen bg-[var(--nexus-bg)] text-[var(--nexus-graphite)]">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar items={filteredNavItems} activePath={activePath} />

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
