import ComingSoonPage from "@/components/ComingSoonPage";

export default function ReportsPage() {
  return (
    <ComingSoonPage
      title="Reports"
      description="Reports will deliver operational analytics for bookings, consignments, and service performance."
      plannedCapabilities={[
        "Booking volume trends",
        "On-time delivery reporting",
        "Customer activity dashboards",
      ]}
    />
  );
}
