import StandardOrderForm from "@/components/StandardOrderForm";

export default function PublicBookingFormPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <StandardOrderForm
        sourceSystem="public_webform"
        title="Public Booking Form"
        subtitle="Public web intake that creates exactly the same standard order object as merchant and internal channels."
      />
    </main>
  );
}
