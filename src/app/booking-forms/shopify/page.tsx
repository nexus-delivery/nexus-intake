import AppShell from "@/components/AppShell";
import StandardOrderForm from "@/components/StandardOrderForm";

export default function ShopifyIntakePage() {
  return (
    <AppShell>
      <StandardOrderForm
        sourceSystem="shopify"
        title="Shopify-Compatible Intake"
        subtitle="Map Shopify order data into the same NEXUS standard order object with no channel-specific variance."
      />
    </AppShell>
  );
}
