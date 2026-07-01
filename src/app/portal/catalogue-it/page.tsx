import CatalogueItPanel from "@/components/CatalogueItPanel";

export default function PortalCatalogueItPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Catalogue It</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          The commercial engine for products, services, labour, storage, and surcharges.
        </p>
      </section>

      <CatalogueItPanel />
    </div>
  );
}
