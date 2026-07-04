"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Crumb = {
  label: string;
  href: string;
};

const ROOT_LABELS: Record<string, string> = {
  dashboard: "Oversee it",
  "manage-it": "Oversee it",
  "create-it": "Create it",
  "process-it": "Process it",
  "account-it": "Account it",
  "store-it": "Store it",
  "report-it": "Report it",
  "improve-it": "Improve it",
  portal: "Create it",
  customer: "Customer",
};

const SEGMENT_LABELS: Record<string, string> = {
  merchants: "Merchants",
  customers: "Customers",
  addresses: "Addresses",
  search: "Search",
  "search-it": "Search it",
  integrations: "Integrations",
  invoices: "Invoices",
  "booking-forms": "Booking Forms",
  "booking-templates": "Booking Profiles",
  "public-booking-forms": "Public Forms",
  "book-it": "Book it",
  "upload-it": "Upload it",
  "send-it": "Send it",
  "get-it": "Get it",
  "route-it": "Route it",
  "track-it": "Track it",
  "review-queue": "Review Queue",
  reports: "Reports",
  settings: "Settings",
};

function prettifySegment(segment: string): string {
  if (SEGMENT_LABELS[segment]) return SEGMENT_LABELS[segment];
  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildCrumbs(pathname: string): Crumb[] {
  const clean = pathname.split("?")[0].split("#")[0];
  const segments = clean.split("/").filter(Boolean);

  if (segments.length === 0) {
    return [{ label: "Oversee it", href: "/dashboard" }];
  }

  const crumbs: Crumb[] = [];
  let runningPath = "";

  segments.forEach((segment, index) => {
    runningPath += `/${segment}`;

    if (index === 0) {
      crumbs.push({
        label: ROOT_LABELS[segment] ?? prettifySegment(segment),
        href: runningPath,
      });
      return;
    }

    crumbs.push({ label: prettifySegment(segment), href: runningPath });
  });

  return crumbs;
}

export default function PlatformBreadcrumbs() {
  const pathname = usePathname() ?? "/";
  const crumbs = buildCrumbs(pathname);

  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
      {crumbs.map((crumb, index) => {
        const last = index === crumbs.length - 1;
        return (
          <div key={`${crumb.href}-${crumb.label}`} className="flex items-center gap-2">
            {last ? (
              <span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-violet-700">
                {crumb.label}
              </span>
            ) : (
              <Link href={crumb.href} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-slate-600 hover:border-slate-300">
                {crumb.label}
              </Link>
            )}
            {!last ? <span className="text-slate-300">&gt;</span> : null}
          </div>
        );
      })}
    </nav>
  );
}
