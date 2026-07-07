type CommunicationsComingSoonProps = {
  title?: string;
  subtitle?: string;
};

const groups = [
  {
    title: "Customer Contact",
    items: [
      "📧 Email Customer (Coming Soon)",
      "💬 WhatsApp Customer (Coming Soon)",
      "📞 Click to Call Customer (Coming Soon)",
    ],
  },
  {
    title: "Merchant Contact",
    items: [
      "📧 Email Merchant (Coming Soon)",
      "💬 WhatsApp Merchant (Coming Soon)",
      "📞 Click to Call Merchant (Coming Soon)",
    ],
  },
  {
    title: "Staff Tools",
    items: [
      "Internal notes (Coming Soon)",
      "Conversation history (Coming Soon)",
      "Communication timeline (Coming Soon)",
    ],
  },
];

export default function CommunicationsComingSoon({
  title = "Communications",
  subtitle = "UI placeholders only for the next communication layer.",
}: CommunicationsComingSoonProps) {
  return (
    <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Communications</p>
        <h2 className="text-2xl font-semibold text-slate-950">{title}</h2>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {groups.map((group) => (
          <div key={group.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-900">{group.title}</p>
            <div className="mt-3 space-y-2">
              {group.items.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-600"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}