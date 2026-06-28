"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchProfileByUserId, resolvePostSignInPath } from "@/lib/authOnboarding";
import { syncManageItSession } from "@/lib/manageIt";
import { getSupabaseProjectRefFromUrl, supabase } from "@/lib/supabaseClient";

const PUBLIC_PATHS = new Set(["/signin", "/signup"]);

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PATHS.has(pathname) || pathname.startsWith("/auth/");
}

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const [checking, setChecking] = useState(true);
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    function completeCheck() {
      if (!cancelled) {
        setChecking(false);
      }
    }

    function redirectOnce(target: string, reason: string) {
      if (hasRedirectedRef.current || cancelled) {
        return;
      }
      hasRedirectedRef.current = true;
      console.info("[AuthGate] redirect", { route: pathname, target, reason });
      router.replace(target);
    }

    async function guard() {
      try {
        hasRedirectedRef.current = false;
        setChecking(true);

        if (!supabase) {
          console.warn("[AuthGate] Supabase unavailable; skipping auth guard", {
            route: pathname,
            supabaseProjectRef: getSupabaseProjectRefFromUrl(),
          });
          completeCheck();
          return;
        }

        const isPublic = isPublicRoute(pathname);
        const isAuthEntry = pathname === "/signin" || pathname === "/signup";
        const isAuthCallback = pathname === "/auth/callback";

        const [{ data: userData }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        const user = userData.user ?? sessionData.session?.user ?? null;
        const accessToken = sessionData.session?.access_token ?? null;

        console.info("[AuthGate] session check", {
          route: pathname,
          sessionUserId: sessionData.session?.user?.id ?? null,
          resolvedUserId: user?.id ?? null,
          supabaseProjectRef: getSupabaseProjectRefFromUrl(),
        });

        if (!user) {
          try {
            await syncManageItSession(null);
          } catch (syncError) {
            console.error("[AuthGate] session clear failed", {
              route: pathname,
              error: syncError instanceof Error ? syncError.message : String(syncError),
            });
          }

          if (!isPublic) {
            redirectOnce("/signin", "no active session");
            return;
          }
          completeCheck();
          return;
        }

        try {
          await syncManageItSession(accessToken);
        } catch (syncError) {
          console.error("[AuthGate] session sync failed; continuing with active client session", {
            route: pathname,
            sessionUserId: user.id,
            error: syncError instanceof Error ? syncError.message : String(syncError),
          });
        }

        if (isAuthEntry || isAuthCallback) {
          const destination = await resolvePostSignInPath(user.id);
          console.info("[AuthGate] profile fetch result", {
            route: pathname,
            sessionUserId: user.id,
            profileDestination: destination,
          });
          redirectOnce(destination, "authenticated user on auth entry route");
          return;
        }

        if (!isPublic) {
          try {
            const profile = await fetchProfileByUserId(user.id);
            const profileExists = Boolean(profile);
            console.info("[AuthGate] profile fetch result", {
              route: pathname,
              sessionUserId: user.id,
              profileExists,
              profileId: profile?.id ?? null,
            });

            if (!profileExists && pathname !== "/onboarding") {
              redirectOnce("/onboarding", "active session without profile");
              return;
            }

            if (profileExists && pathname === "/onboarding") {
              redirectOnce("/", "profile already exists");
              return;
            }
          } catch (profileError) {
            console.error("[AuthGate] profile fetch result", {
              route: pathname,
              sessionUserId: user.id,
              profileExists: false,
              error: profileError instanceof Error ? profileError.message : String(profileError),
            });
            if (pathname !== "/") {
              redirectOnce("/", "profile fetch failed; show access setup issue");
              return;
            }
          }
        }

        completeCheck();
      } catch (err) {
        console.error("[AuthGate] guard failed; not redirecting due to indeterminate auth state", {
          route: pathname,
          error: err instanceof Error ? err.message : String(err),
        });
        completeCheck();
      }
    }

    void guard();

    return () => {
      cancelled = true;
    };
  }, [pathname, router]);

  if (checking && !isPublicRoute(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-sm text-slate-300">
        Checking session...
      </div>
    );
  }

  return <>{children}</>;
}
