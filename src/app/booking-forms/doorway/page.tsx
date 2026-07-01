import AppShell from "@/components/AppShell";
import DoorwayBookingForm from "@/components/DoorwayBookingForm";

export default function DoorwayPublicBookingPage() {
  return (
    <AppShell>
      <DoorwayBookingForm
        sourceSystem="public_webform"
        modeLabel="Doorway Public Booking Form"
        intro="Public Doorway booking demonstration using the same standard order object as the merchant portal."
      />
    </AppShell>
  );
}
