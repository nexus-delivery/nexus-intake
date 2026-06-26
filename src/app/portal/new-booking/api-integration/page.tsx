import ComingSoonPage from "@/components/ComingSoonPage";

export default function ApiIntegrationPage() {
  return (
    <ComingSoonPage
      title="API Integration"
      description="API integrations will allow merchants to send bookings from internal systems directly into NEXUS."
      plannedCapabilities={[
        "API key management",
        "Booking create and update endpoints",
        "Webhook delivery status callbacks",
      ]}
    />
  );
}
