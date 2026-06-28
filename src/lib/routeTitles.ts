export const ROUTE_TITLES: Record<string, string> = {
  "/": "Manage it.",
  "/create-it": "Create it.",
  "/route-it": "Route it.",
  "/track-it": "Track it.",
  "/store-it": "Store it.",
  "/account-it": "Account it.",
  "/account-it/company-profile": "Company Profile",
  "/account-it/pod-settings": "POD Settings",
  "/account-it/terms-library": "Terms Library",
  "/account-it/terms-library/upload": "Upload & Extract",
  "/signin": "Sign in to Nexus it.",
  "/signup": "Create Nexus it. account",
  "/onboarding": "Onboarding",
  "/auth/callback": "Auth Callback",
  "/auth/beta": "Beta Access",
  "/auth/signup": "Sign Up",
  "/auth/login": "Sign In",
  "/manage-it": "Manage it.",
  "/manage-it/dashboard": "Manage it. Dashboard",
  "/manage-it/customers": "Manage it. Customers",
  "/manage-it/companies": "Manage it. Companies",
  "/manage-it/document-centre": "Manage it. Documents",
  "/manage-it/document-it": "Document it.",
  "/manage-it/search-it": "Search it.",
  "/manage-it/settings": "Manage it. Settings",
  "/manage-it/team-management": "Manage it. Team",
  "/manage-it/integrations": "Manage it. Integrations",
  "/manage-it/subscriptions": "Manage it. Subscriptions",
  "/manage-it/platform": "Manage it. Platform",
  "/report-it": "Report it.",
  "/build-it": "Build it.",
  "/improve-it": "Improve it.",
  "/need-it": "Need it.",
  "/portal/intake": "Upload it.",
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
