import StandardOrderForm from "@/components/StandardOrderForm";

export default function EmbeddedBookingFormPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <StandardOrderForm
        sourceSystem="embedded_webform"
        title="Embedded Booking Form"
        subtitle="Use this route inside iframe embeds for customer websites while preserving the Nexus standard schema."
      />
    </main>
  );
}
