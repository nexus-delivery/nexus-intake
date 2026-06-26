export const ROUTE_TITLES: Record<string, string> = {
  "/": "Home",
  "/dashboard": "Home",
  "/orders": "New Delivery",
  "/consignments": "My Deliveries",
  "/merchants": "Customers",
  "/customers": "Customers",
  "/document-centre": "Documents",
  "/planning": "Planning",
  "/drivers": "Fleet",
  "/warehouse": "Warehouse",
  "/finance": "Finance",
  "/reports": "Reports",
  "/settings": "Settings",
  "/support": "Support",
  "/portal": "Dashboard",
  "/portal/new-booking": "New Booking",
  "/portal/new-booking/upload-documents": "Upload Documents",
  "/portal/new-booking/manual-entry": "Manual Entry",
  "/portal/new-booking/csv-import": "CSV Import",
  "/portal/new-booking/store-import": "Store Import",
  "/portal/new-booking/api-integration": "API Integration",
  "/portal/bookings": "My Bookings",
  "/portal/customers": "Customers",
  "/portal/tracking": "Tracking",
  "/portal/documents": "Documents",
  "/portal/billing": "Billing",
  "/portal/reports": "Reports",
  "/portal/settings": "Settings",
};

export function getTitleForPath(pathname: string | null | undefined) {
  if (!pathname) return ROUTE_TITLES["/"];

  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  if (ROUTE_TITLES[path]) return ROUTE_TITLES[path];

  const first = path.split("/")[1];
  if (first) {
    const root = `/${first}`;
    if (ROUTE_TITLES[root]) return ROUTE_TITLES[root];
  }

  return ROUTE_TITLES["/"];
}
