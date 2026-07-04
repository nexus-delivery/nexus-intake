import AppShell from "@/components/AppShell";
import AccountItOperationsWorkspace from "@/components/AccountItOperationsWorkspace";
import WorkflowStageBanner from "@/components/WorkflowStageBanner";

export default function AccountItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <WorkflowStageBanner
          currentStage="account"
          orderStatus="Invoice and payment operations"
          nextRequiredAction="Generate invoice from processed order and confirm accounting sync"
        />

        <AccountItOperationsWorkspace />
      </div>
    </AppShell>
  );
}
