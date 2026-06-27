"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { resolvePostSignInPath } from "@/lib/customerAuth";
import { syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Completing sign in...");

  useEffect(() => {
    async function completeAuth() {
      try {
        if (!supabase) {
          router.replace("/signin");
          return;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error || !data.session?.user) {
          setMessage("Unable to validate session. Redirecting...");
          router.replace("/signin");
          return;
        }

        await syncManageItSession(data.session.access_token ?? null);
        const destination = await resolvePostSignInPath(
          data.session.user.id,
          data.session.user.email ?? null
        );
        router.replace(destination);
      } catch {
        setMessage("Unable to complete sign in. Redirecting...");
        router.replace("/signin");
      }
    }

    void completeAuth();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-sm text-slate-200">
      {message}
    </div>
  );
}
