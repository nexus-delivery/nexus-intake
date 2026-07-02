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
    label: "New Order",
    href: "/portal/book-it",
    icon: "PlusCircle",
  },
  {
    label: "Orders",
    href: "/portal/orders",
    icon: "FileText",
  },
  {
    label: "Draft Orders",
    href: "/portal/draft-orders",
    icon: "FileText",
  },
  {
    label: "Booking Forms",
    href: "/portal/booking-forms",
    icon: "FileCheck",
  },
  {
    label: "Booking Templates",
    href: "/portal/booking-templates",
    icon: "FileCheck",
  },
  {
    label: "Public Booking Forms",
    href: "/portal/public-booking-forms",
    icon: "FileCheck",
  },
  {
    label: "WooCommerce Imports",
    href: "/portal/woocommerce-imports",
    icon: "BarChart3",
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
  },
  {
    label: "Manage-it",
    href: "/portal/manage-it",
    icon: "Box",
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
