import CustomerPortalShell from "@/components/CustomerPortalShell";
import CustomerOrdersModule from "@/components/CustomerOrdersModule";

export default function CustomerOrdersPage() {
  return (
    <CustomerPortalShell>
      <CustomerOrdersModule mode="orders" />
    </CustomerPortalShell>
  );
}
