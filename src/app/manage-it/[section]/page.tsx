import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";
import ManageItControlRoom from "@/components/ManageItControlRoom";
import { getManageItSection } from "@/lib/manageIt";

export default async function ManageItSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const currentSection = getManageItSection(section);

  if (!currentSection) {
    notFound();
  }

  return (
    <AppShell>
      <ManageItControlRoom sectionSlug={currentSection.slug} />
    </AppShell>
  );
}
