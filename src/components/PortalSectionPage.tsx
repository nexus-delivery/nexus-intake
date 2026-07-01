import Link from "next/link";

export type PortalSectionPageProps = {
  title: string;
  kicker: string;
  description: string;
  primaryAction?: { label: string; href: string };
  secondaryAction?: { label: string; href: string };
  cards: Array<{
    title: string;
    detail: string;
    href?: string;
    status?: string;
  }>;
};

export default function PortalSectionPage({
  title,
  kicker,
  description,
  primaryAction,
  secondaryAction,
  cards,
}: PortalSectionPageProps) {
  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
      <div className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{kicker}</p>
        <h1 className="text-3xl font-semibold text-slate-950">{title}</h1>
        <p className="max-w-3xl text-sm text-slate-600">{description}</p>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {primaryAction ? (
          <Link href={primaryAction.href} className="rounded-full bg-[#7C3AED] px-3 py-1.5 text-white">
            {primaryAction.label}
          </Link>
        ) : null}
        {secondaryAction ? (
          <Link href={secondaryAction.href} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">
            {secondaryAction.label}
          </Link>
        ) : null}
        <Link href="/portal" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">
          Workspace
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => (
          card.href ? (
            <Link key={card.title} href={card.href} className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-[#7C3AED] hover:bg-white">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">{card.title}</p>
                {card.status ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.status}</span> : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
            </Link>
          ) : (
            <article key={card.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-start justify-between gap-3">
                <p className="text-lg font-semibold text-slate-900">{card.title}</p>
                {card.status ? <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">{card.status}</span> : null}
              </div>
              <p className="mt-2 text-sm text-slate-600">{card.detail}</p>
            </article>
          )
        ))}
      </div>
    </section>
  );
}
