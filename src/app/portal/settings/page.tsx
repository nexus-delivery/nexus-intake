import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalSettingsPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Settings"
      description="Company controls, users, customers, pricing, documents, notifications, and Integrate-it live here."
      primaryAction={{ label: "Workspace", href: "/portal" }}
      secondaryAction={{ label: "Integrate-it", href: "/portal/integrate-it" }}
      cards={[
        { title: "Merchant defaults", detail: "Doorway values are preloaded for the demo.", status: "live" },
        { title: "Integrate-it", detail: "Connect accounting, commerce, operations, comms, and payments per merchant.", href: "/portal/integrate-it", status: "live" },
        { title: "Subscription framework", detail: "Pricing, onboarding, trials, CRM, and partner foundations.", status: "future" },
        { title: "Navigation", detail: "Every merchant page should return to Workspace.", status: "live" },
      ]}
    />
  );
}
