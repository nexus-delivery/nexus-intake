import { NextRequest, NextResponse } from "next/server";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

type DocumentItScope = "admin" | "merchant" | "customer" | "operations";
type DraftJobRow = Record<string, unknown>;

type DocumentRecord = {
  id: string;
  merchantName: string;
  customerName: string;
  orderNumber: string;
  orderRef: string;
  status: string;
  routeStatus: string;
  routeDate: string;
  etaWindow: string;
  etaFrom: string;
  etaTo: string;
  deliveryPostcode: string;
  documentType: string;
  documentUrl: string;
  podAvailable: boolean;
  trackPodLink: string;
  createdAt: string;
  updatedAt: string;
  callPhone: string;
  email: string;
  whatsappLink: string;
  viewOrderHref: string;
  needsAttention: boolean;
  issueReasons: string[];
};

type DocumentSummary = {
  total: number;
  needsAttention: number;
  withDocument: number;
  withPod: number;
  routeConfirmed: number;
};

type ActorContext = {
  user: User;
  client: SupabaseClient;
  companyId: string;
  role: string;
  customerEmail: string;
  merchantCustomerId: string;
  scope: DocumentItScope;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const ADMIN_ROLES = new Set(["super_admin", "platform_admin", "operations_admin", "admin"]);
const OPS_ROLES = new Set(["operations", "operations_user", "planner", "dispatcher"]);

function parseBearerToken(request: NextRequest): string {
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

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown): string {
  return text(value).toLowerCase();
}

function hasOperationalRelevance(record: DocumentRecord): boolean {
  if (record.needsAttention) return true;

  const status = `${record.status} ${record.routeStatus}`.toLowerCase();
  return (
    status.includes("ready for operations") ||
    status.includes("ready_for_trackpod") ||
    status.includes("ready for route") ||
    status.includes("route in planning") ||
    status.includes("route confirmed")
  );
}

function deriveIssueReasons(input: {
  status: string;
  routeStatus: string;
  routeDate: string;
  etaWindow: string;
  etaFrom: string;
  etaTo: string;
  deliveryPostcode: string;
  documentUrl: string;
  podAvailable: boolean;
  trackPodLink: string;
}): string[] {
  const reasons: string[] = [];
  const status = `${input.status} ${input.routeStatus}`.toLowerCase();

  if (!input.deliveryPostcode) reasons.push("missing_delivery_postcode");
  if (!input.routeStatus || input.routeStatus.toLowerCase() === "not planned") reasons.push("route_not_planned");
  if (!input.routeDate) reasons.push("missing_route_date");
  if (!input.etaWindow && !input.etaFrom && !input.etaTo) reasons.push("missing_eta");
  if (!input.documentUrl && !input.podAvailable) reasons.push("missing_document_or_pod");
  if (!input.trackPodLink && !input.podAvailable) reasons.push("missing_trackpod_link");

  if (status.includes("failed") || status.includes("issue") || status.includes("exception")) {
    reasons.push("delivery_or_sync_exception");
  }

  return Array.from(new Set(reasons));
}

function deriveDocumentType(row: DraftJobRow): string {
  const explicitType = text(row.document_file_type);
  if (explicitType) return explicitType;
  const filename = text(row.document_filename).toLowerCase();
  if (filename.endsWith(".pdf")) return "pdf";
  if ([".jpg", ".jpeg", ".png", ".webp"].some((ext) => filename.endsWith(ext))) return "image";
  if (text(row.current_status).toLowerCase().includes("pod") || row.pod_available === true) return "pod";
  return "order_record";
}

function toWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (!digits) return "";
  return `https://wa.me/${encodeURIComponent(digits)}?text=${encodeURIComponent(message)}`;
}

function resolveRequestedView(scope: DocumentItScope, requested: string): DocumentItScope {
  const normalized = requested.trim().toLowerCase();
  if (scope === "admin") {
    if (normalized === "operations") return "operations";
    if (normalized === "merchant") return "merchant";
    return "admin";
  }
  if (scope === "operations") return "operations";
  if (scope === "customer") return "customer";
  return "merchant";
}

async function resolveActorContext(request: NextRequest): Promise<{ ok: true; value: ActorContext } | { ok: false; status: number; error: string }> {
  const token = parseBearerToken(request);
  if (!token) {
    return { ok: false, status: 401, error: "Unauthorised" };
  }

  const authClient = createAuthClient();
  const client = createPrivilegedClient();
  if (!authClient || !client) {
    return { ok: false, status: 500, error: "Supabase not configured" };
  }

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return { ok: false, status: 401, error: "Unauthorised" };
  }

  const [{ data: profile }, { data: portalUser }] = await Promise.all([
    client
      .from("profiles")
      .select("company_id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ company_id: string | null; role: string | null }>(),
    client
      .from("customer_portal_users")
      .select("company_id, merchant_customer_id, email")
      .eq("auth_user_id", user.id)
      .maybeSingle<{ company_id: string; merchant_customer_id: string; email: string }>(),
  ]);

  const role = normalizeRole(profile?.role);
  const companyId = text(profile?.company_id) || text(portalUser?.company_id);
  const customerEmail = text(portalUser?.email) || text(user.email).toLowerCase();
  const merchantCustomerId = text(portalUser?.merchant_customer_id);

  if (!companyId && !ADMIN_ROLES.has(role)) {
    return { ok: false, status: 403, error: "No company linked to user" };
  }

  let scope: DocumentItScope;
  if (merchantCustomerId || role === "customer") {
    scope = "customer";
  } else if (ADMIN_ROLES.has(role)) {
    scope = "admin";
  } else if (OPS_ROLES.has(role)) {
    scope = "operations";
  } else {
    scope = "merchant";
  }

  return {
    ok: true,
    value: {
      user,
      client,
      companyId,
      role,
      customerEmail,
      merchantCustomerId,
      scope,
    },
  };
}

export async function GET(request: NextRequest) {
  const context = await resolveActorContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const requestedView = request.nextUrl.searchParams.get("view") ?? "";
  const activeView = resolveRequestedView(context.value.scope, requestedView);
  const onlyIssues = request.nextUrl.searchParams.get("onlyIssues") === "true";

  const draftJobSelect = [
    "id",
    "company_id",
    "job_reference",
    "external_order_id",
    "customer",
    "customer_id",
    "customer_email",
    "collection_company",
    "collection_contact",
    "collection_phone",
    "delivery_contact",
    "delivery_phone",
    "delivery_email",
    "delivery_postcode",
    "status",
    "lifecycle_status",
    "current_status",
    "document_url",
    "document_filename",
    "document_file_type",
    "trackpod_delivery_tracking_url",
    "trackpod_collection_tracking_url",
    "pod_available",
    "route_status",
    "route_date",
    "eta_window",
    "eta_from",
    "eta_to",
    "created_at",
    "updated_at",
  ].join(", ");

  let query = context.value.client
    .from("draft_jobs")
    .select(draftJobSelect);

  if (activeView === "merchant" || activeView === "operations") {
    query = query.eq("company_id", context.value.companyId);
  }

  if (activeView === "customer") {
    const safeEmail = context.value.customerEmail.replaceAll(",", " ").toLowerCase();
    if (!context.value.companyId) {
      return NextResponse.json({ error: "Customer context is missing company" }, { status: 403 });
    }
    query = query
      .eq("company_id", context.value.companyId)
      .or(`customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(600)
    .returns<DraftJobRow[]>();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const companyIds = Array.from(new Set(rows.map((row) => text(row.company_id)).filter(Boolean)));
  const customerIds = Array.from(new Set(rows.map((row) => text(row.customer_id)).filter(Boolean)));

  const [companyRes, customerRes] = await Promise.all([
    companyIds.length > 0
      ? context.value.client
          .from("companies")
          .select("id, name, trading_name")
          .in("id", companyIds)
          .returns<Array<{ id: string; name: string | null; trading_name: string | null }>>()
      : Promise.resolve({ data: [], error: null as null | { message: string } }),
    customerIds.length > 0
      ? context.value.client
          .from("merchant_customers")
          .select("id, customer_name")
          .in("id", customerIds)
          .returns<Array<{ id: string; customer_name: string | null }>>()
      : Promise.resolve({ data: [], error: null as null | { message: string } }),
  ]);

  if (companyRes.error) {
    return NextResponse.json({ error: companyRes.error.message }, { status: 500 });
  }

  if (customerRes.error) {
    return NextResponse.json({ error: customerRes.error.message }, { status: 500 });
  }

  const companyMap = new Map(
    (companyRes.data ?? []).map((entry) => [entry.id, text(entry.trading_name) || text(entry.name)])
  );
  const customerMap = new Map((customerRes.data ?? []).map((entry) => [entry.id, text(entry.customer_name)]));

  let records = rows.map((row): DocumentRecord => {
    const orderNumber = text(row.job_reference);
    const orderRef = text(row.external_order_id);
    const merchantName = companyMap.get(text(row.company_id)) || text(row.collection_company) || "-";
    const customerName =
      customerMap.get(text(row.customer_id)) || text(row.customer) || text(row.delivery_contact) || "-";
    const status = text(row.current_status) || text(row.lifecycle_status) || text(row.status) || "Created";
    const routeStatus = text(row.route_status) || "Not Planned";
    const routeDate = text(row.route_date);
    const etaWindow = text(row.eta_window);
    const etaFrom = text(row.eta_from);
    const etaTo = text(row.eta_to);
    const documentUrl = text(row.document_url);
    const trackPodLink = text(row.trackpod_delivery_tracking_url) || text(row.trackpod_collection_tracking_url);
    const callPhone = text(row.delivery_phone) || text(row.collection_phone);
    const email = text(row.delivery_email) || text(row.customer_email);
    const issueReasons = deriveIssueReasons({
      status,
      routeStatus,
      routeDate,
      etaWindow,
      etaFrom,
      etaTo,
      deliveryPostcode: text(row.delivery_postcode),
      documentUrl,
      podAvailable: row.pod_available === true,
      trackPodLink,
    });
    const scopeBasePath = context.value.scope === "admin" ? "/orders" : "/portal/orders";

    return {
      id: text(row.id),
      merchantName,
      customerName,
      orderNumber,
      orderRef,
      status,
      routeStatus,
      routeDate,
      etaWindow,
      etaFrom,
      etaTo,
      deliveryPostcode: text(row.delivery_postcode),
      documentType: deriveDocumentType(row),
      documentUrl,
      podAvailable: row.pod_available === true,
      trackPodLink,
      createdAt: text(row.created_at),
      updatedAt: text(row.updated_at),
      callPhone,
      email,
      whatsappLink: toWhatsAppLink(callPhone, `NEXUS order update: ${orderNumber || orderRef || "order"}`),
      viewOrderHref: scopeBasePath,
      needsAttention: issueReasons.length > 0,
      issueReasons,
    };
  });

  if (activeView === "operations") {
    records = records.filter((record) => hasOperationalRelevance(record));
  }

  if (onlyIssues) {
    records = records.filter((record) => record.needsAttention);
  }

  const summary: DocumentSummary = {
    total: records.length,
    needsAttention: records.filter((record) => record.needsAttention).length,
    withDocument: records.filter((record) => Boolean(record.documentUrl)).length,
    withPod: records.filter((record) => record.podAvailable).length,
    routeConfirmed: records.filter((record) => record.routeStatus.toLowerCase() === "route confirmed").length,
  };

  return NextResponse.json({
    scope: context.value.scope,
    activeView,
    availableViews:
      context.value.scope === "admin"
        ? ["admin", "operations", "merchant"]
        : context.value.scope === "operations"
          ? ["operations"]
          : context.value.scope === "customer"
            ? ["customer"]
            : ["merchant"],
    total: records.length,
    summary,
    records,
  });
}
