import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getMerchantContext } from "@/lib/serverAuth";

type BookingProfileRow = {
  id: string;
  company_id: string;
  merchant_customer_id: string;
  profile_name: string;
  collection_address_id: string | null;
  delivery_address_id: string | null;
  collection_snapshot: Record<string, unknown> | null;
  delivery_snapshot: Record<string, unknown> | null;
  service_defaults: Record<string, unknown> | null;
  goods_defaults: Array<Record<string, unknown>> | null;
  commercial_defaults: Record<string, unknown> | null;
  instructions: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const selectFields = [
  "id",
  "company_id",
  "merchant_customer_id",
  "profile_name",
  "collection_address_id",
  "delivery_address_id",
  "collection_snapshot",
  "delivery_snapshot",
  "service_defaults",
  "goods_defaults",
  "commercial_defaults",
  "instructions",
  "archived_at",
  "created_at",
  "updated_at",
].join(", ");

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isAdminRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return ["admin", "owner", "operations_admin", "ops_admin", "platform_admin", "super_admin"].includes(normalized);
}

function resolveTargetCompanyId(args: {
  authCompanyId: string;
  role: string;
  queryCompanyId?: string;
  bodyCompanyId?: string;
}): string {
  const requested = (args.queryCompanyId ?? args.bodyCompanyId ?? "").trim();
  if (requested && isAdminRole(args.role)) {
    return requested;
  }
  return args.authCompanyId;
}

function mapProfile(row: BookingProfileRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    customerId: row.merchant_customer_id,
    profileName: row.profile_name,
    collectionAddressId: row.collection_address_id,
    deliveryAddressId: row.delivery_address_id,
    collectionSnapshot: row.collection_snapshot ?? {},
    deliverySnapshot: row.delivery_snapshot ?? {},
    serviceDefaults: row.service_defaults ?? {},
    goodsDefaults: row.goods_defaults ?? [],
    commercialDefaults: row.commercial_defaults ?? {},
    instructions: row.instructions ?? "",
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function ensureCustomerBelongsToCompany(args: {
  companyId: string;
  customerId: string;
  client: SupabaseClient;
}) {
  const { companyId, customerId, client } = args;

  const { data } = await client
    .from("merchant_customers")
    .select("id")
    .eq("id", customerId)
    .eq("company_id", companyId)
    .is("archived_at", null)
    .maybeSingle<{ id: string }>();

  return Boolean(data?.id);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const customerId = text(params.id);
  const targetCompanyId = resolveTargetCompanyId({
    authCompanyId: auth.value.companyId,
    role: auth.value.role,
    queryCompanyId: request.nextUrl.searchParams.get("companyId") ?? "",
  });
  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const hasCustomer = await ensureCustomerBelongsToCompany({
    companyId: targetCompanyId,
    customerId,
    client: auth.value.privilegedClient,
  });

  if (!hasCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const includeArchived = request.nextUrl.searchParams.get("archived") === "true";

  let query = auth.value.privilegedClient
    .from("merchant_customer_booking_profiles")
    .select(selectFields)
    .eq("company_id", targetCompanyId)
    .eq("merchant_customer_id", customerId)
    .order("updated_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query.returns<BookingProfileRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ profiles: (data ?? []).map((row) => mapProfile(row)) });
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const customerId = text(params.id);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const targetCompanyId = resolveTargetCompanyId({
    authCompanyId: auth.value.companyId,
    role: auth.value.role,
    queryCompanyId: request.nextUrl.searchParams.get("companyId") ?? "",
    bodyCompanyId: typeof body.companyId === "string" ? body.companyId : "",
  });
  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const hasCustomer = await ensureCustomerBelongsToCompany({
    companyId: targetCompanyId,
    customerId,
    client: auth.value.privilegedClient,
  });

  if (!hasCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const profileName = text(body.profileName);
  if (!profileName) {
    return NextResponse.json({ error: "Profile name is required" }, { status: 400 });
  }

  const duplicateFromProfileId = text(body.duplicateFromProfileId);
  if (duplicateFromProfileId) {
    const { data: existing, error: existingError } = await auth.value.privilegedClient
      .from("merchant_customer_booking_profiles")
      .select(selectFields)
      .eq("id", duplicateFromProfileId)
      .eq("company_id", targetCompanyId)
      .eq("merchant_customer_id", customerId)
      .is("archived_at", null)
      .maybeSingle<BookingProfileRow>();

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({ error: "Source profile not found" }, { status: 404 });
    }

    const { data, error } = await auth.value.privilegedClient
      .from("merchant_customer_booking_profiles")
      .insert({
        company_id: targetCompanyId,
        merchant_customer_id: customerId,
        profile_name: profileName,
        collection_address_id: existing.collection_address_id,
        delivery_address_id: existing.delivery_address_id,
        collection_snapshot: existing.collection_snapshot ?? {},
        delivery_snapshot: existing.delivery_snapshot ?? {},
        service_defaults: existing.service_defaults ?? {},
        goods_defaults: existing.goods_defaults ?? [],
        commercial_defaults: existing.commercial_defaults ?? {},
        instructions: existing.instructions,
        created_by_user_id: auth.value.user.id,
        updated_by_user_id: auth.value.user.id,
      })
      .select(selectFields)
      .single<BookingProfileRow>();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Duplicate failed" }, { status: 500 });
    }

    return NextResponse.json({ success: true, profile: mapProfile(data) });
  }

  const payload: Record<string, unknown> = {
    company_id: targetCompanyId,
    merchant_customer_id: customerId,
    profile_name: profileName,
    collection_address_id: text(body.collectionAddressId) || null,
    delivery_address_id: text(body.deliveryAddressId) || null,
    collection_snapshot: typeof body.collectionSnapshot === "object" && body.collectionSnapshot
      ? body.collectionSnapshot
      : {},
    delivery_snapshot: typeof body.deliverySnapshot === "object" && body.deliverySnapshot
      ? body.deliverySnapshot
      : {},
    service_defaults: typeof body.serviceDefaults === "object" && body.serviceDefaults
      ? body.serviceDefaults
      : {},
    goods_defaults: Array.isArray(body.goodsDefaults) ? body.goodsDefaults : [],
    commercial_defaults: typeof body.commercialDefaults === "object" && body.commercialDefaults
      ? body.commercialDefaults
      : {},
    instructions: text(body.instructions) || null,
    created_by_user_id: auth.value.user.id,
    updated_by_user_id: auth.value.user.id,
  };

  const { data, error } = await auth.value.privilegedClient
    .from("merchant_customer_booking_profiles")
    .insert(payload)
    .select(selectFields)
    .single<BookingProfileRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, profile: mapProfile(data) });
}
