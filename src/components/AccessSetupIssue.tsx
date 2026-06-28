"use client";

type AccessSetupIssueProps = {
  route: string;
  sessionUserId?: string | null;
  error: unknown;
};

function toDisplayMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error.trim()) return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown access setup issue";
  }
}

export default function AccessSetupIssue({ route, sessionUserId, error }: AccessSetupIssueProps) {
  const message = toDisplayMessage(error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-900 px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-300/30 bg-amber-500/10 p-6 text-amber-50">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">Access Setup Issue</p>
        <h1 className="mt-2 text-xl font-semibold text-white">Unable to Complete Account Setup</h1>
        <p className="mt-3 text-sm text-amber-100/90">
          Your sign-in is valid. Please contact support and share the details below.
        </p>
        <dl className="mt-5 space-y-2 rounded-xl border border-amber-100/20 bg-black/20 p-4 text-xs text-amber-100">
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-amber-200/80">Route</dt>
            <dd className="break-all">{route}</dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-amber-200/80">Session user ID</dt>
            <dd className="break-all">{sessionUserId ?? "Unavailable"}</dd>
          </div>
          <div className="grid grid-cols-[120px_1fr] gap-3">
            <dt className="text-amber-200/80">Technical details</dt>
            <dd className="break-all">{message}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
