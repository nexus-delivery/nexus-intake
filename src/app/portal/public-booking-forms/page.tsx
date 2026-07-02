import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalPublicBookingFormsPage() {
  return (
    <PortalSectionPage
      kicker="Create-it"
      title="Public Booking Forms"
      description="External forms that still route through the same standard Create-it intake service."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "WooCommerce Imports", href: "/portal/woocommerce-imports" }}
      cards={[
        { title: "Embeddable form", detail: "Customer-facing form endpoint for direct booking intake.", status: "future" },
        { title: "Storefront bridge", detail: "WooCommerce compatible path for migration away from Wodely.", status: "future" },
        { title: "Validation policy", detail: "Shared validation and anti-duplication controls.", status: "future" },
      ]}
    />
  );
}
