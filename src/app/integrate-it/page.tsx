import AppShell from "@/components/AppShell";
import IntegrateItManager from "@/components/IntegrateItManager";
import WorkflowStageBanner from "@/components/WorkflowStageBanner";

export default function IntegrateItPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <WorkflowStageBanner
          currentStage="account"
          orderStatus="Integration connection and health"
          nextRequiredAction="Connect provider, then continue operations in Create, Process, or Account it"
        />
        <IntegrateItManager />
      </div>
    </AppShell>
  );
}
