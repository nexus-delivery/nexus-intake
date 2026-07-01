import AppShell from "@/components/AppShell";
import StandardOrderForm from "@/components/StandardOrderForm";

export default function CreateItPage() {
  return (
    <AppShell>
      <StandardOrderForm
        sourceSystem="merchant_portal"
        title="Merchant Booking Form"
        subtitle="Create bookings in NEXUS and push jobs into one standard order object."
      />
    </AppShell>
  );
}
