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
  "learn-it": {
    title: "Learn IT",
    summary: "Platform knowledge and operating context for building IT.",
    mockItems: ["Spotlight language standards", "Hub and navigation principles", "Delivery terminology reference"],
  },
  "steer-it": {
    title: "Steer IT",
    summary: "Direction, priorities and guardrails for near-term delivery.",
    mockItems: ["Current strategic themes", "Priority stack ranking", "Constraint and risk watchlist"],
  },
  "think-it": {
    title: "Think IT",
    summary: "Problem framing and options before execution begins.",
    mockItems: ["Open problem statements", "Option analysis notes", "Decision-ready assumptions"],
  },
  "market-it": {
    title: "Market IT",
    summary: "Go-to-market planning and communication readiness.",
    mockItems: ["Launch messaging draft", "Audience positioning notes", "Campaign readiness checklist"],
  },
  "sell-it": {
    title: "Sell IT",
    summary: "Commercial enablement content and handoff readiness.",
    mockItems: ["Sales enablement pack", "Pricing narrative draft", "Customer objection handling notes"],
  },
  roadmap: {
    title: "Roadmap",
    summary: "Planned initiatives and sequencing for upcoming sprints.",
    mockItems: ["Q3 initiative map", "Milestone forecast", "Dependency timeline"],
  },
  sprint: {
    title: "Sprint",
    summary: "Current sprint scope, commitments and checkpoints.",
    mockItems: ["Sprint goal statement", "In-scope work items", "Delivery checkpoint calendar"],
  },
  progress: {
    title: "Progress",
    summary: "Status tracking for sprint and milestone completion.",
    mockItems: ["Completion by stream", "Milestone burn summary", "Blocker escalation log"],
  },
  architecture: {
    title: "Architecture",
    summary: "System structure and technical implementation decisions.",
    mockItems: ["Service boundary diagram", "Data model snapshot", "Architecture decision index"],
  },
  integrations: {
    title: "Integrations",
    summary: "External systems and integration status across the platform.",
    mockItems: ["Connected systems list", "Integration readiness status", "API contract references"],
  },
  issues: {
    title: "Issues",
    summary: "Known defects, technical debt and tracked blockers.",
    mockItems: ["Open defect queue", "Technical debt register", "Escalated blocker list"],
  },
  decisions: {
    title: "Decisions",
    summary: "Documented product and technical decisions for traceability.",
    mockItems: ["Recent decision log", "Pending decision proposals", "Decision ownership map"],
  },
  "release-notes": {
    title: "Release Notes",
    summary: "Published changes by release with impact summaries.",
    mockItems: ["Latest release summary", "Breaking change alerts", "Feature-by-feature changelog"],
  },
};

export default async function BuildItSectionPage({
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Build IT Section</p>
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
          <Link href="/build-it" className="mt-5 inline-flex text-sm font-medium text-[#7C3AED] hover:underline">
            Back to Build IT
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
