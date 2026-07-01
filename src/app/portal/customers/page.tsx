import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalCustomersPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Customers"
      description="Customer accounts, merchant relationships, and service history belong here."
      primaryAction={{ label: "Orders", href: "/portal/orders" }}
      secondaryAction={{ label: "Documents", href: "/portal/documents" }}
      cards={[
        { title: "Doorway Group LTD", detail: "Merchant demo account used for the sprint deliverable.", status: "active" },
        { title: "Account contacts", detail: "Email and phone fields for support and operations follow each customer.", status: "live" },
        { title: "Order history", detail: "Booking, tracking, and POD timeline for dispute resolution.", status: "future" },
      ]}
    />
  );
}
