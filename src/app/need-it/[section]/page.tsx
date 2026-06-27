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
  "talk-about-it": {
    title: "Talk About IT",
    summary: "Conversation channels for fast support engagement.",
    mockItems: ["Live chat placeholder", "Support conversation categories", "Response SLA examples"],
  },
  "ask-it": {
    title: "Ask IT",
    summary: "Ticket-style support requests and intake structure.",
    mockItems: ["Question intake queue", "Ticket type placeholders", "Support ownership samples"],
  },
  "read-about-it": {
    title: "Read About IT",
    summary: "Self-service help content and support guidance.",
    mockItems: ["Knowledge article categories", "How-to article placeholders", "Troubleshooting index"],
  },
  "contact-it": {
    title: "Contact IT",
    summary: "Direct contact channels for platform support.",
    mockItems: ["Support contact directory", "Escalation routes", "Business-hours support matrix"],
  },
};

export default async function NeedItSectionPage({
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
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">Need IT Section</p>
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
          <Link href="/need-it" className="mt-5 inline-flex text-sm font-medium text-[#7C3AED] hover:underline">
            Back to Need IT
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
