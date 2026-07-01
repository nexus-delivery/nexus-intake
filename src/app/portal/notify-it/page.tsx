export default function PortalNotifyItPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-950">Notify it</h1>
          </div>
          <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">3 unread</span>
        </div>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Foundation module for persistent communication and internal notifications.</p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <h2 className="text-lg font-semibold text-slate-950">Conversation List</h2>
        <div className="mt-4 space-y-3">
          {[
            { order: "NEX-DOORWAY-1042", subject: "Collection override", message: "Reason provided by merchant.", unread: 2 },
            { order: "NEX-DOORWAY-1058", subject: "Track-POD update", message: "Driver note posted.", unread: 1 },
          ].map((thread) => (
            <article key={thread.order} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-900">{thread.subject}</p>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">{thread.unread}</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">Order link: {thread.order}</p>
              <p className="mt-2 text-sm text-slate-600">Internal message: {thread.message}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
