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
    href: "/portal/new-booking",
    icon: "PlusSquare",
  },
  {
    label: "My Bookings",
    href: "/portal/bookings",
    icon: "ClipboardList",
  },
  {
    label: "Customers",
    href: "/portal/customers",
    icon: "Users",
  },
  {
    label: "Tracking",
    href: "/portal/tracking",
    icon: "Truck",
  },
  {
    label: "Documents",
    href: "/portal/documents",
    icon: "FileCheck",
  },
  {
    label: "Billing",
    href: "/portal/billing",
    icon: "CreditCard",
  },
  {
    label: "Reports",
    href: "/portal/reports",
    icon: "BarChart3",
  },
  {
    label: "Settings",
    href: "/portal/settings",
    icon: "Settings",
  },
];
