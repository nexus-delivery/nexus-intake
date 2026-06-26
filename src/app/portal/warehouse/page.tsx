import ComingSoonPage from "@/components/ComingSoonPage";

export default function WarehousePage() {
  return (
    <ComingSoonPage
      title="Warehouse"
      description="Coordinate stock movement and warehouse operations for upcoming deliveries."
      plannedCapabilities={[
        "Inbound and outbound movement tracking",
        "Inventory snapshot visibility",
        "Warehouse task status updates",
      ]}
    />
  );
}
