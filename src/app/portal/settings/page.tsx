import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalSettingsPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Settings"
      description="Portal defaults, tenant preferences, and future subscription controls live here."
      primaryAction={{ label: "Workspace", href: "/portal" }}
      secondaryAction={{ label: "Book it", href: "/portal/book-it" }}
      cards={[
        { title: "Merchant defaults", detail: "Doorway values are preloaded for the demo.", status: "live" },
        { title: "Subscription framework", detail: "Pricing, onboarding, trials, CRM, and partner foundations.", status: "future" },
        { title: "Navigation", detail: "Every merchant page should return to Workspace.", status: "live" },
      ]}
    />
  );
}
