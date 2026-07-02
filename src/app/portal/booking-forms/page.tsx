import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalBookingFormsPage() {
  return (
    <PortalSectionPage
      kicker="Booking Forms"
      title="Booking Forms"
      description="Use one intake service with three merchant booking types: Deliver it, Return it, and Request it."
      primaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      secondaryAction={{ label: "Book it", href: "/portal/book-it" }}
      cards={[
        { title: "Deliver it", detail: "Book a standard delivery from the merchant depot.", status: "live" },
        { title: "Return it", detail: "Book a customer return back to depot.", status: "live" },
        { title: "Request it", detail: "Free-form exception booking for anything unusual.", status: "live" },
      ]}
    />
  );
}
