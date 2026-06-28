import { supabase } from "@/lib/supabaseClient";

export type BusinessType =
  | "courier"
  | "fulfilment"
  | "retailer"
  | "manufacturer"
  | "marketplace_seller"
  | "other";

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return null;
}

export function validatePhone(phone: string): boolean {
  return /^[+()\-\s0-9]{7,20}$/.test(phone.trim());
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("user already registered")) {
    return "Email already in use.";
  }
  if (lower.includes("password")) {
    return "Password is too weak. Please use at least 8 characters with upper/lowercase letters and a number.";
  }
  return message;
}

export interface Profile {
  id: string;
  auth_user_id: string;
  company_id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
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
  authUserId: string;
  companyId: string;
}): Promise<string> {
  if (!supabase) throw new Error("Supabase not configured");

  const { data, error } = await supabase
    .from("profiles")
    .upsert(
      {
        auth_user_id: params.authUserId,
        company_id: params.companyId,
      },
      { onConflict: "auth_user_id" }
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

export async function completeOnboarding(authUserId: string): Promise<void> {
  // profiles table does not have an onboarding_complete column;
  // profile existence is used to determine onboarding status.
  console.debug("Onboarding marked complete for user", { authUserId });
}

export async function fetchProfileByUserId(authUserId: string): Promise<Profile | null> {
  if (!supabase) {
    console.error("fetchProfileByUserId called without Supabase client");
    return null;
  }

  const { data, error } = await supabase.from("profiles").select("*").eq("auth_user_id", authUserId).maybeSingle();

  if (error) {
    console.error("Failed to fetch profile", { authUserId, error });
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

export async function resolvePostSignInPath(authUserId: string): Promise<"/" | "/onboarding"> {
  try {
    const profile = await fetchProfileByUserId(authUserId);
    if (profile) {
      return "/";
    }
    return "/onboarding";
  } catch (error) {
    console.error("Failed to resolve post-signin path", { authUserId, error });
    return "/onboarding";
  }
}
