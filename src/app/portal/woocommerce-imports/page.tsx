import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalWooCommerceImportsPage() {
  return (
    <PortalSectionPage
      kicker="WooCommerce Imports"
      title="WooCommerce Imports"
      description="Prepared for CTNI and THDG so WooCommerce orders can flow directly into the standard Create-it intake service."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "Orders", href: "/portal/orders" }}
      cards={[
        { title: "CTNI", detail: "Direct import path ready for checkout-to-NEXUS mapping.", status: "future" },
        { title: "THDG", detail: "Direct import path ready for checkout-to-NEXUS mapping.", status: "future" },
        { title: "Checkout snippet", detail: "Capture pickup and collection details at checkout, replacing Wodely capture logic.", status: "future" },
      ]}
    />
  );
}
