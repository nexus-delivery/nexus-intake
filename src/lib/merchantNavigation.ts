export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const merchantNavItems: NavItem[] = [
  {
    label: "Manage it",
    href: "/portal",
    icon: "Home",
  },
  {
    label: "Book it",
    href: "/portal/book-it",
    icon: "PlusCircle",
  },
  {
    label: "Orders",
    href: "/portal/orders",
    icon: "FileText",
  },
  {
    label: "Track it",
    href: "/portal/track-it",
    icon: "Truck",
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
    label: "Addresses",
    href: "/portal/addresses",
    icon: "Box",
  },
  {
    label: "Products",
    href: "/portal/products",
    icon: "FileCheck",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    icon: "BarChart3",
  },
];
