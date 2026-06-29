"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const RUNTIME_COMPANY_ID_STORAGE_KEY = "nexus.runtimeCompanyId";

function getStoredCompanyId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return window.sessionStorage.getItem(RUNTIME_COMPANY_ID_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setStoredCompanyId(value: string): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value) {
      window.sessionStorage.setItem(RUNTIME_COMPANY_ID_STORAGE_KEY, value);
    } else {
      window.sessionStorage.removeItem(RUNTIME_COMPANY_ID_STORAGE_KEY);
    }
  } catch {
    // Ignore storage errors (private mode, restricted browser policies).
  }
}

export function useRuntimeCompanyId(): string {
  const [companyId, setCompanyId] = useState<string>(() => getStoredCompanyId());

  useEffect(() => {
    let cancelled = false;

    const resolveFromProfile = async () => {
      const queryParamCompanyId = new URLSearchParams(window.location.search).get("companyId") ?? "";
      const storedCompanyId = getStoredCompanyId();

      if (!supabase) {
        if (!cancelled) {
          setCompanyId(queryParamCompanyId || storedCompanyId);
        }
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      let authUserId = sessionData.session?.user?.id ?? "";

      // Some browsers can briefly report no session while the auth client restores state.
      // Fall back to getUser() before treating this as an unauthenticated runtime.
      if (!authUserId && !sessionError) {
        const { data: userData } = await supabase.auth.getUser();
        authUserId = userData.user?.id ?? "";
      }

      if (sessionError || !authUserId) {
        if (!cancelled) {
          // Keep previously resolved runtime context unless a query param overrides it.
          const fallbackCompanyId = queryParamCompanyId || storedCompanyId;
          setCompanyId(fallbackCompanyId);
          setStoredCompanyId(fallbackCompanyId);
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      const resolvedCompanyId =
        !profileError && typeof profile?.company_id === "string" && profile.company_id.trim().length > 0
          ? profile.company_id
          : queryParamCompanyId || storedCompanyId;

      if (!cancelled) {
        setCompanyId(resolvedCompanyId);
        setStoredCompanyId(resolvedCompanyId);
      }
    };

    const authSubscription = supabase?.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        if (!cancelled) {
          setCompanyId("");
          setStoredCompanyId("");
        }
        return;
      }

      void resolveFromProfile();
    });

    void resolveFromProfile();

    return () => {
      cancelled = true;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  return companyId;
}