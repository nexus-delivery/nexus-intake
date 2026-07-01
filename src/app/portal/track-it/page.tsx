import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalTrackItPage() {
  return (
    <div className="space-y-6">
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

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <h2 className="text-lg font-semibold text-slate-950">Current Sprint Signals</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">2 MAN</p>
            <p className="mt-1">Applicable jobs include 2 MAN in Track-POD reference and notes.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <p className="font-semibold text-slate-900">Card Collection on Delivery</p>
            <p className="mt-1">NEXUS does not collect cash. Card payments only. 5% handling applies.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
