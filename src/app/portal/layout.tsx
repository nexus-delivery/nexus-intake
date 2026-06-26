import type { Metadata } from "next";
import MerchantPortalShell from "@/components/MerchantPortalShell";

export const metadata: Metadata = {
  title: "Merchant Portal — NEXUS",
  description: "Merchant portal for NEXUS logistics platform",
};

export default function MerchantPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <MerchantPortalShell>{children}</MerchantPortalShell>;
}
