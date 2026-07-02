import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalContext } from "@/lib/customerPortalAuth";
import { toDashboardDetail } from "@/lib/orders/dashboard";

type DraftJobDetailRow = Record<string, unknown>;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getCustomerPortalContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const id = params.id?.trim();

  if (!id) {
    return NextResponse.json({ error: "Missing order ID" }, { status: 400 });
  }

  const safeEmail = auth.value.customerEmail.replaceAll(",", " ").toLowerCase();

  const { data, error } = await auth.value.privilegedClient
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
        "customer_id",
        "customer_email",
      ].join(", ")
    )
    .eq("company_id", auth.value.companyId)
    .eq("id", id)
    .or(
      `customer_id.eq.${auth.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .maybeSingle<DraftJobDetailRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const detail = toDashboardDetail(data);

  try {
    const { data: events } = await auth.value.privilegedClient
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

        const summary =
          typeof event.event_summary === "string" && event.event_summary.trim().length > 0
            ? event.event_summary
            : "Timeline event";

        const podUrl =
          typeof payload.podUrl === "string"
            ? payload.podUrl
            : typeof payload.pod_url === "string"
              ? payload.pod_url
              : "";

        detail.timeline.push({
          timestamp: ts,
          label: typeof event.event_type === "string" ? event.event_type : "Event",
          detail: podUrl ? `${summary} (${podUrl})` : summary,
          kind: /failed|error|issue/i.test(summary) ? "error" : "event",
        });
      }
    }
  } catch {
    // timeline table may not exist in all environments
  }

  detail.timeline.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

  return NextResponse.json({ detail });
}
