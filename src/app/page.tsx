import AppShell from "@/components/AppShell";

const kpis = [
  {
    title: "Today's Deliveries",
    value: "184",
    icon: "truck",
    trend: { direction: "up", label: "+12%" },
  },
  {
    title: "Outstanding Invoices",
    value: "£84,200",
    icon: "invoice",
    trend: { direction: "down", label: "4%" },
  },
  {
    title: "Warehouse Stock",
    value: "1842",
    icon: "warehouse",
    trend: { direction: "up", label: "+8%" },
  },
  {
    title: "Drivers Active",
    value: "31",
    icon: "driver",
    trend: { direction: "up", label: "+5%" },
  },
  {
    title: "Vehicles Active",
    value: "28",
    icon: "vehicle",
    trend: { direction: "up", label: "+4%" },
  },
  {
    title: "Collections Today",
    value: "62",
    icon: "collection",
    trend: { direction: "up", label: "+9%" },
  },
];

const activityTimeline = [
  {
    time: "08:12",
    icon: "driver",
    event: "Route 205 loaded",
    merchant: "Doorway Group",
    status: "Completed",
  },
  {
    time: "07:58",
    icon: "document",
    event: "Invoice authorised",
    merchant: "Nook Home",
    status: "Completed",
  },
  {
    time: "07:30",
    icon: "package",
    event: "Collection scheduled",
    merchant: "Doorway Group",
    status: "Pending",
  },
  {
    time: "06:50",
    icon: "traffic",
    event: "Traffic delay reported",
    merchant: "Warehouse",
    status: "Delayed",
  },
  {
    time: "06:15",
    icon: "route",
    event: "Vehicle dispatched",
    merchant: "Depot 3",
    status: "In transit",
  },
];

const attentionCards = [
  {
    title: "Critical",
    icon: "alert",
    description: "Failed delivery at Route 113 needs immediate reroute.",
    action: "Review now",
    priority: "critical",
  },
  {
    title: "Warning",
    icon: "clock",
    description: "Driver 22 is 18 minutes behind scheduled ETA.",
    action: "Contact driver",
    priority: "warning",
  },
  {
    title: "Information",
    icon: "document",
    description: "POD missing for Order 409, customer follow-up advised.",
    action: "Resolve POD",
    priority: "info",
  },
  {
    title: "Critical",
    icon: "invoice",
    description: "Invoice approval pending for £12.6k in outstanding charges.",
    action: "Approve now",
    priority: "critical",
  },
];

const quickActions = [
  {
    title: "New Delivery",
    icon: "plus",
    description: "Create a new delivery request for fast dispatch.",
  },
  {
    title: "Upload PDF",
    icon: "upload",
    description: "Upload shipment documents and invoices.",
  },
  {
    title: "Merchants",
    icon: "users",
    description: "Review merchant account details and delivery history.",
  },
  {
    title: "Planning",
    icon: "planning",
    description: "Set routes and schedules for the operations team.",
  },
  {
    title: "Warehouse",
    icon: "warehouse",
    description: "Manage inventory, stock levels, and locations.",
  },
  {
    title: "Finance",
    icon: "wallet",
    description: "Track invoices, approvals, and billing status.",
  },
  {
    title: "Reports",
    icon: "chart",
    description: "View performance metrics and daily reports.",
  },
];

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "critical":
      return "border-[var(--nexus-issue)] bg-[var(--nexus-issue)]/10 text-[var(--nexus-issue)]";
    case "warning":
      return "border-[var(--nexus-warning)] bg-[var(--nexus-warning)]/10 text-[var(--nexus-warning)]";
    case "info":
      return "border-[var(--nexus-info)] bg-[var(--nexus-info)]/10 text-[var(--nexus-info)]";
    default:
      return "border-slate-200 bg-slate-100 text-slate-900";
  }
}

export default function Home() {
  return (
    <AppShell>
      <section className="space-y-10">
        <div className="rounded-[32px] border border-slate-200 bg-white px-8 py-8 shadow-sm shadow-slate-200/30">
          <div className="max-w-4xl space-y-4">
            <p className="text-xs uppercase tracking-[0.32em] text-slate-500">NEXUS Control Room</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--nexus-graphite)] sm:text-5xl">
              NEXUS CONTROL ROOM
            </h1>
            <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">Live operations overview</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => (
            <article
              key={kpi.title}
              className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/30 transition hover:-translate-y-0.5 hover:shadow-[0_24px_80px_-40px_rgba(124,58,237,0.35)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">{kpi.title}</p>
                  <p className="mt-4 text-4xl font-semibold tracking-tight text-[var(--nexus-graphite)]">{kpi.value}</p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--nexus-purple)] text-white shadow-sm shadow-[var(--nexus-purple)]/30">
                  {kpi.icon === "truck" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M3 13h13v6H3z" />
                      <path d="M16 13h3l2 3v3h-5" />
                      <path d="M7 19a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" />
                    </svg>
                  ) : kpi.icon === "invoice" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M6 3h9l5 5v13H6z" />
                      <path d="M14 3v5h5" />
                      <path d="M9 12h6M9 16h4" />
                    </svg>
                  ) : kpi.icon === "warehouse" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M3 8l9-5 9 5v11H3z" />
                      <path d="M12 3v16" />
                      <path d="M6 12h12" />
                    </svg>
                  ) : kpi.icon === "driver" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M5 20h14" />
                      <path d="M8 20a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z" />
                      <path d="M6 16l1-5h10l1 5" />
                      <path d="M7 11V8a2 2 0 012-2h6a2 2 0 012 2v3" />
                    </svg>
                  ) : kpi.icon === "vehicle" ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M3 15h18" />
                      <path d="M5 15V9h14v6" />
                      <path d="M5 9l1-3h12l1 3" />
                      <path d="M7 15a2 2 0 100 4 2 2 0 000-4zm10 0a2 2 0 100 4 2 2 0 000-4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      <path d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 rounded-3xl bg-slate-50 px-4 py-3">
                <p className="text-sm text-slate-500">Trend</p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold ${
                    kpi.trend.direction === "up"
                      ? "bg-[var(--nexus-purple)]/10 text-[var(--nexus-purple)]"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                    {kpi.trend.direction === "up" ? (
                      <path d="M5 12l7-7 7 7" />
                    ) : (
                      <path d="M5 12l7 7 7-7" />
                    )}
                  </svg>
                  {kpi.trend.label}
                </span>
              </div>
            </article>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Live Fleet Map</p>
                <h2 className="mt-3 text-2xl font-semibold text-[var(--nexus-graphite)]">Fleet route preview</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Google Maps integration coming next.</p>
              </div>
              <span className="inline-flex rounded-2xl bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white">
                Placeholder only
              </span>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_0.9fr]">
              <div className="relative overflow-hidden rounded-[28px] bg-slate-100 p-6 shadow-sm shadow-slate-200/30">
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(241,245,249,0.95),rgba(226,232,240,0.95))]" />
                <div className="absolute inset-6 rounded-[24px] border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.14),transparent_20%),radial-gradient(circle_at_bottom_right,rgba(15,23,42,0.08),transparent_35%)]" />
                <div className="relative h-80 rounded-[24px] bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300">
                  <div className="absolute inset-6 rounded-[24px] bg-slate-100/80" />
                  <div className="absolute left-10 top-10 h-3 w-3 rounded-full bg-[var(--nexus-purple)] shadow-[0_0_0_10px_rgba(124,58,237,0.18)]" />
                  <div className="absolute left-24 top-20 h-3 w-3 rounded-full bg-slate-700/90 shadow-[0_0_0_10px_rgba(15,23,42,0.15)]" />
                  <div className="absolute right-16 top-24 h-3 w-3 rounded-full bg-slate-700/90 shadow-[0_0_0_10px_rgba(15,23,42,0.15)]" />
                  <div className="absolute left-20 bottom-20 h-3 w-3 rounded-full bg-slate-700/90 shadow-[0_0_0_10px_rgba(15,23,42,0.15)]" />
                  <div className="absolute right-10 bottom-16 h-3 w-3 rounded-full bg-slate-700/90 shadow-[0_0_0_10px_rgba(15,23,42,0.15)]" />
                  <div className="absolute left-16 top-14 h-0.5 w-40 rounded-full bg-[var(--nexus-purple)]/30 rotate-6" />
                  <div className="absolute left-10 top-28 h-0.5 w-52 rounded-full bg-[var(--nexus-purple)]/30 rotate-[6deg]" />
                  <div className="absolute right-12 top-40 h-0.5 w-36 rounded-full bg-[var(--nexus-purple)]/30 -rotate-12" />
                  <div className="absolute left-14 bottom-14 h-0.5 w-28 rounded-full bg-slate-500/30 rotate-2" />
                  <div className="absolute left-8 bottom-32 h-0.5 w-24 rounded-full bg-slate-500/20" />
                  <div className="absolute inset-x-8 top-2/3 h-0.5 rounded-full bg-slate-400/20" />
                  <div className="absolute left-8 top-1/2 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    Delivery area A
                  </div>
                  <div className="absolute right-8 top-20 rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    Delivery area B
                  </div>
                  <div className="absolute left-1/2 top-32 -translate-x-1/2 rounded-full border border-slate-300 bg-white/85 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                    Route line placeholder
                  </div>
                  <div className="absolute right-8 bottom-8 rounded-[20px] border border-slate-300 bg-white/95 px-4 py-3 text-sm shadow-sm">
                    <p className="font-semibold text-slate-900">ETA placeholder</p>
                    <p className="mt-1 text-xs text-slate-500">Driver 14 arriving in 14 min</p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Map markers</p>
                  <div className="mt-5 space-y-4 text-sm leading-6 text-slate-700">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-3.5 w-3.5 rounded-full bg-[var(--nexus-purple)]" />
                      Depot marker
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-3.5 w-3.5 rounded-full bg-slate-700/90" />
                      Driver markers
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-3.5 w-3.5 rounded-full border border-slate-300 bg-white" />
                      Delivery area labels
                    </div>
                  </div>
                </div>

                <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/30">
                  <p className="text-sm uppercase tracking-[0.18em] text-slate-500">Status legend</p>
                  <div className="mt-5 space-y-3 text-sm">
                    {[
                      { label: "On route", color: "bg-[var(--nexus-purple)]" },
                      { label: "At collection", color: "bg-sky-400" },
                      { label: "Delayed", color: "bg-amber-400" },
                      { label: "Delivered", color: "bg-emerald-400" },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                        <span className={`inline-flex h-3.5 w-3.5 rounded-full ${item.color}`} />
                        <span className="text-slate-700">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Today's Activity</p>
                  <p className="mt-2 text-2xl font-semibold text-[var(--nexus-graphite)]">Operations timeline</p>
                </div>
                <span className="inline-flex rounded-2xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700">
                  Newest first
                </span>
              </div>

              <div className="mt-6 space-y-6">
                {activityTimeline.map((item) => (
                  <div key={`${item.time}-${item.event}`} className="grid gap-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4 sm:grid-cols-[80px_minmax(0,_1fr)]">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--nexus-purple)] text-white shadow-sm shadow-[var(--nexus-purple)]/20">
                        {item.icon === "driver" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M5 20h14" />
                            <path d="M8 20a2 2 0 11-4 0 2 2 0 014 0zm11 0a2 2 0 11-4 0 2 2 0 014 0z" />
                            <path d="M6 16l1-5h10l1 5" />
                          </svg>
                        ) : item.icon === "document" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M6 3h9l5 5v13H6z" />
                            <path d="M14 3v5h5" />
                          </svg>
                        ) : item.icon === "package" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M3 7l9-4 9 4v10l-9 4-9-4V7z" />
                            <path d="M12 3v18" />
                            <path d="M3 7l9 4 9-4" />
                          </svg>
                        ) : item.icon === "traffic" ? (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M12 3v18" />
                            <path d="M9 7h6" />
                            <path d="M9 12h6" />
                            <path d="M9 17h6" />
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                            <path d="M12 4l6 8-6 8-6-8 6-8z" />
                          </svg>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-base font-semibold text-[var(--nexus-graphite)]">{item.time}</p>
                        <p className="text-sm text-slate-500">{item.merchant}</p>
                      </div>
                    </div>

                    <div className="grid gap-2 rounded-[24px] bg-white p-4 shadow-sm shadow-slate-200/20 sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.event}</p>
                        <p className="mt-1 text-sm text-slate-600">{item.merchant}</p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold ${
                          item.status === "Completed"
                            ? "bg-[var(--nexus-success)]/10 text-[var(--nexus-success)]"
                            : item.status === "In transit"
                            ? "bg-[var(--nexus-purple)]/10 text-[var(--nexus-purple)]"
                            : item.status === "Delayed"
                            ? "bg-[var(--nexus-warning)]/10 text-[var(--nexus-warning)]"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Needs Attention</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--nexus-graphite)]">Operational alerts</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600">
              These are the items the operations team should review first to keep the fleet moving.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {attentionCards.map((item) => (
              <div
                key={`${item.title}-${item.action}`}
                className={`rounded-[32px] border p-6 shadow-sm shadow-slate-200/30 ${getPriorityStyles(item.priority)} bg-white`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-3xl bg-white ${getPriorityStyles(item.priority)} text-[var(--nexus-graphite)]`}>
                    {item.icon === "alert" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                        <path d="M12 9v4" />
                        <path d="M12 17h.01" />
                        <path d="M10 3h4l6 11-6 7H10L4 14 10 3z" />
                      </svg>
                    ) : item.icon === "clock" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 7v5l3 3" />
                      </svg>
                    ) : item.icon === "document" ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                        <path d="M6 2h9l5 5v15H6z" />
                        <path d="M14 2v5h5" />
                        <path d="M9 12h6M9 16h6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                        <path d="M6 3h12v6h3v12H3V9h3V3z" />
                        <path d="M11 13h2v5h-2z" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--nexus-graphite)]">{item.title}</p>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        item.priority === "critical"
                          ? "bg-[var(--nexus-issue)]/15 text-[var(--nexus-issue)]"
                          : item.priority === "warning"
                          ? "bg-[var(--nexus-warning)]/15 text-[var(--nexus-warning)]"
                          : "bg-[var(--nexus-info)]/15 text-[var(--nexus-info)]"
                      }`}
                      >
                        {item.priority}
                      </span>
                    </div>
                    <p className="text-sm leading-6 text-slate-600">{item.description}</p>
                  </div>
                </div>
                <button type="button" className="mt-6 inline-flex items-center rounded-2xl bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[var(--nexus-purple)]/20 hover:bg-[#6922c8]">
                  {item.action}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Quick Actions</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--nexus-graphite)]">Jump to common workflows</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600">Launch delivery, merchant, warehouse and finance tasks in one place.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {quickActions.map((action) => (
              <button
                key={action.title}
                type="button"
                className="group rounded-[32px] border border-slate-200 bg-white p-6 text-left shadow-sm shadow-slate-200/30 transition duration-200 hover:-translate-y-1 hover:border-[var(--nexus-purple)] hover:bg-[var(--nexus-purple)]/5"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--nexus-purple)] text-white shadow-sm shadow-[var(--nexus-purple)]/20">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
                      {action.icon === "plus" ? (
                        <path d="M12 5v14M5 12h14" />
                      ) : action.icon === "upload" ? (
                        <>
                          <path d="M12 5v10" />
                          <path d="M8 11l4-4 4 4" />
                          <path d="M8 19h8" />
                        </>
                      ) : action.icon === "users" ? (
                        <>
                          <path d="M16 21v-2a4 4 0 00-8 0v2" />
                          <path d="M12 7a4 4 0 100-8 4 4 0 000 8z" />
                          <path d="M20 8a4 4 0 110-8 4 4 0 010 8z" />
                        </>
                      ) : action.icon === "planning" ? (
                        <>
                          <path d="M4 6h16M4 12h8M4 18h12" />
                        </>
                      ) : action.icon === "warehouse" ? (
                        <>
                          <path d="M4 8l8-5 8 5v11H4z" />
                          <path d="M12 3v18" />
                        </>
                      ) : action.icon === "wallet" ? (
                        <>
                          <path d="M3 7h18v10H3z" />
                          <path d="M3 12h18" />
                        </>
                      ) : (
                        <>
                          <path d="M5 19h14" />
                          <path d="M5 15l7-7 7 7" />
                        </>
                      )}
                    </svg>
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-lg font-semibold text-[var(--nexus-graphite)]">{action.title}</p>
                      <span className="text-[var(--nexus-purple)] transition group-hover:text-[var(--nexus-graphite)]">→</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
