import Link from "next/link";

type ComingSoonPageProps = {
  title: string;
  description: string;
  plannedCapabilities: string[];
};

export default function ComingSoonPage({
  title,
  description,
  plannedCapabilities,
}: ComingSoonPageProps) {
  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-[var(--nexus-graphite)]">{title}</h1>
        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
          Coming Soon
        </span>
      </div>

      <p className="mt-4 text-slate-600">{description}</p>

      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
          Planned capabilities
        </p>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
          {plannedCapabilities.map((capability) => (
            <li key={capability}>{capability}</li>
          ))}
        </ul>
      </div>

      <p className="mt-6 text-sm font-medium text-slate-500">Available in a future update.</p>

      <Link
        href="/portal"
        className="mt-6 inline-flex items-center rounded-lg bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[var(--nexus-purple)]/90"
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
