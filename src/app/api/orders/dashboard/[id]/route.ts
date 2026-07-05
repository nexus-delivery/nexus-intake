import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toDashboardDetail } from "@/lib/orders/dashboard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

function isAdminRole(role: string | null): boolean {
  const normalized = (role ?? "").trim().toLowerCase();
  return [
    "admin",
    "owner",
    "operations_admin",
    "ops_admin",
    "platform_admin",
    "super_admin",
  ].includes(normalized);
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

type DraftJobDetailRow = Record<string, unknown>;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = parseBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
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
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("company_id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    const admin = isAdminRole((profile as { role: string | null }).role ?? null);

    let query = privilegedClient
      .from("draft_jobs")
      .select(
        [
          "id",
          "company_id",
          "created_by_user_id",
          "primary_document_id",
          "job_reference",
          "external_order_id",
          "customer",
          "collection_company",
          "collection_contact",
          "collection_phone",
          "collection_email",
          "collection_address_line1",
          "collection_address_line2",
          "collection_address_line3",
          "collection_postcode",
          "collection_country",
          "collection_instructions",
          "requested_collection_date",
          "requested_collection_time",
          "delivery_company",
          "delivery_contact",
          "delivery_phone",
          "delivery_email",
          "delivery_address_line1",
          "delivery_address_line2",
          "delivery_address_line3",
          "delivery_postcode",
          "delivery_country",
          "delivery_instructions",
          "requested_delivery_date",
          "requested_delivery_time",
          "goods_description",
          "total_quantity",
          "total_packages",
          "total_pallet_count",
          "total_weight_kg",
          "service_options",
          "purchase_order",
          "commercial_net",
          "commercial_vat",
          "commercial_total",
          "commercial_cod",
          "invoice_required",
          "depot",
          "warehouse",
          "route_name",
          "route_status",
          "route_date",
          "eta_window",
          "driver_name",
          "vehicle_name",
          "collection_status",
          "delivery_status",
          "pod_available",
          "shipper",
          "service_type",
          "notes",
          "status",
          "lifecycle_status",
          "current_status",
          "trackpod_delivery_order_id",
          "trackpod_collection_order_id",
          "trackpod_delivery_tracking_url",
          "trackpod_collection_tracking_url",
          "trackpod_error_detail",
          "trackpod_error_at",
          "trackpod_push_attempted_at",
          "trackpod_push_completed_at",
          "sales_channel_name",
          "document_url",
          "document_filename",
          "document_file_type",
          "document_storage_path",
          "integration_metadata",
          "created_at",
          "updated_at",
        ].join(", ")
      )
      .eq("id", id);

    if (admin) {
      query = query;
    } else {
      query = query.eq("company_id", profile.company_id);
    }

    const { data, error } = await query.maybeSingle<DraftJobDetailRow>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const row = data as DraftJobDetailRow;
    const detail = toDashboardDetail(row);

    try {
      const { data: events } = await privilegedClient
        .from("discuss_it_timeline")
        .select("event_type, event_summary, payload, created_at")
        .eq("draft_job_id", id)
        .order("created_at", { ascending: true })
        .limit(200);

      if (Array.isArray(events)) {
        for (const event of events) {
          const ts = typeof event.created_at === "string" ? event.created_at : "";
          if (!ts) continue;
          const payload =
            event.payload && typeof event.payload === "object"
              ? (event.payload as Record<string, unknown>)
              : {};

          const podUrl =
            typeof payload.podUrl === "string"
              ? payload.podUrl
              : typeof payload.pod_url === "string"
                ? payload.pod_url
                : "";

          const summary =
            typeof event.event_summary === "string" && event.event_summary.trim().length > 0
              ? event.event_summary
              : "Timeline event";

          detail.timeline.push({
            timestamp: ts,
            label: typeof event.event_type === "string" ? event.event_type : "Event",
            detail: podUrl ? `${summary} (${podUrl})` : summary,
            kind: /failed|error|issue/i.test(summary) ? "error" : "event",
          });
        }
      }
    } catch {
      // timeline table may not exist in all environments yet
    }

    const primaryDocumentId =
      typeof row.primary_document_id === "string"
        ? (row.primary_document_id as string)
        : "";

    if (primaryDocumentId) {
      try {
      const { data: docEvents } = await privilegedClient
        .from("document_timeline")
        .select("event, metadata, created_at")
        .eq("document_id", primaryDocumentId)
        .order("created_at", { ascending: true })
        .limit(100);

      if (Array.isArray(docEvents)) {
        for (const event of docEvents) {
          const ts = typeof event.created_at === "string" ? event.created_at : "";
          if (!ts) continue;
          detail.timeline.push({
            timestamp: ts,
            label: typeof event.event === "string" ? event.event : "Document event",
            detail:
              event.metadata && typeof event.metadata === "object"
                ? JSON.stringify(event.metadata)
                : "Document timeline event",
            kind: "event",
          });
        }
      }
      } catch {
        // document timeline may not exist in all environments yet
      }
    }

    detail.timeline.sort((a, b) => {
      const da = Date.parse(a.timestamp);
      const db = Date.parse(b.timestamp);
      if (!Number.isFinite(da) && !Number.isFinite(db)) return 0;
      if (!Number.isFinite(da)) return 1;
      if (!Number.isFinite(db)) return -1;
      return db - da;
    });

    return NextResponse.json({ detail });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const token = parseBearerToken(request);
    if (!token) {
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
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
      return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
    }

    const params = await context.params;
    const id = params.id?.trim();
    if (!id) {
      return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("company_id, role")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const action = clean(body.action);

    const { data: existing, error: existingError } = await privilegedClient
      .from("draft_jobs")
      .select("id, company_id, integration_metadata, collection_address_line1, delivery_address_line1, goods_description")
      .eq("id", id)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }
    if (!existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (action === "send_to_process") {
      const hasCollection = clean(existing.collection_address_line1).length > 0;
      const hasDelivery = clean(existing.delivery_address_line1).length > 0;
      const hasGoods = clean(existing.goods_description).length > 0;
      if (!hasCollection || !hasDelivery || !hasGoods) {
        return NextResponse.json(
          { error: "Order must have collection, delivery, and goods description before sending to Process It" },
          { status: 400 }
        );
      }

      const existingMeta =
        existing.integration_metadata && typeof existing.integration_metadata === "object"
          ? (existing.integration_metadata as Record<string, unknown>)
          : {};

      const { error: updateError } = await privilegedClient
        .from("draft_jobs")
        .update({
          status: "job_created",
          lifecycle_status: "READY_FOR_TRACKPOD",
          current_status: "READY_FOR_TRACKPOD",
          integration_metadata: {
            ...existingMeta,
            readyForTrackPod: true,
            updatedAt: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("company_id", profile.company_id);

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    const payload = {
      external_order_id: clean(body.externalOrderReference),
      collection_company: clean(body.collectionName),
      collection_address_line1: clean(body.collectionAddress),
      collection_postcode: clean(body.collectionPostcode),
      delivery_company: clean(body.deliveryName),
      delivery_address_line1: clean(body.deliveryAddress),
      delivery_postcode: clean(body.deliveryPostcode),
      requested_collection_date: clean(body.requestedCollectionDate),
      requested_delivery_date: clean(body.requestedDeliveryDate),
      notes: clean(body.notes),
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update(payload)
      .eq("id", id)
      .eq("company_id", profile.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
