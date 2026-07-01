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
    label: "Catalogue it",
    href: "/portal/catalogue-it",
    icon: "FileCheck",
  },
  {
    label: "Price it",
    href: "/portal/price-it",
    icon: "Box",
  },
  {
    label: "Market it",
    href: "/portal/market-it",
    icon: "Upload",
  },
  {
    label: "Notify it",
    href: "/portal/notify-it",
    icon: "FileText",
  },
  {
    label: "Discuss it",
    href: "/portal/discuss-it",
    icon: "Truck",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    icon: "BarChart3",
  },
];
