import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalBookingTemplatesPage() {
  return (
    <PortalSectionPage
      kicker="Create-it"
      title="Booking Templates"
      description="Template booking structures for repeated deliveries and standard service defaults."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "Booking Forms", href: "/portal/booking-forms" }}
      cards={[
        { title: "Depot delivery template", detail: "Standard delivery structure from default depot.", status: "future" },
        { title: "Returns template", detail: "Standard customer-return booking structure.", status: "future" },
        { title: "Exception template", detail: "Reusable unusual-request structure.", status: "future" },
      ]}
    />
  );
}
