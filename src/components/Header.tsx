type HeaderProps = {
  title: string;
  subtitle: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
      <div className="space-y-3">
        <p className="nexus-kicker">Nexus it Today</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--nexus-graphite)] sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">{subtitle}</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-[var(--nexus-graphite)] shadow-sm shadow-slate-300/30">
          <span className="font-semibold">Live</span> • updated 2m ago
        </div>
        <div className="rounded-2xl bg-[var(--nexus-purple)] px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-[rgba(139,92,246,0.35)]">
          Product view
        </div>
      </div>
    </div>
  );
}
