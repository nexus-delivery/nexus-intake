import AppShell from "@/components/AppShell";
import OrdersStatusBoard from "@/components/OrdersStatusBoard";

export default function ReviewItPage() {
  return (
    <AppShell>
      <OrdersStatusBoard
        scope="admin"
        title="Review it"
        subtitle="Exceptions only: orders requiring intervention, validation failures, address issues, missing data, pricing issues, and workflow exceptions."
      />
    </AppShell>
  );
}
