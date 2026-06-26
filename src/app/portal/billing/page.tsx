import ComingSoonPage from "@/components/ComingSoonPage";

export default function BillingPage() {
  return (
    <ComingSoonPage
      title="Billing"
      description="Billing will provide invoice visibility, payment history, and usage summaries for each merchant account."
      plannedCapabilities={[
        "Invoice list and download",
        "Payment status tracking",
        "Usage-based billing summary",
      ]}
    />
  );
}
