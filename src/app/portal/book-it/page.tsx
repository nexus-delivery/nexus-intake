import StandardOrderForm from "@/components/StandardOrderForm";

export default function PortalBookItPage() {
  return (
    <StandardOrderForm
      sourceSystem="merchant_portal"
      title="Book it"
      subtitle="Create bookings from depot defaults or one-off collection addresses. Every booking writes a complete intake record in NEXUS."
    />
  );
}
