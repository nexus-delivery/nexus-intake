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
    label: "Create-it",
    href: "/portal/create-it",
    icon: "PlusCircle",
  },
  {
    label: "Orders",
    href: "/portal/orders",
    icon: "FileText",
  },
  {
    label: "Booking Forms",
    href: "/portal/booking-forms",
    icon: "FileCheck",
  },
  {
    label: "WooCommerce Imports",
    href: "/portal/woocommerce-imports",
    icon: "BarChart3",
  },
  {
    label: "Customers",
    href: "/portal/customers",
    icon: "Box",
  },
  {
    label: "Collection Addresses",
    href: "/portal/addresses",
    icon: "BarChart3",
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
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
