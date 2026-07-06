import { NextRequest } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export type MerchantContext = {
  user: User;
  companyId: string;
  role: string;
  privilegedClient: SupabaseClient;
};

export function normalizeProfileRole(role: unknown): string {
  const normalized = typeof role === "string" ? role.trim().toLowerCase() : "";
  if (!normalized) return "";
  if (["ops_admin", "operations_admin", "operations"].includes(normalized)) return "operations";
  if (["platform_admin", "super_admin", "admin", "owner"].includes(normalized)) return "super_admin";
  return normalized;
}

export function canManageMerchants(role: unknown): boolean {
  return ["super_admin", "company_admin", "operations"].includes(normalizeProfileRole(role));
}

export function parseBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function createAuthClient() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getMerchantContext(
  request: NextRequest
): Promise<{ ok: true; value: MerchantContext } | { ok: false; error: string; status: number }> {
  const token = parseBearerToken(request);
  if (!token) {
    return { ok: false, error: "Session expired. Please sign in again.", status: 401 };
  }

  const authClient = createAuthClient();
  const privilegedClient = createPrivilegedClient();
  if (!authClient || !privilegedClient) {
    return { ok: false, error: "Supabase not configured", status: 500 };
  }

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, error: "Session expired. Please sign in again.", status: 401 };
  }

  const { data: profile, error: profileError } = await privilegedClient
    .from("profiles")
    .select("company_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    return { ok: false, error: "No company linked to user", status: 403 };
  }

  return {
    ok: true,
    value: {
      user,
      companyId: String(profile.company_id),
      role: normalizeProfileRole(profile.role),
      privilegedClient,
    },
  };
}
