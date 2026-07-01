import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalAddressesPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Addresses"
      description="Saved collection and delivery addresses help reduce re-entry and support the shared standard order object."
      primaryAction={{ label: "Book it", href: "/portal/book-it" }}
      secondaryAction={{ label: "Customers", href: "/portal/customers" }}
      cards={[
        { title: "Collection addresses", detail: "Pickup and invoice-side address records.", status: "live" },
        { title: "Delivery addresses", detail: "Drop-off locations for Doorway and future merchants.", status: "live" },
        { title: "Re-use controls", detail: "Keep addresses consistent across portal, public forms, and integrations.", status: "future" },
      ]}
    />
  );
}
