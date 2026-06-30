"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { fetchCompanyById, fetchProfileByUserId } from "@/lib/authOnboarding";
import AccessSetupIssueView from "@/components/AccessSetupIssueView";
import { getManageItAccessProfile, syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

const manageItModules = [
  {
    title: "Create it.",
    description: "Create delivery requests, bookings and orders.",
    href: "/create-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: "Upload it.",
    description: "Upload delivery documents, manifests and purchase orders.",
    href: "/portal/intake",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    ),
  },
  {
    title: "Document it.",
    description: "Manage the complete journey from uploaded document to completed delivery.",
    href: "/manage-it/document-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
    requiresManageIt: true,
  },
  {
    title: "Search it.",
    description: "Locate documents, draft jobs and deliveries with two-match security.",
    href: "/manage-it/search-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
    requiresManageIt: true,
  },
  {
    title: "Plan it.",
    description: "Plan routes, schedules and delivery windows in advance.",
    href: "/route-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: "Route it.",
    description: "Dispatch drivers, manage consignments and live routing.",
    href: "/route-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M3 12h18" />
        <path d="M8 7l-5 5 5 5" />
        <path d="M16 7l5 5-5 5" />
      </svg>
    ),
  },
  {
    title: "Track it.",
    description: "Real-time tracking, POD status and delivery visibility.",
    href: "/track-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
        <circle cx="12" cy="9" r="2.5" />
      </svg>
    ),
  },
  {
    title: "POD it.",
    description: "Proof of delivery capture, signatures and photographic evidence.",
    href: "/track-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
  },
  {
    title: "Manage it.",
    description: "Operations control room, documents and platform settings.",
    href: "/manage-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
    requiresManageIt: true,
  },
  {
    title: "Account it.",
    description: "Manage accounts, companies and customer relationships.",
    href: "/account-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" />
        <path d="M4 21v-1a4 4 0 014-4h8a4 4 0 014 4v1" />
      </svg>
    ),
  },
  {
    title: "Report it.",
    description: "Analytics, performance metrics and daily operational reports.",
    href: "/report-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M4 6h16" />
        <path d="M7 6v12" />
        <path d="M12 10v8" />
        <path d="M17 14v4" />
        <path d="M4 18h16" />
      </svg>
    ),
  },
  {
    title: "Improve it.",
    description: "Customer improvement centre — feedback, ideas and future requests.",
    href: "/improve-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: "Build it.",
    description: "Development centre — roadmap, sprint board and integrations.",
    href: "/build-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
];

type AccessSetupIssue = {
  title: string;
  details: string;
};

export default function HubPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canAccessManageIt, setCanAccessManageIt] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [accessIssue, setAccessIssue] = useState<AccessSetupIssue | null>(null);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function redirectOnce(target: string) {
      if (hasRedirectedRef.current || cancelled) {
        return;
      }
      hasRedirectedRef.current = true;
      router.replace(target);
    }

    async function bootstrap() {
      setAuthLoading(true);
      setAccessIssue(null);

      try {
        if (!supabase) {
          if (!cancelled) {
            setAuthLoading(false);
          }
          return;
        }

        const [{ data: userData }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        const user = userData.user ?? sessionData.session?.user ?? null;
        const accessToken = sessionData.session?.access_token ?? null;

        if (!user) {
          try {
            await syncManageItSession(null);
          } catch {}
          redirectOnce("/signin");
          return;
        }

        try {
          await syncManageItSession(accessToken);
        } catch (syncError) {
          const message = syncError instanceof Error ? syncError.message : String(syncError);
          console.error("[Hub] session sync failed with active user", {
            route: "/",
            sessionUserId: user.id,
            error: message,
          });
          if (!cancelled) {
            setAccessIssue({
              title: "Access setup issue",
              details: `Session sync failed: ${message}`,
            });
            setAuthLoading(false);
          }
          return;
        }

        let profileRecord;
        try {
          profileRecord = await fetchProfileByUserId(user.id);
        } catch (profileError) {
          const message = profileError instanceof Error ? profileError.message : String(profileError);
          console.error("[Hub] profile fetch result", {
            route: "/",
            sessionUserId: user.id,
            found: false,
            error: message,
          });
          if (!cancelled) {
            setAccessIssue({
              title: "Access setup issue",
              details: `Profile fetch failed: ${message}`,
            });
            setAuthLoading(false);
          }
          return;
        }

        if (!profileRecord) {
          redirectOnce("/onboarding");
          return;
        }

        if (profileRecord.company_id) {
          try {
            const company = await fetchCompanyById(profileRecord.company_id);
            if (!cancelled) {
              setCompanyName(company?.name ?? null);
            }
          } catch (companyError) {
            const message = companyError instanceof Error ? companyError.message : String(companyError);
            console.error("[Hub] company fetch result", {
              route: "/",
              sessionUserId: user.id,
              companyId: profileRecord.company_id,
              found: false,
              error: message,
            });
            if (!cancelled) {
              setAccessIssue({
                title: "Access setup issue",
                details: `Company fetch failed: ${message}`,
              });
              setAuthLoading(false);
            }
            return;
          }
        }
        if (!cancelled) {
          setUserEmail(user.email ?? null);
        }
        try {
          const profile = await getManageItAccessProfile();
          if (!cancelled) {
            setCanAccessManageIt(profile.canAccessManageIt);
          }
        } catch (accessError) {
          console.error("[Hub] Manage IT access profile fetch failed", {
            route: "/",
            sessionUserId: user.id,
            error: accessError instanceof Error ? accessError.message : String(accessError),
          });
          if (!cancelled) {
            setCanAccessManageIt(false);
          }
        }
        if (!cancelled) {
          setAuthLoading(false);
        }
      } catch (err) {
        console.error("[Hub] auth bootstrap failed", {
          route: "/",
          error: err instanceof Error ? err.message : String(err),
        });
        if (!cancelled) {
          setAccessIssue({
            title: "Access setup issue",
            details: err instanceof Error ? err.message : "Unknown bootstrap error",
          });
          setAuthLoading(false);
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignOut() {
    setSignOutError(null);
    if (!supabase) {
      router.replace("/signin");
      return;
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      setSignOutError("Unable to sign out right now. Please try again.");
      return;
    }
    await syncManageItSession(null);
    router.replace("/signin");
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-sm text-slate-300">
        Loading workspace...
      </div>
    );
  }

  if (accessIssue) {
    return (
      <AccessSetupIssueView
        title={accessIssue.title}
        heading="We found a session, but setup could not be completed."
        details={accessIssue.details}
        hint="Try refreshing this page or signing out and signing back in. If the issue continues, share this error with support. Your session remains active and no documents were removed."
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-bold text-white shadow shadow-[#7C3AED]/40">
            N
          </div>
              <p className="text-sm font-semibold text-white">Nexus it</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Manage it.</p>
            <p className="text-xs text-slate-300">{companyName ?? userEmail ?? "Customer"}</p>
            {signOutError ? <p className="text-[11px] text-red-300">{signOutError}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-6xl">
          {/* Headline */}
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7C3AED] mb-4">
              NEXUS IT TODAY
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
              How would you like to Nexus it today?
            </h1>
            <p className="mt-4 text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Select a product to create, track, store, account or report from one intelligent workspace.
            </p>
          </div>

          {/* ── Manage it. Modules ───────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 mb-6">
              Workspace actions
            </p>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {manageItModules
                .filter((mod) => !mod.requiresManageIt || canAccessManageIt)
                .map((s) => (
                <Link
                  key={`${s.href}-${s.title}`}
                  href={s.href}
                  className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-7 hover:border-[#7C3AED]/50 hover:bg-white/8 cursor-pointer transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#a78bfa]">
                      {s.icon}
                    </div>
                    <span className="text-[#7C3AED] text-lg font-light opacity-0 group-hover:opacity-100 transition-opacity">→</span>
                  </div>
                  <h2 className="text-lg font-semibold text-white mb-2">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-400">{s.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 px-6 py-4 text-center">
        <p className="text-xs text-slate-600">
          Nexus it Today · Intelligent Transport workspace
        </p>
      </footer>
    </div>
  );
}
