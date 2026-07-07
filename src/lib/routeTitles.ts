export const ROUTE_TITLES: Record<string, string> = {
  "/": "Oversee it",
  "/dashboard": "Oversee it",
  "/choose-it": "Choose it",
  "/create-it": "Create it",
  "/integrate-it": "Integrate it",
  "/document-it": "Document it",
  "/communicate-it": "Communicate it",
  "/route-it": "Route it",
  "/track-it": "Track it",
  "/review-it": "Review it",
  "/store-it": "Store it",
  "/account-it": "Account it",
  "/account-it/company-profile": "Company Profile",
  "/account-it/pod-settings": "POD Settings",
  "/account-it/terms-library": "Terms Library",
  "/account-it/terms-library/upload": "Upload & Extract",
  "/signin": "Sign in to Nexus it today",
  "/signup": "Create Nexus it today account",
  "/onboarding": "Onboarding",
  "/auth/callback": "Auth Callback",
  "/auth/beta": "Beta Access",
  "/auth/signup": "Sign Up",
  "/auth/login": "Sign In",
  "/manage-it": "Oversee it",
  "/manage-it/dashboard": "Oversee Dashboard",
  "/manage-it/customers": "Oversee Customers",
  "/manage-it/companies": "Oversee Merchants",
  "/manage-it/document-centre": "Oversee Documents",
  "/manage-it/document-it": "Document it",
  "/manage-it/search-it": "Search it",
  "/manage-it/settings": "Oversee Settings",
  "/manage-it/team-management": "Oversee Team",
  "/manage-it/integrations": "Oversee Integrations",
  "/manage-it/subscriptions": "Oversee Subscriptions",
  "/manage-it/platform": "Oversee Platform",
  "/report-it": "Report it",
  "/build-it": "Build it",
  "/improve-it": "Improve it",
  "/model-it": "Model it",
  "/tell-it": "Tell it",
  "/need-it": "Need it",
  "/portal/intake": "Upload it",
  // Legacy routes — kept for backward compatibility
  "/orders": "Oversee it",
  "/consignments": "Consignments",
  "/merchants": "Merchants",
  "/customers": "Customers",
  "/document-centre": "Documents",
  "/planning": "Planning",
  "/drivers": "Fleet",
  "/warehouse": "Warehouse",
  "/finance": "Finance",
  "/reports": "Reports",
  "/settings": "Settings",
  "/support": "Support",
  "/portal": "Oversee it",
  "/portal/book-it": "Create it",
  "/portal/create-it": "Create-it",
  "/portal/manage-it": "Manage-it",
  "/portal/orders": "Oversee it",
  "/portal/draft-orders": "Draft Orders",
  "/portal/track-it": "Track it",
  "/portal/customers": "Customers",
  "/portal/integrate-it": "Integrate it",
  "/portal/booking-forms": "Booking Forms",
  "/portal/booking-templates": "Booking Templates",
  "/portal/public-booking-forms": "Public Booking Forms",
  "/portal/woocommerce-imports": "WooCommerce Imports",
  "/portal/ocr-upload": "OCR Upload",
  "/portal/document-upload": "Document Upload",
  "/portal/settings": "Settings",
  "/customer": "Customer Dashboard",
  "/customer/orders": "Customer Orders",
  "/customer/track-order": "Track Order",
  "/customer/documents": "Customer Documents",
  "/customer/invoices": "Customer Invoices",
  "/customer/notifications": "Customer Notifications",
  "/portal/catalogue-it": "Catalogue it",
  "/portal/price-it": "Price it",
  "/portal/market-it": "Market it",
  "/portal/notify-it": "Notify it",
  "/portal/discuss-it": "Discuss it",
  "/portal/upload": "Upload Orders",
  "/portal/drafts": "Draft Orders",
  "/portal/live": "Track it",
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
