import Link from "next/link";

export default function BetaAccessPage() {
  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo / Brand */}
      <div className="mb-10 flex flex-col items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-[#7C3AED] text-2xl font-bold text-white shadow-lg shadow-[#7C3AED]/40">
          N
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">
            NEXUS Platform
          </p>
          <h1 className="mt-1 text-3xl font-semibold text-white">Welcome to IT</h1>
          <p className="mt-2 text-sm text-slate-400">
            The logistics control room for modern delivery operations.
          </p>
        </div>
      </div>

      {/* Beta card */}
      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <div className="mb-6">
          <span className="inline-block rounded-full bg-[#7C3AED]/20 px-3 py-1 text-xs font-semibold text-[#A78BFA]">
            Public Beta
          </span>
          <h2 className="mt-3 text-xl font-semibold text-white">Get access to IT</h2>
          <p className="mt-1.5 text-sm text-slate-400">
            Sign up for early access or log in to your existing workspace.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] hover:shadow-[#7C3AED]/50 active:scale-[0.98]"
          >
            Create your workspace
          </Link>
          <Link
            href="/auth/login"
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-[0.98]"
          >
            Sign in to IT
          </Link>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">
          By accessing IT you agree to the NEXUS Platform{" "}
          <span className="text-[#A78BFA] cursor-pointer hover:underline">Terms of Service</span>{" "}
          and{" "}
          <span className="text-[#A78BFA] cursor-pointer hover:underline">Privacy Policy</span>.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-4 text-center">
        {[
          { label: "Create IT", desc: "Book deliveries" },
          { label: "Track IT", desc: "Live visibility" },
          { label: "Account IT", desc: "Your workspace" },
        ].map((f) => (
          <div
            key={f.label}
            className="rounded-2xl border border-white/10 bg-white/5 px-3 py-4"
          >
            <p className="text-xs font-semibold text-[#A78BFA]">{f.label}</p>
            <p className="mt-1 text-xs text-slate-500">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
