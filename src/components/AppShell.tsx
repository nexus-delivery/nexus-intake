"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { getManageItAccessProfile } from "@/lib/manageIt";
import { getTitleForPath } from "@/lib/routeTitles";

const adminNavItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Create it", href: "/create-it" },
  { label: "Oversee it", href: "/orders" },
  { label: "Process it", href: "/process-it" },
  { label: "Manage it", href: "/manage-it" },
  { label: "Report it", href: "/report-it" },
  { label: "Store it", href: "/store-it" },
  { label: "Account it", href: "/account-it" },
  { label: "Settings", href: "/settings" },
];

const merchantNavItems = [
  { label: "Dashboard", href: "/portal" },
  { label: "Create it", href: "/portal/create-it" },
  { label: "Oversee it", href: "/portal/orders" },
  { label: "Process it", href: "/process-it" },
  { label: "Manage it", href: "/portal/manage-it" },
  { label: "Report it", href: "/portal/reports" },
  { label: "Store it", href: "/store-it" },
  { label: "Account it", href: "/account-it" },
  { label: "Settings", href: "/portal/settings" },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePath = pathname;
  const pageTitle = getTitleForPath(activePath);
  const isPortal = pathname.startsWith("/portal");
  const [showManageIt, setShowManageIt] = useState(pathname.startsWith("/manage-it"));

  useEffect(() => {
    // keep browser title in sync with page title mapping
    if (typeof document !== "undefined") {
      document.title = `${pageTitle} - NEXUS It Today`;
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

  const filteredNavItems = isPortal
    ? merchantNavItems
    : adminNavItems.filter(
        (item) => item.label !== "Manage it" || showManageIt || pathname.startsWith("/manage-it")
      );

  return (
    <div className="min-h-screen text-[var(--nexus-graphite)] nexus-page-enter">
      <div className="lg:flex lg:min-h-screen">
        <Sidebar items={filteredNavItems} activePath={activePath} />

        <div className="flex-1 lg:min-h-screen lg:overflow-hidden">
          <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
            <Header title={pageTitle} subtitle="Everything you need to build, operate and grow your transport business." />
          </div>

          <div className="flex h-full">
            <main className="min-w-0 flex-1 bg-transparent px-4 py-6 sm:px-6 lg:px-8 lg:pb-10">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
