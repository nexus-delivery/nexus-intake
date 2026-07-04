import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";

type AddressType = "collection" | "delivery";

type AddressRow = {
  id: string;
  company_id: string;
  merchant_customer_id: string;
  address_type: AddressType;
  label: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address_line1: string;
  address_line2: string | null;
  address_line3: string | null;
  postcode: string;
  country: string | null;
  instructions: string | null;
  is_default: boolean;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

const selectFields = [
  "id",
  "company_id",
  "merchant_customer_id",
  "address_type",
  "label",
  "contact_name",
  "phone",
  "email",
  "address_line1",
  "address_line2",
  "address_line3",
  "postcode",
  "country",
  "instructions",
  "is_default",
  "archived_at",
  "created_at",
  "updated_at",
].join(", ");

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function mapAddress(row: AddressRow) {
  return {
    id: row.id,
    companyId: row.company_id,
    customerId: row.merchant_customer_id,
    addressType: row.address_type,
    label: row.label ?? "",
    contactName: row.contact_name ?? "",
    phone: row.phone ?? "",
    email: row.email ?? "",
    addressLine1: row.address_line1,
    addressLine2: row.address_line2 ?? "",
    addressLine3: row.address_line3 ?? "",
    postcode: row.postcode,
    country: row.country ?? "UK",
    instructions: row.instructions ?? "",
    isDefault: row.is_default === true,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; addressId: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const customerId = text(params.id);
  const addressId = text(params.addressId);
  if (!customerId || !addressId) {
    return NextResponse.json({ error: "Customer ID and address ID are required" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  const { data: existing, error: existingError } = await auth.value.privilegedClient
    .from("merchant_customer_addresses")
    .select(selectFields)
    .eq("id", addressId)
    .eq("company_id", auth.value.companyId)
    .eq("merchant_customer_id", customerId)
    .maybeSingle<AddressRow>();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json({ error: "Address not found" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    updated_by_user_id: auth.value.user.id,
  };

  if (body.archive === true) {
    updatePayload.archived_at = new Date().toISOString();
  }

  if (body.restore === true) {
    updatePayload.archived_at = null;
  }

  if (typeof body.isDefault === "boolean") {
    updatePayload.is_default = body.isDefault;
  }

  if (typeof body.label === "string") updatePayload.label = text(body.label) || null;
  if (typeof body.contactName === "string") updatePayload.contact_name = text(body.contactName) || null;
  if (typeof body.phone === "string") updatePayload.phone = text(body.phone) || null;
  if (typeof body.email === "string") updatePayload.email = text(body.email) || null;
  if (typeof body.addressLine1 === "string") updatePayload.address_line1 = text(body.addressLine1);
  if (typeof body.addressLine2 === "string") updatePayload.address_line2 = text(body.addressLine2) || null;
  if (typeof body.addressLine3 === "string") updatePayload.address_line3 = text(body.addressLine3) || null;
  if (typeof body.postcode === "string") updatePayload.postcode = text(body.postcode);
  if (typeof body.country === "string") updatePayload.country = text(body.country) || "UK";
  if (typeof body.instructions === "string") updatePayload.instructions = text(body.instructions) || null;

  const { data, error } = await auth.value.privilegedClient
    .from("merchant_customer_addresses")
    .update(updatePayload)
    .eq("id", addressId)
    .eq("company_id", auth.value.companyId)
    .eq("merchant_customer_id", customerId)
    .select(selectFields)
    .single<AddressRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Update failed" }, { status: 500 });
  }

  if (body.isDefault === true) {
    await auth.value.privilegedClient
      .from("merchant_customer_addresses")
      .update({ is_default: false, updated_by_user_id: auth.value.user.id })
      .eq("company_id", auth.value.companyId)
      .eq("merchant_customer_id", customerId)
      .eq("address_type", data.address_type)
      .is("archived_at", null)
      .neq("id", data.id);

    await auth.value.privilegedClient
      .from("merchant_customer_addresses")
      .update({ is_default: true, updated_by_user_id: auth.value.user.id })
      .eq("id", data.id)
      .eq("company_id", auth.value.companyId);
  }

  return NextResponse.json({ success: true, address: mapAddress(data) });
}
