import AppShell from "@/components/AppShell";
import { WorkspaceHero } from "@/components/WorkspaceDesignSystem";

export default function SettingsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <WorkspaceHero
          kicker="Workspace governance"
          title="Settings"
          description="Configure identity, integrations, billing preferences, team access and environment governance."
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
              <path d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
              <path d="M2 12h2m16 0h2M12 2v2m0 16v2m7.07-15.07l-1.41 1.41M6.34 17.66l-1.41 1.41m0-14.14l1.41 1.41m11.32 11.32l1.41 1.41" />
            </svg>
          }
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            "Brand and identity",
            "Users and permissions",
            "Integration credentials",
            "Integrate-it",
            "Commercial rules",
          ].map((item) => (
            <div key={item} className="nexus-card rounded-2xl px-4 py-4 text-sm text-slate-200">
              {item}
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
