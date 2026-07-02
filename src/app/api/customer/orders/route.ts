import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalContext } from "@/lib/customerPortalAuth";
import { toDashboardRow } from "@/lib/orders/dashboard";

type DashboardListRow = Record<string, unknown>;

function splitSearchTerms(search: string): string[] {
  return search
    .split(/\s+/)
    .map((term) => term.trim())
    .filter((term) => term.length > 0)
    .slice(0, 8);
}

export async function GET(request: NextRequest) {
  const context = await getCustomerPortalContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const params = request.nextUrl.searchParams;
  const search = (params.get("search") ?? "").trim().toLowerCase();

  const safeEmail = context.value.customerEmail.replaceAll(",", " ").toLowerCase();

  const { data, error } = await context.value.privilegedClient
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
        "customer_id",
        "customer_email",
      ].join(", ")
    )
    .eq("company_id", context.value.companyId)
    .or(
      `customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .order("created_at", { ascending: false })
    .limit(300)
    .returns<DashboardListRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []).map((item) => toDashboardRow(item));
  const terms = splitSearchTerms(search);

  const jobs = terms.length
    ? rows.filter((row) => {
        const haystack = [
          row.internalOrderNumber,
          row.externalOrderReference,
          row.collectionName,
          row.deliveryName,
          row.collectionPostcode,
          row.deliveryPostcode,
        ]
          .join(" ")
          .toLowerCase();

        return terms.every((term) => haystack.includes(term));
      })
    : rows;

  return NextResponse.json({ jobs, total: jobs.length });
}
