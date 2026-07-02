import CustomerPortalShell from "@/components/CustomerPortalShell";
import CustomerOrdersModule from "@/components/CustomerOrdersModule";

export default function CustomerTrackOrderPage() {
  return (
    <CustomerPortalShell>
      <CustomerOrdersModule mode="track" />
    </CustomerPortalShell>
  );
}
