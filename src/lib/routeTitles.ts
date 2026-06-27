export const ROUTE_TITLES: Record<string, string> = {
  "/": "The Hub",
  "/create-it": "Create IT",
  "/route-it": "Route IT",
  "/track-it": "Track IT",
  "/store-it": "Store IT",
  "/account-it": "Account IT",
  "/account-it/company-profile": "Company Profile",
  "/account-it/pod-settings": "POD Settings",
  "/account-it/terms-library": "Terms Library",
  "/account-it/terms-library/upload": "Upload & Extract",
  "/auth/beta": "Beta Access",
  "/auth/signup": "Sign Up",
  "/auth/login": "Sign In",
  "/manage-it": "Manage IT",
  "/report-it": "Report IT",
  "/build-it": "Build IT",
  "/improve-it": "Improve IT",
  "/need-it": "Need IT",
  // Legacy routes — kept for backward compatibility
  "/dashboard": "Home",
  "/orders": "Deliveries",
  "/consignments": "Consignments",
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
  "/portal": "Merchant Dashboard",
  "/portal/upload": "Upload Orders",
  "/portal/drafts": "Draft Orders",
  "/portal/live": "Live Deliveries",
  "/portal/documents": "Documents",
  "/portal/finance": "Finance",
  "/portal/warehouse": "Warehouse",
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
