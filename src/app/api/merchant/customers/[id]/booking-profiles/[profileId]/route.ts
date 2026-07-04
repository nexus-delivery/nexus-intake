import { NextRequest, NextResponse } from "next/server";
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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; profileId: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const customerId = text(params.id);
  const profileId = text(params.profileId);
  if (!customerId || !profileId) {
    return NextResponse.json({ error: "Customer ID and profile ID are required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const updatePayload: Record<string, unknown> = {
    updated_by_user_id: auth.value.user.id,
  };

  if (typeof body.profileName === "string") {
    const nextName = text(body.profileName);
    if (!nextName) {
      return NextResponse.json({ error: "Profile name cannot be empty" }, { status: 400 });
    }
    updatePayload.profile_name = nextName;
  }

  if (typeof body.collectionAddressId === "string") {
    updatePayload.collection_address_id = text(body.collectionAddressId) || null;
  }

  if (typeof body.deliveryAddressId === "string") {
    updatePayload.delivery_address_id = text(body.deliveryAddressId) || null;
  }

  if (typeof body.collectionSnapshot === "object") {
    updatePayload.collection_snapshot = body.collectionSnapshot ?? {};
  }

  if (typeof body.deliverySnapshot === "object") {
    updatePayload.delivery_snapshot = body.deliverySnapshot ?? {};
  }

  if (typeof body.serviceDefaults === "object") {
    updatePayload.service_defaults = body.serviceDefaults ?? {};
  }

  if (Array.isArray(body.goodsDefaults)) {
    updatePayload.goods_defaults = body.goodsDefaults;
  }

  if (typeof body.commercialDefaults === "object") {
    updatePayload.commercial_defaults = body.commercialDefaults ?? {};
  }

  if (typeof body.instructions === "string") {
    updatePayload.instructions = text(body.instructions) || null;
  }

  if (body.archive === true) {
    updatePayload.archived_at = new Date().toISOString();
  }

  if (body.restore === true) {
    updatePayload.archived_at = null;
  }

  const { data, error } = await auth.value.privilegedClient
    .from("merchant_customer_booking_profiles")
    .update(updatePayload)
    .eq("id", profileId)
    .eq("company_id", auth.value.companyId)
    .eq("merchant_customer_id", customerId)
    .select(selectFields)
    .maybeSingle<BookingProfileRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Booking profile not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, profile: mapProfile(data) });
}
