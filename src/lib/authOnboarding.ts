import { supabase } from "@/lib/supabaseClient";

export interface Profile {
  id: string;
  user_id: string;
  company_id: string;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface Company {
  id: string;
  name: string;
  trading_name?: string | null;
  business_type?: string | null;
  created_at: string;
  updated_at: string;
}

export async function createOrUpdateProfile(params: {
  userId: string;
  companyId: string;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        user_id: params.userId,
        company_id: params.companyId,
        onboarding_complete: false,
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create/update profile", { error, params });
    throw new Error(`Failed to create profile: ${error.message}`);
  }

  return data.id;
}

export async function createOrUpdateCompany(params: {
  companyId: string;
  name: string;
  businessType?: string;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("companies")
    .upsert(
      {
        id: params.companyId,
        name: params.name,
        business_type: params.businessType || null,
      },
      { onConflict: "id" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create/update company", { error, params });
    throw new Error(`Failed to create company: ${error.message}`);
  }

  return data.id;
}

export async function completeOnboarding(userId: string): Promise<void> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("profiles")
    .update({ onboarding_complete: true })
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to mark onboarding complete", { userId, error });
    throw new Error(`Failed to complete onboarding: ${error.message}`);
  }

  if (!data) {
    throw new Error("Failed to complete onboarding: profile not found");
  }
}

export async function fetchProfileByUserId(userId: string): Promise<Profile | null> {
  if (!supabase) {
    console.error("fetchProfileByUserId called without Supabase client");
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();

  if (error) {
    console.error("Failed to fetch profile", { userId, error });
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return data;
}

export async function fetchCompanyById(companyId: string): Promise<Company | null> {
  if (!supabase) {
    console.error("fetchCompanyById called without Supabase client");
    return null;
  }

  const { data, error } = await supabase.from("companies").select("*").eq("id", companyId).maybeSingle();

  if (error) {
    console.error("Failed to fetch company", { companyId, error });
    throw new Error(`Failed to fetch company: ${error.message}`);
  }

  return data;
}

export async function resolvePostSignInPath(userId: string): Promise<"/" | "/onboarding"> {
  try {
    const profile = await fetchProfileByUserId(userId);
    if (profile?.onboarding_complete) {
      return "/";
    }
    return "/onboarding";
  } catch (error) {
    console.error("Failed to resolve post-signin path", { userId, error });
    return "/onboarding";
  }
}
