import AppShell from "@/components/AppShell";
import ProcessItQueue from "@/components/ProcessItQueue";

export const metadata = {
  title: "Process it — Nexus it Today",
};

export default function ProcessItPage() {
  return (
    <AppShell>
      <ProcessItQueue />
    </AppShell>
  );
}
