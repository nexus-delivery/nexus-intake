"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import AccessSetupIssue from "@/components/AccessSetupIssue";
import { fetchProfileByUserId } from "@/lib/authOnboarding";
import { getErrorMessage, redirectWithLog } from "@/lib/authRedirect";
import { syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

const PUBLIC_PATHS = new Set(["/signin", "/signup"]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/");
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [checking, setChecking] = useState(true);
  const [accessIssue, setAccessIssue] = useState<{
    sessionUserId: string | null;
    error: unknown;
  } | null>(null);

  useEffect(() => {
    async function guard() {
      setChecking(true);
      setAccessIssue(null);
      try {
        if (!supabase) {
          setChecking(false);
          return;
        }

        const isPublic = isPublicRoute(pathname);
        const isAuthEntry = pathname === "/signin" || pathname === "/signup";
        const isOnboarding = pathname === "/onboarding";

        const [{ data, error: userError }, { data: sessionData, error: sessionError }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        const session = sessionData.session;
        const sessionUserId = session?.user?.id ?? null;
        const user = data.user ?? session?.user ?? null;

        console.info("[auth] guard snapshot", {
          route: pathname,
          sessionUserId,
          hasUser: Boolean(user),
          hasSession: Boolean(session),
          userError: userError?.message,
          sessionError: sessionError?.message,
        });

        if (userError || sessionError) {
          if (sessionUserId) {
            const authLookupError = new Error(
              `Auth lookup failed. userError=${userError?.message ?? "none"} sessionError=${sessionError?.message ?? "none"}`
            );
            console.error("[auth] authenticated lookup error, rendering access issue", {
              route: pathname,
              sessionUserId,
              error: authLookupError.message,
            });
            setAccessIssue({ sessionUserId, error: authLookupError });
            setChecking(false);
            return;
          }
        }

        if (!user || !session) {
          await syncManageItSession(null);
          if (!isPublic) {
            redirectWithLog(router, {
              route: pathname,
              target: "/signin",
              reason: "missing-session-or-user",
              sessionUserId,
            });
            return;
          }
          setChecking(false);
          return;
        }

        await syncManageItSession(session.access_token ?? null);
        const profile = await fetchProfileByUserId(user.id);
        const profileExists = Boolean(profile);
        console.info("[auth] profile fetch result", {
          route: pathname,
          sessionUserId,
          profileExists,
        });

        if (isAuthEntry || pathname === "/auth/callback") {
          redirectWithLog(router, {
            route: pathname,
            target: profileExists ? "/" : "/onboarding",
            reason: profileExists ? "authenticated-auth-entry-to-hub" : "authenticated-auth-entry-to-onboarding",
            sessionUserId,
          });
          return;
        }

        if (!profileExists && !isOnboarding) {
          redirectWithLog(router, {
            route: pathname,
            target: "/onboarding",
            reason: "missing-profile",
            sessionUserId,
          });
          return;
        }

        if (profileExists && isOnboarding) {
          redirectWithLog(router, {
            route: pathname,
            target: "/",
            reason: "profile-exists-on-onboarding",
            sessionUserId,
          });
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("[auth] guard failed", {
          route: pathname,
          error: getErrorMessage(err),
        });
        let sessionUserId: string | null = null;
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          sessionUserId = sessionData.session?.user?.id ?? null;
        }
        if (sessionUserId) {
          setAccessIssue({ sessionUserId, error: err });
          setChecking(false);
          return;
        }
        await syncManageItSession(null);
        if (!isPublicRoute(pathname)) {
          redirectWithLog(router, {
            route: pathname,
            target: "/signin",
            reason: "guard-error-without-session",
            sessionUserId,
            extra: { error: getErrorMessage(err) },
          });
          return;
        }
        setChecking(false);
      }
    }

    void guard();
  }, [pathname, router]);

  if (accessIssue) {
    return <AccessSetupIssue route={pathname} sessionUserId={accessIssue.sessionUserId} error={accessIssue.error} />;
  }

  if (checking && !isPublicRoute(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-sm text-slate-300">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
