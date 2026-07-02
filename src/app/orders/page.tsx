import AppShell from "@/components/AppShell";
import OrdersStatusBoard from "@/components/OrdersStatusBoard";

export default function OrdersPage() {
  return (
    <AppShell>
      <OrdersStatusBoard
        scope="admin"
        title="Orders and Jobs Dashboard"
        subtitle="All orders with lifecycle state, Track-POD status, IDs, errors, and timeline history."
      />
    </AppShell>
  );
}
