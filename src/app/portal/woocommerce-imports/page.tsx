import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalWooCommerceImportsPage() {
  return (
    <PortalSectionPage
      kicker="WooCommerce Imports"
      title="WooCommerce Imports"
      description="Prepared so WooCommerce orders can flow directly into the standard Create-it intake service."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "Orders", href: "/portal/orders" }}
      cards={[
        { title: "Merchant storefronts", detail: "Direct import path ready for checkout-to-NEXUS mapping.", status: "future" },
        { title: "Webhook ingestion", detail: "WooCommerce events can land inside Merchant Orders and Process-it.", status: "future" },
        { title: "Checkout snippet", detail: "Capture pickup and collection details at checkout, replacing Wodely capture logic.", status: "future" },
      ]}
    />
  );
}
