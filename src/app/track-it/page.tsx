import AppShell from "@/components/AppShell";
import TrackItBoard from "@/components/TrackItBoard";

export default function TrackItPage() {
  return (
    <AppShell>
      <TrackItBoard
        scope="admin"
        title="Track it"
        subtitle="Accepted orders, provisional routing, tracking links, and live status across all merchants."
      />
    </AppShell>
  );
}
