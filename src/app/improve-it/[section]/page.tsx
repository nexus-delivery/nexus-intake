import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/AppShell";

const sectionContent: Record<
  string,
  {
    title: string;
    summary: string;
    mockItems: string[];
  }
> = {
  "suggest-it": {
    title: "Suggest it",
    summary: "Submit an idea or suggestion to help shape the future of the platform.",
    mockItems: ["Suggestion intake form", "Submitted ideas queue", "Status tracking for your submissions"],
  },
  "consider-it": {
    title: "Consider it",
    summary: "Browse and vote on feature requests from the community and the wider business.",
    mockItems: ["Top-voted requests", "Vote trend snapshot", "Priority threshold examples"],
  },
  "dream-it": {
    title: "Dream it",
    summary: "See what capabilities are planned — explore the product roadmap ahead.",
    mockItems: ["Upcoming feature shortlist", "Sprint planning preview", "Long-range capability direction"],
  },
  "fix-it": {
    title: "Fix it",
    summary: "Report a bug, broken feature or unexpected behaviour on the platform.",
    mockItems: ["Bug report intake form", "Issue severity categories", "Resolution status tracker"],
  },
  // legacy slugs kept for backward compatibility
  "vote-it": {
    title: "Consider it",
    summary: "Browse and vote on feature requests from the community and the wider business.",
    mockItems: ["Top-voted requests", "Vote trend snapshot", "Priority threshold examples"],
  },
  "future-it": {
    title: "Dream it",
    summary: "See what capabilities are planned — explore the product roadmap ahead.",
    mockItems: ["Upcoming feature shortlist", "Sprint planning preview", "Long-range capability direction"],
  },
  "report-it": {
    title: "Fix it",
    summary: "Report a bug, broken feature or unexpected behaviour on the platform.",
    mockItems: ["Bug report intake form", "Issue severity categories", "Resolution status tracker"],
  },
};

export default async function ImproveItSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const content = sectionContent[section];

  if (!content) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Improve it</p>
          <h1 className="mt-2 text-3xl font-semibold text-[#111827]">{content.title}</h1>
          <p className="mt-2 text-sm text-slate-600">{content.summary}</p>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Mock Data</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {content.mockItems.map((item) => (
              <li key={item} className="rounded-xl bg-slate-50 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
          <Link href="/improve-it" className="mt-5 inline-flex text-sm font-medium text-[#7C3AED] hover:underline">
            ← Back to Improve it
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
