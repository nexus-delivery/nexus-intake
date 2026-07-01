export default function PortalDiscussItPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Workspace access</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Discuss it</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Foundation only for Sprint 1. This is the permanent operational timeline shell.
        </p>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <h2 className="text-lg font-semibold text-slate-950">Timeline Table Placeholder</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px]">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Summary</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100 text-sm text-slate-600">
                <td className="px-3 py-3">Placeholder</td>
                <td className="px-3 py-3">System</td>
                <td className="px-3 py-3">NEX-XXXXX</td>
                <td className="px-3 py-3">Timeline events will appear here in a future sprint.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <h2 className="text-lg font-semibold text-slate-950">Timeline Placeholder</h2>
        <p className="mt-2 text-sm text-slate-600">
          Reserved for phone, email, WhatsApp, merchant messages, operations notes, driver notes, Track-POD notes, and system events.
        </p>
      </section>
    </div>
  );
}
