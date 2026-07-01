import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sanitizeStandardOrder,
  toTrackPodMapping,
  type StandardOrder,
} from "@/lib/intake/standardOrder";

type GoodsCatalogueRow = {
  catalogue_item_id: string | null;
  merchant_id: string;
  item_type: string;
  raw_description: string;
  normalised_description: string;
  product_code: string | null;
  unit_price: number;
  vat_rate: number;
  line_total: number;
  first_seen_order_id: string;
  last_seen_order_id: string;
  usage_count: number;
};

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

function parseBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function generateRef(id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = id.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${date}-${suffix}`;
}

function validate(order: StandardOrder): string | null {
  if (!order.collection.contact.trim()) return "Collection contact name is required";
  if (!order.collection.addressLine1.trim()) return "Collection address line 1 is required";
  if (!order.delivery.contact.trim()) return "Delivery contact name is required";
  if (!order.delivery.addressLine1.trim()) return "Delivery address line 1 is required";
  if (!order.goods.some((item) => item.description.trim().length > 0)) {
    return "At least one goods description is required";
  }
  return null;
}

function normaliseGoodsDescription(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

function buildCatalogueRow(args: {
  merchantId: string;
  orderId: string;
  catalogueItemId?: string;
  itemType?: string;
  description: string;
  productCode?: string;
  unitPrice?: number;
  vatRate?: number;
  lineTotal?: number;
}): GoodsCatalogueRow | null {
  const rawDescription = args.description.trim();
  if (!rawDescription) return null;

  return {
    catalogue_item_id: args.catalogueItemId?.trim() ? args.catalogueItemId.trim() : null,
    merchant_id: args.merchantId,
    item_type: args.itemType?.trim() || "product",
    raw_description: rawDescription,
    normalised_description: normaliseGoodsDescription(rawDescription),
    product_code: args.productCode?.trim() ? args.productCode.trim() : null,
    unit_price: Number.isFinite(args.unitPrice ?? NaN) ? (args.unitPrice ?? 0) : 0,
    vat_rate: Number.isFinite(args.vatRate ?? NaN) ? (args.vatRate ?? 0) : 0,
    line_total: Number.isFinite(args.lineTotal ?? NaN) ? (args.lineTotal ?? 0) : 0,
    first_seen_order_id: args.orderId,
    last_seen_order_id: args.orderId,
    usage_count: 1,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      order?: unknown;
      company_id?: string;
      merchant_id?: string;
      sales_channel_id?: string;
      sales_channel_name?: string;
    };
    const order = sanitizeStandardOrder(body.order);
    const validationError = validate(order);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();
    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    let companyId = body.company_id?.trim() || "";
    let userId: string | null = null;
    const token = parseBearerToken(request);

    if (token) {
      const {
        data: { user },
      } = await authClient.auth.getUser(token);
      userId = user?.id ?? null;

      if (userId && !companyId) {
        const { data: profile } = await privilegedClient
          .from("profiles")
          .select("company_id")
          .eq("auth_user_id", userId)
          .maybeSingle();

        companyId = profile?.company_id ?? "";
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company linked to this intake request" },
        { status: 403 }
      );
    }

    const merchantId = body.merchant_id?.trim() || companyId;
    const salesChannelId = body.sales_channel_id?.trim() || null;
    const salesChannelName = body.sales_channel_name?.trim() || order.salesChannel.trim() || null;

    const { data: inserted, error: insertError } = await privilegedClient
      .from("draft_jobs")
      .insert({
        company_id: companyId,
        created_by_user_id: userId,
        status: "job_created",
        sales_channel_id: salesChannelId,
        sales_channel_name: salesChannelName,
        lifecycle_status: order.operations.readyForTrackPod
          ? "READY_FOR_TRACKPOD"
          : "REVIEW_REQUIRED",
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create job" },
        { status: 500 }
      );
    }

    const jobId = inserted.id as string;
    const jobReference = order.orderReference.trim() || generateRef(jobId);
    const mapping = toTrackPodMapping({ ...order, orderReference: jobReference });
    const catalogueRows = order.goods
      .map((item) =>
        buildCatalogueRow({
          merchantId,
          orderId: jobId,
          catalogueItemId: item.catalogueItemId,
          itemType: item.itemType,
          description: item.description,
          productCode: item.productCode,
          unitPrice: item.unitPrice,
          vatRate: item.vatRate,
          lineTotal: item.lineTotal,
        })
      )
      .filter((item): item is GoodsCatalogueRow => item !== null);

    for (const catalogueRow of catalogueRows) {
      const { data: catalogueLookup, error: catalogueLookupError } = catalogueRow.catalogue_item_id
        ? await privilegedClient
            .from("merchant_catalogue_items")
            .select("id")
            .eq("id", catalogueRow.catalogue_item_id)
            .eq("merchant_id", catalogueRow.merchant_id)
            .maybeSingle()
        : await privilegedClient
            .from("merchant_catalogue_items")
            .select("id")
            .eq("merchant_id", catalogueRow.merchant_id)
            .eq("item_type", catalogueRow.item_type)
            .eq("name", catalogueRow.raw_description)
            .maybeSingle();

      if (catalogueLookupError) {
        return NextResponse.json(
          { error: catalogueLookupError.message ?? "Failed to read catalogue item" },
          { status: 500 }
        );
      }

      if (catalogueLookup?.id) continue;

      const { error: catalogueInsertError } = await privilegedClient
        .from("merchant_catalogue_items")
        .insert({
          merchant_id: catalogueRow.merchant_id,
          item_type: catalogueRow.item_type as "product" | "service" | "surcharge" | "labour" | "storage",
          sku: catalogueRow.product_code,
          name: catalogueRow.raw_description,
          description: catalogueRow.raw_description,
          default_price: catalogueRow.unit_price,
          vat_rate: catalogueRow.vat_rate,
          xero_account_code: null,
          xero_tax_code: null,
          active: true,
        });

      if (catalogueInsertError) {
        return NextResponse.json(
          { error: catalogueInsertError.message ?? "Failed to create catalogue item" },
          { status: 500 }
        );
      }
    }

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        job_reference: jobReference,
        sales_channel_id: salesChannelId,
        sales_channel_name: salesChannelName,
        integration_metadata: {
          source: "nexus_intake_v1",
          standardOrder: { ...order, orderReference: jobReference },
          trackPodMapping: mapping,
          catalogueLines: catalogueRows.map((item) => ({
            catalogue_item_id: item.catalogue_item_id,
            merchant_id: item.merchant_id,
            item_type: item.item_type,
            raw_description: item.raw_description,
            product_code: item.product_code,
            unit_price: item.unit_price,
            vat_rate: item.vat_rate,
            line_total: item.line_total,
          })),
        },
      })
      .eq("id", jobId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Failed to update job metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      jobReference,
      lifecycleStatus: order.operations.readyForTrackPod
        ? "READY_FOR_TRACKPOD"
        : "REVIEW_REQUIRED",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
