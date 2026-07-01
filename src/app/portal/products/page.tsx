import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalProductsPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Products"
      description="Product and service foundations live here. The Doorway booking form accepts whatever the user enters and does not hardcode products."
      primaryAction={{ label: "Book it", href: "/portal/book-it" }}
      secondaryAction={{ label: "Orders", href: "/portal/orders" }}
      cards={[
        { title: "Custom goods lines", detail: "Unlimited line items with code, description, quantity, packages, weight, dimensions, and notes.", status: "live" },
        { title: "No hardcoded catalog", detail: "Booking input is merchant-driven and future-proof.", status: "live" },
        { title: "Xero-ready commercial fields", detail: "Commercial values feed invoice drafts without duplication.", status: "future" },
      ]}
    />
  );
}
