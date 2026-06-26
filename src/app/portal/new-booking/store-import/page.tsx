import ComingSoonPage from "@/components/ComingSoonPage";

export default function StoreImportPage() {
  return (
    <ComingSoonPage
      title="Store Import"
      description="Store channel imports will let merchants pull booking requests directly from connected storefronts."
      plannedCapabilities={[
        "Store connector setup",
        "Automatic booking ingestion",
        "Customer mapping and deduplication",
      ]}
    />
  );
}
