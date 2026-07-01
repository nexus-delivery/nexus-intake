"use client";

import {
  features,
  sprintCards,
  workflowSteps,
  agents,
  approvedRules,
  innovationBacklog,
  nextActions,
  type FeatureStatus,
  type AgentStatus,
  type SprintColumn,
} from "@/lib/productHubMockData";

// ── Helpers ────────────────────────────────────────────────────────────────

const sprintColumns: SprintColumn[] = [
  "Backlog",
  "Ready",
  "In Progress",
  "In Review",
  "Blocked",
  "Done",
];

function featureStatusClasses(status: FeatureStatus): string {
  switch (status) {
    case "Active":
      return "bg-emerald-100 text-emerald-700";
    case "Planned":
      return "bg-blue-100 text-blue-700";
    case "Backlog":
      return "bg-slate-100 text-slate-600";
    case "Future":
      return "bg-purple-100 text-purple-700";
  }
}

function agentStatusClasses(status: AgentStatus): string {
  switch (status) {
    case "In Progress":
      return "bg-blue-100 text-blue-700";
    case "Ready":
      return "bg-emerald-100 text-emerald-700";
    case "Blocked":
      return "bg-red-100 text-red-700";
  }
}

function cardTypeClasses(type: "Feature" | "Bug" | "Refactor"): string {
  switch (type) {
    case "Feature":
      return "bg-purple-100 text-purple-700";
    case "Bug":
      return "bg-red-100 text-red-700";
    case "Refactor":
      return "bg-amber-100 text-amber-700";
  }
}

function columnHeaderClasses(col: SprintColumn): string {
  switch (col) {
    case "In Progress":
      return "bg-blue-600";
    case "In Review":
      return "bg-purple-600";
    case "Blocked":
      return "bg-red-600";
    case "Done":
      return "bg-emerald-600";
    default:
      return "bg-slate-500";
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-xl font-semibold text-slate-900 mb-4">{title}</h2>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ProductHubPage() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] text-[#111827]">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="bg-[#7C3AED] px-6 py-8 sm:px-10">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-purple-200">
            Internal · Product Control Room
          </p>
          <h1 className="mt-1 text-3xl font-bold text-white">Nexus Product Hub</h1>
          <p className="mt-2 text-purple-200">
            Product control room for roadmap, releases, backlog and agent work.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-10">

        {/* ── 1. Current Focus ───────────────────────────────────────── */}
        <section>
          <SectionHeading title="Current Focus" />
          <Card>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Active Initiative
                </p>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Nexus Booking + Nexus Transport
                </h3>
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Active Build
                </span>
                <p className="mt-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">Priority:</span> Launch
                  customer-ready booking and Track-POD transport workflow.
                </p>
              </div>
            </div>

            {/* Workflow */}
            <div className="mt-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Workflow
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {workflowSteps.map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#7C3AED] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap">
                      {step}
                    </span>
                    {i < workflowSteps.length - 1 && (
                      <span className="text-slate-400 font-bold">→</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        {/* ── 2. Feature Catalogue ───────────────────────────────────── */}
        <section>
          <SectionHeading title="Feature Catalogue" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f) => (
              <Card key={f.name}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{f.name}</h4>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${featureStatusClasses(f.status)}`}
                  >
                    {f.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-500">{f.purpose}</p>
                <p className="mt-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  {f.revenueModel}
                </p>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 3. Current Sprint Board ────────────────────────────────── */}
        <section>
          <SectionHeading title="Current Sprint Board" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {sprintColumns.map((col) => {
              const cards = sprintCards.filter((c) => c.column === col);
              return (
                <div key={col} className="flex flex-col gap-3">
                  <div
                    className={`rounded-xl px-3 py-2 text-center text-xs font-bold text-white ${columnHeaderClasses(col)}`}
                  >
                    {col}
                    <span className="ml-1.5 rounded-full bg-white/20 px-1.5 py-0.5 text-xs">
                      {cards.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {cards.length === 0 ? (
                      <p className="rounded-xl border border-dashed border-slate-200 p-3 text-center text-xs text-slate-400">
                        Empty
                      </p>
                    ) : (
                      cards.map((card) => (
                        <div
                          key={card.id}
                          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
                        >
                          <p className="text-xs font-semibold text-slate-900">{card.title}</p>
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="font-mono text-xs text-slate-400">{card.id}</span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cardTypeClasses(card.type)}`}
                            >
                              {card.type}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── 4. Innovation Backlog ──────────────────────────────────── */}
        <section>
          <SectionHeading title="Innovation Backlog" />
          <Card>
            <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
              These ideas are protected but do not delay the current release.
            </p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {innovationBacklog.map((idea) => (
                <li
                  key={idea}
                  className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-700"
                >
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#7C3AED]" />
                  {idea}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── 5. Agent Control ───────────────────────────────────────── */}
        <section>
          <SectionHeading title="Agent Control" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent) => (
              <Card key={agent.role}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-900">{agent.role}</h4>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${agentStatusClasses(agent.status)}`}
                  >
                    {agent.status}
                  </span>
                </div>
                <div className="mt-3 space-y-1.5 text-xs text-slate-600">
                  <p>
                    <span className="font-semibold text-slate-800">Task:</span> {agent.task}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-800">Output:</span> {agent.output}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── 6. Approved Rules ──────────────────────────────────────── */}
        <section>
          <SectionHeading title="Approved Rules" />
          <Card>
            <ul className="space-y-3">
              {approvedRules.map((rule) => (
                <li key={rule} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 text-emerald-500 text-base leading-none">✅</span>
                  {rule}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* ── 7. Next Actions ────────────────────────────────────────── */}
        <section>
          <SectionHeading title="Next Actions" />
          <Card>
            <ol className="space-y-3">
              {nextActions.map((action, i) => (
                <li key={action} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7C3AED] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                  {action}
                </li>
              ))}
            </ol>
          </Card>
        </section>

      </main>

      <footer className="border-t border-slate-200 bg-white px-6 py-4 text-center text-xs text-slate-400">
        Nexus Product Hub · Internal only · No backend connections
      </footer>
    </div>
  );
}
