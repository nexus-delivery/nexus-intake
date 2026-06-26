import ComingSoonPage from "@/components/ComingSoonPage";

export default function SettingsPage() {
  return (
    <ComingSoonPage
      title="Settings"
      description="Settings will centralize merchant account configuration, API keys, and integration management."
      plannedCapabilities={[
        "Account profile and team access",
        "API credential management",
        "Integration setup controls",
      ]}
    />
  );
}
