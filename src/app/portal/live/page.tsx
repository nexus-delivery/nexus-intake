import ComingSoonPage from "@/components/ComingSoonPage";

export default function LiveDeliveriesPage() {
  return (
    <ComingSoonPage
      title="Live Deliveries"
      description="Monitor active deliveries in real time, including status updates and route progress."
      plannedCapabilities={[
        "Real-time delivery tracking",
        "Driver status and ETA visibility",
        "Delivery exception alerts",
      ]}
    />
  );
}
