import PortalSectionPage from "@/components/PortalSectionPage";

export default function PortalDocumentUploadPage() {
  return (
    <PortalSectionPage
      kicker="Document Upload"
      title="Document Upload"
      description="Coming soon. Document upload and OCR-assisted processing will be introduced later, after the core merchant workspace." 
      primaryAction={{ label: "Documents", href: "/portal/documents" }}
      secondaryAction={{ label: "Create-it", href: "/portal/create-it" }}
      cards={[
        { title: "Upload documents", detail: "Coming soon.", status: "future" },
        { title: "Extract metadata", detail: "Coming soon.", status: "future" },
        { title: "Attach to order", detail: "Coming soon.", status: "future" },
      ]}
    />
  );
}
