import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalOrdersPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Orders"
      description="Review bookings before they move to Track-POD and later Xero. This page is the merchant-facing entry point for all standard orders."
      primaryAction={{ label: "Book it", href: "/portal/book-it" }}
      secondaryAction={{ label: "Workspace", href: "/portal" }}
      cards={[
        { title: "Awaiting review", detail: "Bookings captured but not yet approved for Track-POD.", status: "live" },
        { title: "Ready for Track-POD", detail: "Approved bookings queued for collection and delivery creation.", status: "live" },
        { title: "Completed", detail: "Delivered work ready for proof of delivery and invoicing.", status: "future" },
      ]}
    />
  );
}
