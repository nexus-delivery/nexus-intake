import ComingSoonPage from "@/components/ComingSoonPage";

export default function DocumentsPage() {
  return (
    <ComingSoonPage
      title="Documents"
      description="Manage key merchant files and delivery paperwork from one organized workspace."
      plannedCapabilities={[
        "Centralized document library",
        "Search and filter by document type",
        "Download and sharing controls",
      ]}
    />
  );
}
