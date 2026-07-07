import AppShell from "@/components/AppShell";
import OrdersStatusBoard from "@/components/OrdersStatusBoard";

export default function OrdersPage() {
  return (
    <AppShell>
      <OrdersStatusBoard
        scope="admin"
        title="Oversee it"
        subtitle="Today's orders first, then date-window filtering, status visibility, and Track-POD references with pagination."
      />
    </AppShell>
  );
}
