"use client";

import { ReactNode, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchProfileByUserId } from "@/lib/authOnboarding";
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

  useEffect(() => {
    async function guard() {
      try {
        if (!supabase) {
          setChecking(false);
          return;
        }

        const isPublic = isPublicRoute(pathname);
        const isAuthEntry = pathname === "/signin" || pathname === "/signup";
        const isOnboarding = pathname === "/onboarding";

        const [{ data }, { data: sessionData }] = await Promise.all([
          supabase.auth.getUser(),
          supabase.auth.getSession(),
        ]);
        const user = data.user;

        if (!user) {
          await syncManageItSession(null);
          if (!isPublic) {
            router.replace("/signin");
            return;
          }
          setChecking(false);
          return;
        }

        await syncManageItSession(sessionData.session?.access_token ?? null);
        const profile = await fetchProfileByUserId(user.id);
        const profileExists = Boolean(profile);

        if (isAuthEntry || pathname === "/auth/callback") {
          router.replace(profileExists ? "/" : "/onboarding");
          return;
        }

        if (!profileExists && !isOnboarding) {
          router.replace("/onboarding");
          return;
        }

        if (profileExists && isOnboarding) {
          router.replace("/");
          return;
        }

        setChecking(false);
      } catch (err) {
        console.error("Auth guard failed", err);
        await syncManageItSession(null);
        if (!isPublicRoute(pathname)) {
          router.replace("/signin");
          return;
        }
        setChecking(false);
      }
    }

    void guard();
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
