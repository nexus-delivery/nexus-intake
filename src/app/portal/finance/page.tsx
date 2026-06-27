import ComingSoonPage from "@/components/ComingSoonPage";

export default function FinancePage() {
  return (
    <ComingSoonPage
      title="Finance"
      description="Review billing activity, payouts, and financial summaries for your account."
      plannedCapabilities={[
        "Invoice and payout history",
        "Revenue trend insights",
        "Exportable financial reports",
      ]}
    />
  );
}
