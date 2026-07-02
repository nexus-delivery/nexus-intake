import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { toDashboardDetail } from "@/lib/orders/dashboard";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

type PublicStatusRow = Record<string, unknown>;

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function lower(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function containsEmail(blob: Record<string, unknown>, email: string): boolean {
  const mapping =
    blob.trackPodMapping && typeof blob.trackPodMapping === "object"
      ? (blob.trackPodMapping as Record<string, unknown>)
      : {};

  const candidates = [
    blob.collection_email,
    blob.delivery_email,
    mapping.collection_email,
    mapping.colllection_email,
    mapping.delivery_email,
    mapping.email,
  ];

  return candidates.some((value) => lower(value) === email);
}

export async function GET(request: NextRequest) {
  try {
    const client = createPrivilegedClient();
    if (!client) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const ref = (request.nextUrl.searchParams.get("ref") ?? "").trim();
    const email = (request.nextUrl.searchParams.get("email") ?? "").trim().toLowerCase();

    if (!ref || !email) {
      return NextResponse.json(
        { error: "Reference and email are required" },
        { status: 400 }
      );
    }

    const { data, error } = await client
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
      .or(`job_reference.eq.${ref},external_order_id.eq.${ref}`)
      .order("created_at", { ascending: false })
      .limit(20)
      .returns<PublicStatusRow[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const match = (data ?? []).find((row) => {
      const metadata =
        row.integration_metadata && typeof row.integration_metadata === "object"
          ? (row.integration_metadata as Record<string, unknown>)
          : {};

      const directMatches =
        lower(row.collection_email) === email ||
        lower(row.delivery_email) === email ||
        lower(row.customer) === email;

      return directMatches || containsEmail(metadata, email);
    });

    if (!match) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const detail = toDashboardDetail(match);
    detail.timeline = detail.timeline.filter((item) => item.kind !== "system");

    try {
      const { data: events } = await client
        .from("discuss_it_timeline")
        .select("event_type, event_summary, payload, created_at")
        .eq("draft_job_id", match.id)
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
