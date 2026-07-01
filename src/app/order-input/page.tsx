import AppShell from "@/components/AppShell";
import StandardOrderForm from "@/components/StandardOrderForm";

export default function OrderInputPage() {
  return (
    <AppShell>
      <StandardOrderForm
        sourceSystem="internal_order_entry"
        title="Internal Order Entry"
        subtitle="Use this screen for operations, telephone, and email order capture using the same standard schema."
      />
    </AppShell>
  );
}
