import OrdersStatusBoard from "@/components/OrdersStatusBoard";

export default function PortalOrdersPage() {
  return (
    <OrdersStatusBoard
      scope="merchant"
      title="Merchant Orders"
      subtitle="NEXUS is the system of record. Status timeline is synchronized from Track-POD events."
    />
  );
}
