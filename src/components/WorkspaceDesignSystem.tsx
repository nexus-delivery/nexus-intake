import Link from "next/link";
import type { ReactNode } from "react";

export type WorkspaceCardStatus = "live" | "coming-soon";

export type WorkspaceCardItem = {
  title: string;
  description: string;
  icon: ReactNode;
  status: WorkspaceCardStatus | string;
  href?: string;
};

type WorkspaceHeroProps = {
  kicker: string;
  title: string;
  description: string;
  icon: ReactNode;
};

type WorkspaceCardGridProps = {
  items: WorkspaceCardItem[];
};

type WorkspaceInfoStripProps = {
  title: string;
  description: string;
  icon: ReactNode;
};

function StatusPill({ status }: { status: WorkspaceCardStatus | string }) {
  if (status === "live") {
    return <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">Installed</span>;
  }

  return <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">Available Soon</span>;
}

export function WorkspaceHero({ kicker, title, description, icon }: WorkspaceHeroProps) {
  return (
    <div className="nexus-card rounded-[32px] p-8">
      <div className="flex items-center gap-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
          {icon}
        </div>
        <div>
          <p className="nexus-kicker">{kicker}</p>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{title}</h1>
          <p className="mt-1.5 text-sm text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceInfoStrip({ title, description, icon }: WorkspaceInfoStripProps) {
  return (
    <div className="rounded-[28px] border border-sky-200 bg-sky-50 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-sky-900">{title}</p>
          <p className="text-sm text-sky-700">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function WorkspaceCardGrid({ items }: WorkspaceCardGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => {
        const cardBody = (
          <>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED] transition group-hover:bg-[#7C3AED] group-hover:text-white">
                {item.icon}
              </div>
              <StatusPill status={item.status} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">{item.title}</h3>
            <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{item.description}</p>
            {item.href && item.status === "live" ? (
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#a78bfa] opacity-0 transition-opacity group-hover:opacity-100">
                Open <span className="ml-1">→</span>
              </div>
            ) : (
              <p className="mt-4 text-xs font-medium text-slate-500">Install when released</p>
            )}
          </>
        );

        if (!item.href || item.status !== "live") {
          return (
            <div key={item.title} className="nexus-card group flex h-full flex-col rounded-[28px] p-6 opacity-80">
              {cardBody}
            </div>
          );
        }

        return (
          <Link
            key={item.title}
            href={item.href}
            className="nexus-card group flex h-full flex-col rounded-[28px] p-6 transition duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/60"
          >
            {cardBody}
          </Link>
        );
      })}
    </div>
  );
}
