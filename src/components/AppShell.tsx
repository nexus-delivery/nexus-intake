"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NotifyItPanel from "@/components/NotifyItPanel";
import { getManageItAccessProfile } from "@/lib/manageIt";
import { getTitleForPath } from "@/lib/routeTitles";

const navItems = [
  { label: "Create it", href: "/create-it" },
  { label: "Integrate it", href: "/integrate-it" },
  { label: "Process it", href: "/process-it" },
  { label: "Track it", href: "/track-it" },
  { label: "Store it", href: "/store-it" },
  { label: "Account it", href: "/account-it" },
  { label: "Report it", href: "/report-it" },
  { label: "Improve it", href: "/improve-it" },
  { label: "Manage it", href: "/" },
];
export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePath = pathname;
  const pageTitle = getTitleForPath(activePath);
  const [showManageIt, setShowManageIt] = useState(pathname.startsWith("/manage-it"));

  useEffect(() => {
    // keep browser title in sync with page title mapping
    if (typeof document !== "undefined") {
      document.title = `${pageTitle} - Nexus it Today`;
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

  const filteredNavItems = navItems.filter((item) => item.href !== "/" || showManageIt);

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
            {showManageIt ? <NotifyItPanel /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
