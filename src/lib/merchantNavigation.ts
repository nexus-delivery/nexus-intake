export interface NavItem {
  label: string;
  href: string;
  icon: string;
  comingSoon?: boolean;
}

export const merchantNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/portal",
    icon: "Home",
  },
  {
    label: "Upload Orders",
    href: "/portal/upload",
    icon: "Upload",
  },
  {
    label: "Document Upload",
    href: "/portal/intake",
    icon: "FileText",
  },
  {
    label: "Draft Orders",
    href: "/portal/drafts",
    icon: "FileText",
  },
  {
    label: "Live Deliveries",
    href: "/portal/live",
    icon: "Truck",
    comingSoon: true,
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
    comingSoon: true,
  },
  {
    label: "Finance",
    href: "/portal/finance",
    icon: "BarChart3",
    comingSoon: true,
  },
  {
    label: "Warehouse",
    href: "/portal/warehouse",
    icon: "Box",
    comingSoon: true,
  },
];
