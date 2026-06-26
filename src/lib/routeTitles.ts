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
};

export function getTitleForPath(pathname: string | null | undefined) {
  if (!pathname) return ROUTE_TITLES["/"];

  // Normalize trailing slashes
  const path = pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;

  // Direct match
  if (ROUTE_TITLES[path]) return ROUTE_TITLES[path];

  // Fallback: try root segment (e.g. /merchants/123 -> /merchants)
  const first = path.split("/")[1];
  if (first) {
    const root = `/${first}`;
    if (ROUTE_TITLES[root]) return ROUTE_TITLES[root];
  }

  return ROUTE_TITLES["/"];
}
