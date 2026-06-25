"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";

const navItems = [
  { label: "Home", href: "/dashboard" },
  { label: "New Delivery", href: "/booking-forms" },
  { label: "My Deliveries", href: "/orders" },
  { label: "Customers", href: "/customers" },
  { label: "Documents", href: "/document-centre" },
  { label: "Planning", href: "/consignments" },
  { label: "Fleet", href: "/drivers" },
  { label: "Warehouse", href: "/merchants" },
  { label: "Finance", href: "/finance" },
  { label: "Reports", href: "/reports" },
  { label: "Support", href: "/support" },
  { label: "Settings", href: "/settings" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Home",
  "/orders": "My Deliveries",
  "/consignments": "Planning",
  "/merchants": "Warehouse",
  "/customers": "Customers",
  "/booking-forms": "New Delivery",
  "/document-centre": "Documents",
  "/drivers": "Fleet",
  "/finance": "Finance",
  "/reports": "Reports",
  "/support": "Support",
  "/settings": "Settings",
};

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const activePath = pathname === "/" ? "/dashboard" : pathname;
  const pageTitle = pageTitles[activePath] ?? "Dashboard";

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-slate-900">
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
