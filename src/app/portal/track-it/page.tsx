import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalTrackItPage() {
  return (
    <PortalSectionPage
      kicker="Workspace access"
      title="Track it"
      description="Track-POD remains the operational engine. This view keeps tracking links, current status, and POD access close to the merchant workflow."
      primaryAction={{ label: "Open Track-it console", href: "/track-it" }}
      secondaryAction={{ label: "Orders", href: "/portal/orders" }}
      cards={[
        { title: "Collection ID", detail: "Stored after Track-POD collection creation.", status: "live" },
        { title: "Delivery ID", detail: "Stored after Track-POD delivery creation.", status: "live" },
        { title: "Tracking link", detail: "Always available from the order record.", status: "live" },
        { title: "POD", detail: "Signature, photos, notes, and completion details.", status: "live" },
      ]}
    />
  );
}
