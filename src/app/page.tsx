"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AccessSetupIssue from "@/components/AccessSetupIssue";
import { fetchCompanyById, fetchProfileByUserId } from "@/lib/authOnboarding";
import {
  type AuthenticatedAccessIssue,
  buildAuthLookupError,
  getErrorMessage,
  redirectWithLog,
  resolveAuthUser,
} from "@/lib/authRedirect";
import { getManageItAccessProfile, syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

const operationalSpotlights = [
  {
    title: "Create IT",
    description: "Create delivery requests, bookings and orders.",
    href: "/create-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    title: "Route IT",
    description: "Plan routes, manage consignments and dispatch drivers.",
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
    title: "Track IT",
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
    title: "Store IT",
    description: "Warehouse management, inventory and stock control.",
    href: "/store-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M4 8l8-5 8 5v11H4V8z" />
        <path d="M12 3v18" />
        <path d="M8 12h8" />
      </svg>
    ),
  },
  {
    title: "Account IT",
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
    title: "Manage IT",
    description: "Operations control room, documents and settings.",
    href: "/manage-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <rect x="3" y="3" width="8" height="8" rx="1.5" />
        <rect x="13" y="3" width="8" height="8" rx="1.5" />
        <rect x="3" y="13" width="8" height="8" rx="1.5" />
        <rect x="13" y="13" width="8" height="8" rx="1.5" />
      </svg>
    ),
  },
  {
    title: "Report IT",
    description: "Analytics, performance metrics and daily reports.",
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
];

const platformSpotlights = [
  {
    title: "Build IT",
    description: "Development centre — roadmap, sprint board, architecture and integrations.",
    href: "/build-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M14.5 2.5c0 1.5-1.5 3-3 4.5S8 10 8 11.5a4 4 0 008 0c0-1.5-1.5-3-3-4.5" />
        <path d="M12 17v4" />
        <path d="M9 21h6" />
      </svg>
    ),
  },
  {
    title: "Improve IT",
    description: "Customer improvement centre — feedback, ideas and future requests.",
    href: "/improve-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    title: "Need IT",
    description: "Customer support — help articles, live chat and contact resources.",
    href: "/need-it",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <path d="M12 17h.01" />
      </svg>
    ),
  },
];

export default function HubPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [canAccessManageIt, setCanAccessManageIt] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [accessIssue, setAccessIssue] = useState<AuthenticatedAccessIssue | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      let cachedSessionUserId: string | null = null;
      try {
        if (!isMounted) return;
        setAccessIssue(null);
        if (!supabase) {
          if (!isMounted) return;
          setAuthLoading(false);
          return;
        }

        const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
          supabase.auth.getSession(),
          supabase.auth.getUser(),
        ]);
        const session = sessionData.session;
        const sessionUserId = session?.user?.id ?? null;
        cachedSessionUserId = sessionUserId;
        const user = resolveAuthUser(userData.user, session);

        console.info("[hub] bootstrap auth snapshot", {
          route: "/",
          sessionUserId,
          hasSession: Boolean(session),
          hasUser: Boolean(user),
          sessionError: sessionError?.message,
          userError: userError?.message,
        });

        if (sessionError || userError) {
          if (sessionUserId) {
            const authLookupError = buildAuthLookupError(userError?.message, sessionError?.message);
            console.error("[hub] authenticated auth lookup error", {
              route: "/",
              sessionUserId,
              error: authLookupError.message,
            });
            if (!isMounted) return;
            setAccessIssue({ sessionUserId, error: authLookupError });
            setAuthLoading(false);
            return;
          }
        }

        if (!user || !session) {
          await syncManageItSession(null);
          redirectWithLog(router, {
            route: "/",
            target: "/signin",
            reason: "missing-session-or-user",
            sessionUserId,
          });
          return;
        }

        await syncManageItSession(session.access_token ?? null);

        let profileRecord;
        try {
          profileRecord = await fetchProfileByUserId(user.id);
        } catch (profileError) {
          console.error("[hub] profile fetch failed", {
            route: "/",
            sessionUserId,
            error: getErrorMessage(profileError),
          });
          if (!isMounted) return;
          setAccessIssue({ sessionUserId, error: profileError });
          setAuthLoading(false);
          return;
        }

        console.info("[hub] profile fetch result", {
          route: "/",
          sessionUserId,
          profileExists: Boolean(profileRecord),
          profileId: profileRecord?.id ?? null,
          companyId: profileRecord?.company_id ?? null,
        });

        if (!profileRecord) {
          redirectWithLog(router, {
            route: "/",
            target: "/onboarding",
            reason: "missing-profile",
            sessionUserId,
          });
          return;
        }

        if (profileRecord.company_id) {
          try {
            const company = await fetchCompanyById(profileRecord.company_id);
            console.info("[hub] company fetch result", {
              route: "/",
              sessionUserId,
              companyId: profileRecord.company_id,
              companyName: company?.name ?? null,
            });
            if (!company) {
              const missingCompanyError = new Error(
                "We could not load your company access yet. Please contact support to complete setup."
              );
              console.error("[hub] company lookup returned no row", {
                route: "/",
                sessionUserId,
                companyId: profileRecord.company_id,
                profileId: profileRecord.id,
                error: missingCompanyError.message,
              });
              if (!isMounted) return;
              setAccessIssue({ sessionUserId, error: missingCompanyError });
              setAuthLoading(false);
              return;
            }
            setCompanyName(company?.name ?? null);
          } catch (companyError) {
            console.error("[hub] company fetch failed", {
              route: "/",
              sessionUserId,
              companyId: profileRecord.company_id,
              error: getErrorMessage(companyError),
            });
            if (!isMounted) return;
            setAccessIssue({ sessionUserId, error: companyError });
            setAuthLoading(false);
            return;
          }
        }

        setUserEmail(user.email ?? null);

        try {
          const profile = await getManageItAccessProfile();
          setCanAccessManageIt(profile.canAccessManageIt);
        } catch (accessProfileError) {
          console.error("[hub] manage-it access profile fetch failed", {
            route: "/",
            sessionUserId,
            error: getErrorMessage(accessProfileError),
          });
          if (!isMounted) return;
          setAccessIssue({ sessionUserId, error: accessProfileError });
          setAuthLoading(false);
          return;
        }

        if (!isMounted) return;
        setAuthLoading(false);
      } catch (err) {
        console.error("[hub] bootstrap failed", {
          route: "/",
          error: getErrorMessage(err),
        });
        let sessionUserId: string | null = null;
        if (cachedSessionUserId) {
          sessionUserId = cachedSessionUserId;
        } else if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          sessionUserId = sessionData.session?.user?.id ?? null;
        }
        if (sessionUserId) {
          if (!isMounted) return;
          setAccessIssue({ sessionUserId, error: err });
          setAuthLoading(false);
          return;
        }
        redirectWithLog(router, {
          route: "/",
          target: "/signin",
          reason: "hub-bootstrap-error-without-session",
          sessionUserId,
          extra: { error: getErrorMessage(err) },
        });
      }
    }

    void bootstrap();
    return () => {
      isMounted = false;
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
        Loading The Hub...
      </div>
    );
  }

  if (accessIssue) {
    return <AccessSetupIssue route="/" sessionUserId={accessIssue.sessionUserId} error={accessIssue.error} />;
  }

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col">
      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-5 sm:px-10 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7C3AED] text-sm font-bold text-white shadow shadow-[#7C3AED]/40">
            N
          </div>
          <span className="text-sm font-semibold text-white tracking-wide">Nexus IT</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">The Hub</p>
            <p className="text-xs text-slate-300">{companyName ?? userEmail ?? "Customer"}</p>
            {signOutError ? <p className="text-[11px] text-red-300">{signOutError}</p> : null}
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="rounded-lg border border-white/20 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center px-6 py-14 sm:px-10">
        <div className="w-full max-w-6xl">
          {/* Headline */}
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#7C3AED] mb-4">
              The Hub
            </p>
            <h1 className="text-4xl sm:text-5xl font-semibold text-white tracking-tight leading-tight">
              What would you like to IT today?
            </h1>
            <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto leading-relaxed">
              Every capability lives here. Select a Spotlight to begin.
            </p>
          </div>

          {/* ── Operational Spotlights ───────────────────────────── */}
          <section className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 mb-5">
              Operational Spotlights
            </p>
            <div className="hub-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {operationalSpotlights
                .filter((spotlight) => spotlight.href !== "/manage-it" || canAccessManageIt)
                .map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="hub-card group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#7C3AED]/50 hover:bg-white/8 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="hub-card-icon flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#a78bfa]">
                      {s.icon}
                    </div>
                    <span className="hub-card-arrow text-[#7C3AED] text-lg font-light">→</span>
                  </div>
                  <h2 className="text-base font-semibold text-white mb-2">{s.title}</h2>
                  <p className="text-sm leading-relaxed text-slate-400">{s.description}</p>
                </Link>
              ))}
            </div>
          </section>

          {/* ── Platform Spotlights ──────────────────────────────── */}
          <section>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 mb-5">
              Platform Spotlights
            </p>
            <div className="hub-grid grid gap-4 sm:grid-cols-3">
              {platformSpotlights.map((s) => (
                <Link
                  key={s.href}
                  href={s.href}
                  className="hub-card group relative flex flex-col rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-[#7C3AED]/50 hover:bg-white/8 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-5">
                    <div className="hub-card-icon flex h-12 w-12 items-center justify-center rounded-xl bg-[#7C3AED]/20 text-[#a78bfa]">
                      {s.icon}
                    </div>
                    <span className="hub-card-arrow text-[#7C3AED] text-lg font-light">→</span>
                  </div>
                  <h2 className="text-base font-semibold text-white mb-2">{s.title}</h2>
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
          Nexus IT · Intelligent Transport by Nexus
        </p>
      </footer>
    </div>
  );
}
