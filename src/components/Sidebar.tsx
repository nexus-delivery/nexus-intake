import Link from "next/link";

type NavItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  items: NavItem[];
  activePath: string;
};

export default function Sidebar({ items, activePath }: SidebarProps) {
  return (
    <aside className="bg-slate-950 text-slate-100 lg:min-h-screen lg:w-72">
      <div className="mx-auto flex max-w-xs flex-col gap-8 px-4 py-6 sm:px-6 lg:max-w-none lg:px-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-3 rounded-3xl border border-slate-800 bg-slate-900 px-4 py-3 shadow-sm shadow-slate-950/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500 text-base font-bold text-slate-950">
              N
            </div>
            <div>
              <p className="text-sm font-semibold text-white">NEXUS Platform</p>
              <p className="text-xs text-slate-500">Operations shell</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400 shadow-sm shadow-slate-950/20">
            <p className="font-medium text-slate-200">Control Room</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Monitor bookings, consignments and delivery operations with the NEXUS dashboard.
            </p>
          </div>
        </div>

        <nav className="space-y-1">
          {items.map((item) => {
            const active = item.href === activePath;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition " +
                  (active
                    ? "bg-slate-800 text-white shadow-lg shadow-slate-950/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white")
                }
                aria-current={active ? "page" : undefined}
              >
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
