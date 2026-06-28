import Link from "next/link";
import AppShell from "@/components/AppShell";

const knowledgeSections = [
  {
    category: "Platform Philosophy",
    articles: [
      {
        title: "The IT Language",
        summary:
          "Every capability in Nexus IT must naturally follow the word IT. Create IT, Route IT, Track IT — if a name does not work after IT, do not use it.",
        tag: "Core",
      },
      {
        title: "The Hub",
        summary:
          "The Hub is the platform homepage. It is where IT happens. The Hub asks one question: What would you like to IT today? Everything starts from The Hub.",
        tag: "Core",
      },
      {
        title: "Spotlights",
        summary:
          "Every major capability is a Spotlight. Each Spotlight has one purpose. No overlap. No duplicate functionality. The Hub launches Spotlights.",
        tag: "Core",
      },
      {
        title: "Sprint Zero",
        summary:
          "Sprint Zero is about architecture, not features. Build every Spotlight. Create placeholder cards where functionality is not yet complete. Structure first. Features follow.",
        tag: "Process",
      },
    ],
  },
  {
    category: "Technical Stack",
    articles: [
      {
        title: "Next.js & React",
        summary:
          "The platform is built on Next.js (App Router) with React and TypeScript. Server components are the default. Client components use the 'use client' directive.",
        tag: "Tech",
      },
      {
        title: "Tailwind CSS",
        summary:
          "Styling is done with Tailwind CSS v4. Design tokens are in globals.css as CSS custom properties (--nexus-purple, --nexus-graphite, etc.). Do not introduce new CSS frameworks.",
        tag: "Tech",
      },
      {
        title: "Supabase",
        summary:
          "The database and authentication layer is Supabase. The client is initialised in src/lib/supabaseClient.ts with graceful fallback for missing environment variables.",
        tag: "Tech",
      },
      {
        title: "AppShell & Sidebar",
        summary:
          "All Spotlight pages use AppShell which provides the dark sidebar navigation and light content area. The sidebar nav items must always mirror The Hub Spotlights.",
        tag: "Tech",
      },
    ],
  },
  {
    category: "Design Language",
    articles: [
      {
        title: "The Hub is Dark",
        summary:
          "The Hub uses a dark background (#111827). Spotlights are calm — light, clean and minimal. This visual contrast makes the Spotlight concept feel real.",
        tag: "Design",
      },
      {
        title: "Spotlight Hover Effects",
        summary:
          "Hub cards use the .hub-card and .hub-grid CSS classes. On hover: card lifts (translateY), soft purple glow appears, neighbouring cards fade to 55% opacity. Transitions are 250ms.",
        tag: "Design",
      },
      {
        title: "Spotlight Page Cards",
        summary:
          "Cards inside Spotlight pages follow the rounded-[28px] border pattern. Live sections have emerald status badges. Coming Soon sections are shown at 60% opacity.",
        tag: "Design",
      },
      {
        title: "NEXUS Purple",
        summary:
          "The primary brand colour is #7C3AED (--nexus-purple). Use it for icons, borders, accents and active states. The graphite colour (#111827) is used for headings and the sidebar.",
        tag: "Design",
      },
    ],
  },
  {
    category: "Naming Conventions",
    articles: [
      {
        title: "Operational Spotlights",
        summary:
          "Create IT, Route IT, Track IT, Store IT, Account IT, Manage IT, Report IT. These are the seven core operational capabilities of the platform.",
        tag: "Naming",
      },
      {
        title: "Platform Spotlights",
        summary:
          "Build IT (development centre), Improve IT (customer improvement), Need IT (customer support). These are platform-level capabilities distinct from daily operations.",
        tag: "Naming",
      },
      {
        title: "Route Structure",
        summary:
          "Spotlight routes use kebab-case: /create-it, /route-it, /track-it, etc. Sub-sections within a Spotlight live under its route: /build-it/learn-it.",
        tag: "Naming",
      },
    ],
  },
];

const tagColors: Record<string, string> = {
  Core: "bg-[#7C3AED]/10 text-[#7C3AED]",
  Process: "bg-blue-50 text-blue-700",
  Tech: "bg-slate-100 text-slate-700",
  Design: "bg-pink-50 text-pink-700",
  Naming: "bg-amber-50 text-amber-700",
};

export default function LearnItPage() {
  return (
    <AppShell>
      <div className="space-y-8">
        {/* Hero */}
        <div className="rounded-[32px] border border-[#7C3AED]/20 bg-gradient-to-br from-[#7C3AED]/5 to-white p-8 shadow-sm">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
                <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#7C3AED]">
                  Build IT
                </p>
                <span className="text-slate-300">›</span>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                  Learn IT
                </p>
              </div>
              <h1 className="mt-1 text-3xl font-semibold text-[#111827]">Learn IT</h1>
              <p className="mt-1.5 text-sm text-slate-500 max-w-2xl">
                The Nexus IT knowledge base. Every AI agent reads this before writing code.
                Every developer references this before making architectural decisions.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <Link
                  href="/build-it"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[#7C3AED] hover:underline"
                >
                  ← Back to Build IT
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="rounded-[28px] border border-blue-200 bg-blue-50 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 mt-0.5">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-900">Agent reading requirement</p>
              <p className="mt-1 text-sm text-blue-700">
                Every AI agent working on Nexus IT must read this knowledge base before
                writing any code. This ensures consistent architecture, language and design across
                all work.
              </p>
            </div>
          </div>
        </div>

        {/* Knowledge Sections */}
        {knowledgeSections.map((section) => (
          <section key={section.category} className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {section.category}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {section.articles.map((article) => (
                <div
                  key={article.title}
                  className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-base font-semibold text-[#111827]">{article.title}</h3>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        tagColors[article.tag] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {article.tag}
                    </span>
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{article.summary}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </AppShell>
  );
}
