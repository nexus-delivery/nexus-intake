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

      if (!supabase) {
        if (!cancelled) {
          setCompanyId(queryParamCompanyId || getStoredCompanyId());
        }
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.user?.id) {
        if (!cancelled) {
          setCompanyId(queryParamCompanyId || "");
          setStoredCompanyId(queryParamCompanyId || "");
        }
        return;
      }

      const authUserId = sessionData.session.user.id;
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("auth_user_id", authUserId)
        .maybeSingle();

      const resolvedCompanyId =
        !profileError && typeof profile?.company_id === "string" && profile.company_id.trim().length > 0
          ? profile.company_id
          : queryParamCompanyId;

      if (!cancelled) {
        setCompanyId(resolvedCompanyId);
        setStoredCompanyId(resolvedCompanyId);
      }
    };

    void resolveFromProfile();

    const authSubscription = supabase?.auth.onAuthStateChange(() => {
      void resolveFromProfile();
    });

    return () => {
      cancelled = true;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  return companyId;
}