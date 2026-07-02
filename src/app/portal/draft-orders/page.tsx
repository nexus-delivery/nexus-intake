import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalDraftOrdersPage() {
  return (
    <PortalSectionPage
      kicker="Create-it"
      title="Draft Orders"
      description="Draft intake records pending review before full operational progression."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "Orders", href: "/portal/orders" }}
      cards={[
        { title: "Draft queue", detail: "Review incomplete and staged draft orders.", status: "live" },
        { title: "Validation", detail: "Check mandatory addresses, goods and service fields.", status: "live" },
        { title: "Operations handoff", detail: "Promote validated drafts into live order flow.", status: "future" },
      ]}
    />
  );
}
