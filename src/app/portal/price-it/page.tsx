import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalPriceItPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Price it"
      description="Commercial foundation only. Pricing is resolved by Merchant + Catalogue Item and then applied to Commercial values."
      primaryAction={{ label: "Catalogue it", href: "/portal/catalogue-it" }}
      secondaryAction={{ label: "Book it", href: "/portal/book-it" }}
      cards={[
        { title: "Pricing source", detail: "Merchant -> Catalogue Item -> Price it -> Commercial", status: "live" },
        { title: "No hardcoding", detail: "Rates are read from merchant-specific pricing records.", status: "live" },
        { title: "Commercial handoff", detail: "Resolved Net, VAT, and Total flow into booking and invoice prep.", status: "live" },
      ]}
    />
  );
}
