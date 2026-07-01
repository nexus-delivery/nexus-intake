import AppShell from "@/components/AppShell";
import { MERCHANT_BOOKING_FORMS, MERCHANT_WEB_FORMS } from "@/lib/modelIt";

export default function BookingFormsPage() {
  return (
    <AppShell>
      <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Booking Forms</p>
          <h1 className="text-3xl font-semibold text-slate-950">Merchant booking and web form models</h1>
        </div>
        <p className="text-sm text-slate-600">
          Merchant-specific form models are now active. BLB and Doorway each run independent booking and web form configurations.
        </p>

        <div className="grid gap-4 lg:grid-cols-2">
          {MERCHANT_BOOKING_FORMS.map((form) => (
            <article key={form.formKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Booking model</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-900">{form.merchantName}</h2>
              <p className="text-xs text-slate-500">{form.formKey}</p>

              <div className="mt-4 space-y-3 text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">Required fields</p>
                  <p className="text-xs text-slate-600">{form.requiredFields.map((field) => field.label).join(" | ")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Optional fields</p>
                  <p className="text-xs text-slate-600">{form.optionalFields.map((field) => field.label).join(" | ")}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Collection workflow</p>
                  <p className="text-xs text-slate-600">{form.collectionWorkflow}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Delivery workflow</p>
                  <p className="text-xs text-slate-600">{form.deliveryWorkflow}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Defaults</p>
                  <p className="text-xs text-slate-600">Services: {form.defaultServices.join(" | ")}</p>
                  <p className="text-xs text-slate-600">Pricing: {form.defaultPricing}</p>
                  <p className="text-xs text-slate-600">Warehouse: {form.defaultWarehouse}</p>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Public web forms</h2>
          <div className="grid gap-3 lg:grid-cols-3">
            {MERCHANT_WEB_FORMS.map((form) => (
              <article key={form.formKey} className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-900">{form.merchantName}</p>
                <p className="mt-0.5 text-xs text-slate-500">{form.publicPath}</p>
                <p className="mt-2 text-xs text-slate-700">Status: {form.status}</p>
                <p className="mt-2 text-xs text-slate-600">Required: {form.requiredFields.join(" | ")}</p>
                <p className="mt-1 text-xs text-slate-600">Optional: {form.optionalFields.join(" | ")}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
