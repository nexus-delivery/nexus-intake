import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalManageItPage() {
  return (
    <PortalSectionPage
      kicker="Administration"
      title="Manage-it"
      description="Administration workspace for merchant configuration while Create-it stays operational."
      primaryAction={{ label: "Customers", href: "/portal/customers" }}
      secondaryAction={{ label: "Collection Addresses", href: "/portal/addresses" }}
      cards={[
        { title: "Company", detail: "Organisation identity and profile controls.", status: "live" },
        { title: "Users", detail: "Merchant user access and roles.", status: "future" },
        { title: "Customers", detail: "Merchant customer management.", href: "/portal/customers", status: "live" },
        { title: "Collection Addresses", detail: "Manage multiple depot and pickup profiles.", href: "/portal/addresses", status: "live" },
        { title: "Pricing", detail: "Pricing controls and commercial policy.", status: "future" },
        { title: "Document it", detail: "Document layer controls and visibility.", href: "/document-it", status: "live" },
        { title: "Communicate it", detail: "CRM and human communication workflows.", href: "/communicate-it", status: "live" },
        { title: "Notify it", detail: "Automated messaging rules and triggers.", status: "future" },
        { title: "Integrate it", detail: "Integration marketplace and provider controls.", href: "/portal/integrate-it", status: "live" },
        { title: "Settings", detail: "Merchant workspace settings.", href: "/portal/settings", status: "live" },
      ]}
    />
  );
}
