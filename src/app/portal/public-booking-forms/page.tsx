import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalPublicBookingFormsPage() {
  return (
    <PortalSectionPage
      kicker="Create-it"
      title="Public Booking Forms"
      description="External forms that still route through the same standard Create-it intake service while Wodely replacement remains the active priority."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      cards={[
        { title: "Embeddable form", detail: "Customer-facing form endpoint for direct booking intake.", status: "future" },
        { title: "Storefront bridge", detail: "WooCommerce bridge is deferred until Wodely replacement is confirmed fully stable.", status: "future" },
        { title: "Validation policy", detail: "Shared validation and anti-duplication controls.", status: "future" },
      ]}
    />
  );
}
