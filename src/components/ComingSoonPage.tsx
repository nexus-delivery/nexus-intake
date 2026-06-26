import Link from "next/link";

type ComingSoonPageProps = {
  title: string;
  description: string;
  plannedCapabilities: string[];
  timeline?: string;
};

export default function ComingSoonPage({
  title,
  description,
  plannedCapabilities,
  timeline = "Timeline to be confirmed",
}: ComingSoonPageProps) {
  return (
    <section className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--nexus-purple)]">Coming Soon</p>
      <h2 className="mt-2 text-2xl font-semibold text-[var(--nexus-graphite)] sm:text-3xl">{title}</h2>
      <p className="mt-3 text-sm text-slate-600 sm:text-base">{description}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-[var(--nexus-graphite)]">Planned capabilities</h3>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {plannedCapabilities.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-[var(--nexus-purple)]" aria-hidden="true" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-sm text-slate-500">Availability: {timeline}</p>

      <Link
        href="/portal"
        className="mt-6 inline-flex items-center rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
      >
        Return to Dashboard
      </Link>
    </section>
  );
}
