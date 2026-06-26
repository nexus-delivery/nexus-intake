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
    label: "Orders",
    href: "/portal/orders",
    icon: "Package",
  },
  {
    label: "Shipments",
    href: "/portal/shipments",
    icon: "Truck",
  },
  {
    label: "Analytics",
    href: "/portal/analytics",
    icon: "BarChart",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    icon: "Settings",
  },
];