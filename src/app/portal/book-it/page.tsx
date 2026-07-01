import DoorwayBookingForm from "@/components/DoorwayBookingForm";

export default function PortalBookItPage() {
  return (
    <DoorwayBookingForm
      sourceSystem="merchant_portal"
      modeLabel="Doorway Booking Form"
      intro="Merchant booking demo for Doorway Group LTD. Every booking writes one standard order object for Track-POD and future Xero handling."
    />
  );
}
