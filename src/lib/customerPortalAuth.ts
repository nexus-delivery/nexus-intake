import { NextRequest } from "next/server";
import { createClient, type User, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type PortalUserRow = {
  id: string;
  company_id: string;
  merchant_customer_id: string;
  email: string;
  full_name: string | null;
};

type MerchantCustomerRow = {
  id: string;
  customer_name: string;
  email: string | null;
  contact_name: string | null;
};

export type CustomerPortalContext = {
  user: User;
  companyId: string;
  merchantCustomerId: string;
  customerEmail: string;
  customerName: string;
  contactName: string | null;
  privilegedClient: SupabaseClient;
};

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

function parseBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function getCustomerPortalContext(
  request: NextRequest
): Promise<{ ok: true; value: CustomerPortalContext } | { ok: false; error: string; status: number }> {
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

  const { data: portalUser, error: portalError } = await privilegedClient
    .from("customer_portal_users")
    .select("id, company_id, merchant_customer_id, email, full_name")
    .eq("auth_user_id", user.id)
    .maybeSingle<PortalUserRow>();

  if (portalError || !portalUser?.company_id || !portalUser.merchant_customer_id) {
    return { ok: false, error: "Customer portal access is not configured", status: 403 };
  }

  const { data: customer, error: customerError } = await privilegedClient
    .from("merchant_customers")
    .select("id, customer_name, email, contact_name")
    .eq("id", portalUser.merchant_customer_id)
    .eq("company_id", portalUser.company_id)
    .maybeSingle<MerchantCustomerRow>();

  if (customerError || !customer?.id) {
    return { ok: false, error: "Linked customer account not found", status: 404 };
  }

  return {
    ok: true,
    value: {
      user,
      companyId: portalUser.company_id,
      merchantCustomerId: portalUser.merchant_customer_id,
      customerEmail: portalUser.email,
      customerName: customer.customer_name,
      contactName: customer.contact_name,
      privilegedClient,
    },
  };
}

export function escapeSearchTerm(value: string): string {
  return value.replaceAll(",", " ").trim();
}
