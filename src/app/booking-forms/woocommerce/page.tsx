import AppShell from "@/components/AppShell";
import StandardOrderForm from "@/components/StandardOrderForm";

export default function WooCommerceIntakePage() {
  return (
    <AppShell>
      <StandardOrderForm
        sourceSystem="woocommerce"
        title="WooCommerce-Compatible Intake"
        subtitle="Map WooCommerce checkout/order payloads into the same standard order object used across NEXUS."
      />
    </AppShell>
  );
}
