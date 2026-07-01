import Link from "next/link";

type NotifyThread = {
  id: string;
  orderRef: string;
  title: string;
  unread: number;
  latest: string;
};

const mockThreads: NotifyThread[] = [
  {
    id: "notify-1",
    orderRef: "NEX-DOORWAY-1042",
    title: "Collection time override",
    unread: 2,
    latest: "Merchant requested 11:30 collection window.",
  },
  {
    id: "notify-2",
    orderRef: "NEX-DOORWAY-1058",
    title: "Track-POD follow-up",
    unread: 1,
    latest: "Driver note added to active delivery.",
  },
  {
    id: "notify-3",
    orderRef: "NEX-DOORWAY-1062",
    title: "Invoice prep",
    unread: 0,
    latest: "Xero draft pending final commercial check.",
  },
];

export default function NotifyItPanel() {
  const unreadCount = mockThreads.reduce((sum, thread) => sum + thread.unread, 0);

  return (
    <aside className="hidden w-80 shrink-0 border-l border-slate-200 bg-white/85 p-4 xl:block">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Notify it</h2>
          <span className="rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
            {unreadCount} unread
          </span>
        </div>
        <p className="mt-2 text-sm text-slate-600">Persistent internal communication panel for Manage it.</p>
      </div>

      <div className="mt-4 space-y-3">
        {mockThreads.map((thread) => (
          <article key={thread.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-slate-900">{thread.title}</p>
              {thread.unread > 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{thread.unread}</span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-slate-500">Order {thread.orderRef}</p>
            <p className="mt-2 text-xs text-slate-600">{thread.latest}</p>
            <div className="mt-3 flex items-center gap-2 text-xs font-semibold">
              <Link href="/portal/orders" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600 hover:border-slate-300">Order link</Link>
              <button type="button" className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600">Internal message</button>
            </div>
          </article>
        ))}
      </div>
    </aside>
  );
}
