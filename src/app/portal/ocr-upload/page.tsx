import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalOcrUploadPage() {
  return (
    <PortalSectionPage
      kicker="OCR Upload"
      title="OCR Upload"
      description="Coming soon. OCR and document-extraction flows will be added after the core merchant experience is complete."
      primaryAction={{ label: "Documents", href: "/portal/documents" }}
      secondaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      cards={[
        { title: "OCR pipeline", detail: "Coming soon.", status: "future" },
        { title: "Review queue", detail: "Coming soon.", status: "future" },
        { title: "Auto-create order", detail: "Coming soon.", status: "future" },
      ]}
    />
  );
}
