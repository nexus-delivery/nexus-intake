import AppShell from "@/components/AppShell";
import ProcessItQueue from "@/components/ProcessItQueue";
import Link from "next/link";

export const metadata = {
  title: "Process it — Nexus it Today",
};

export default function ProcessItPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-xs font-semibold">
          <Link href="/" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Workspace</Link>
          <Link href="/create-it" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Create it</Link>
          <Link href="/portal/intake" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Upload it</Link>
          <Link href="/portal/documents" className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300">Documents</Link>
          <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-violet-700">Process it</span>
        </div>
        <ProcessItQueue />
      </div>
    </AppShell>
  );
}
