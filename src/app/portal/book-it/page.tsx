import StandardOrderForm from "@/components/StandardOrderForm";

export default function PortalBookItPage() {
  return (
    <StandardOrderForm
      sourceSystem="merchant_portal"
      title="New Order"
      subtitle="Create a standard order in Create-it and push the complete intake object to operations."
    />
  );
}
