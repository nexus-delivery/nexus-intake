import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { toDashboardRow } from "@/lib/orders/dashboard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type Scope = "admin" | "merchant";

type Profile = {
  company_id: string;
  role: string | null;
};

type DashboardListRow = Record<string, unknown>;

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

function roleToScope(role: string | null): Scope {
  const normalized = (role ?? "").trim().toLowerCase();
  const adminRoles = new Set([
    "admin",
    "owner",
    "operations_admin",
    "ops_admin",
    "platform_admin",
    "super_admin",
  ]);
  return adminRoles.has(normalized) ? "admin" : "merchant";
}

function splitSearchTerms(search: string): string[] {
  return search
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .slice(0, 8);
}

function betweenDates(value: string, from: string, to: string): boolean {
  if (!value) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  if (from) {
    const fromParsed = Date.parse(from);
    if (Number.isFinite(fromParsed) && parsed < fromParsed) return false;
  }
  if (to) {
    const toParsed = Date.parse(to + "T23:59:59.999Z");
    if (Number.isFinite(toParsed) && parsed > toParsed) return false;
  }
  return true;
}

function buildStatusSet(filter: string): Set<string> {
  return new Set(
    filter
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .map((item) => item.toLowerCase())
  );
}

export async function GET(request: NextRequest) {
  try {
    const token = parseBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();
    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("company_id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle<Profile>();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    const params = request.nextUrl.searchParams;
    const requestedScope = params.get("scope") === "admin" ? "admin" : "merchant";
    const roleScope = roleToScope(profile.role);
    const scope: Scope = roleScope === "admin" ? requestedScope : "merchant";

    const limitParam = Number(params.get("limit") ?? "200");
    const limit = Number.isFinite(limitParam)
      ? Math.max(1, Math.min(Math.trunc(limitParam), 500))
      : 200;

    let query = privilegedClient
      .from("draft_jobs")
      .select(
        [
          "id",
          "company_id",
          "created_by_user_id",
          "job_reference",
          "external_order_id",
          "customer",
          "collection_company",
          "collection_address_line1",
          "collection_address_line2",
          "collection_address_line3",
          "collection_postcode",
          "delivery_company",
          "delivery_address_line1",
          "delivery_address_line2",
          "delivery_address_line3",
          "delivery_postcode",
          "service_options",
          "status",
          "lifecycle_status",
          "current_status",
          "trackpod_delivery_order_id",
          "trackpod_collection_order_id",
          "trackpod_delivery_tracking_url",
          "trackpod_collection_tracking_url",
          "trackpod_error_detail",
          "trackpod_error_at",
          "sales_channel_name",
          "requested_collection_date",
          "requested_delivery_date",
          "integration_metadata",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .eq("company_id", profile.company_id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (scope === "merchant") {
      query = query.eq("created_by_user_id", user.id);
    }

    const { data, error } = await query.returns<DashboardListRow[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []).map((item) => toDashboardRow(item));

    const search = (params.get("search") ?? "").trim().toLowerCase();
    const statusFilter = buildStatusSet(params.get("status") ?? "");
    const fromDate = (params.get("from") ?? "").trim();
    const toDate = (params.get("to") ?? "").trim();
    const salesChannel = (params.get("salesChannel") ?? "").trim().toLowerCase();

    const searchTerms = splitSearchTerms(search);

    const filtered = rows.filter((row) => {
      if (searchTerms.length > 0) {
        const haystack = [
          row.internalOrderNumber,
          row.externalOrderReference,
          row.customerMerchant,
          row.collectionPostcode,
          row.deliveryPostcode,
          row.collectionName,
          row.deliveryName,
        ]
          .join(" ")
          .toLowerCase();

        for (const term of searchTerms) {
          if (!haystack.includes(term)) return false;
        }
      }

      if (statusFilter.size > 0 && !statusFilter.has(row.lifecycleStatus.toLowerCase())) {
        return false;
      }

      if (salesChannel && !row.salesChannelName.toLowerCase().includes(salesChannel)) {
        return false;
      }

      if ((fromDate || toDate) && !betweenDates(row.createdAt, fromDate, toDate)) {
        return false;
      }

      return true;
    });

    return NextResponse.json({
      scope,
      jobs: filtered,
      total: filtered.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
