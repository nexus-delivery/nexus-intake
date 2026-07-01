import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalMarketItPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Market it"
      description="Placeholder navigation only for this sprint."
      primaryAction={{ label: "Dashboard", href: "/portal" }}
      secondaryAction={{ label: "Settings", href: "/portal/settings" }}
      cards={[
        { title: "Foundation", detail: "Module placeholder is available from merchant navigation.", status: "future" },
        { title: "Scope", detail: "No campaign or CRM implementation in Sprint 1.", status: "future" },
      ]}
    />
  );
}
