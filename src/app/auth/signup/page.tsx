import Link from "next/link";

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center px-4 py-16">
      {/* Brand */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] text-lg font-bold text-white shadow-lg shadow-[#7C3AED]/40">
          N
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">NEXUS Platform</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Create your workspace</h1>
          <p className="mt-1 text-sm text-slate-400">
            Set up your company account and start using IT.
          </p>
        </div>
      </div>

      {/* Form card */}
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <form className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">First name</label>
              <input
                type="text"
                placeholder="Jane"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-300">Last name</label>
              <input
                type="text"
                placeholder="Smith"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Work email</label>
            <input
              type="email"
              placeholder="jane@yourcompany.com"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Company name</label>
            <input
              type="text"
              placeholder="Acme Logistics Ltd"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-300">Password</label>
            <input
              type="password"
              placeholder="Choose a strong password"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
            />
          </div>

          <button
            type="submit"
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] active:scale-[0.98]"
          >
            Create workspace &amp; start onboarding
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have a workspace?{" "}
          <Link href="/auth/login" className="text-[#A78BFA] hover:underline">
            Sign in
          </Link>
        </p>
      </div>

      <p className="mt-6 text-center text-xs text-slate-600">
        This is a placeholder form. Backend integration coming soon.
      </p>
    </div>
  );
}
