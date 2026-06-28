"use client";

type AccessSetupIssueViewProps = {
  title?: string;
  heading: string;
  details: string;
  hint?: string;
};

export default function AccessSetupIssueView({
  title = "Access setup issue",
  heading,
  details,
  hint = "Try refreshing this page. If this keeps happening, contact support.",
}: AccessSetupIssueViewProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4">
      <div className="w-full max-w-2xl rounded-2xl border border-amber-300/40 bg-amber-500/10 p-6 text-amber-100">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">{title}</p>
        <h1 className="mt-2 text-xl font-semibold text-white">{heading}</h1>
        <p className="mt-3 text-sm text-amber-100/90">{details}</p>
        <p className="mt-5 text-xs text-amber-200/90">{hint}</p>
      </div>
    </div>
  );
}
