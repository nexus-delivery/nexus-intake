import type { Metadata } from "next";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Workspace access - NEXUS It Today",
  description: "Customer workspace for creating, tracking and reviewing transport work.",
};

export default function MerchantPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
