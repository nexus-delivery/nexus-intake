import type { Metadata } from "next";
import MerchantPortalShell from "@/components/MerchantPortalShell";

export const metadata: Metadata = {
  title: "Workspace access - Nexus it Today",
  description: "Customer workspace for creating, tracking and reviewing transport work.",
};

export default function MerchantPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MerchantPortalShell>{children}</MerchantPortalShell>;
}
