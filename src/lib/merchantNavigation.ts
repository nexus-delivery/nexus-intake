export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const merchantNavItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/portal",
    icon: "Home",
  },
  {
    label: "New Booking",
    href: "/portal/intake",
    icon: "PlusCircle",
  },
  {
    label: "Live Deliveries",
    href: "/portal/live",
    icon: "Truck",
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
  },
  {
    label: "Finance",
    href: "/portal/finance",
    icon: "BarChart3",
  },
  {
    label: "Warehouse",
    href: "/portal/warehouse",
    icon: "Box",
  },
];
