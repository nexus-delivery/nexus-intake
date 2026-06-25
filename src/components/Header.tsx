type HeaderProps = {
  title: string;
  subtitle: string;
};

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">NEXUS Control Room</p>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">{title}</h1>
        <p className="max-w-2xl text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm">
          <span className="font-semibold">Live</span> • updated 2m ago
        </div>
        <div className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          Operations view
        </div>
      </div>
    </div>
  );
}
