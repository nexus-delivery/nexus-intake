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
    label: "Book Create-it",
    href: "/portal/book-it",
    icon: "PlusCircle",
  },
  {
    label: "Orders",
    href: "/portal/orders",
    icon: "FileText",
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
  },
  {
    label: "Customers",
    href: "/portal/customers",
    icon: "BarChart3",
  },
  {
    label: "Integrate-it",
    href: "/portal/integrate-it",
    icon: "Box",
  },
  {
    label: "Reports",
    href: "/portal/reports",
    icon: "BarChart3",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    icon: "BarChart3",
  },
];
