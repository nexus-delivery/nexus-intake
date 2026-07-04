import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
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
  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const hasCustomer = await ensureCustomerBelongsToCompany({
    companyId: auth.value.companyId,
    customerId,
    client: auth.value.privilegedClient,
  });

  if (!hasCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const typeFilter = text(request.nextUrl.searchParams.get("type"));
  const includeArchived = request.nextUrl.searchParams.get("archived") === "true";

  let query = auth.value.privilegedClient
    .from("merchant_customer_addresses")
    .select(selectFields)
    .eq("company_id", auth.value.companyId)
    .eq("merchant_customer_id", customerId)
    .order("is_default", { ascending: false })
    .order("updated_at", { ascending: false });

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  if (typeFilter === "collection" || typeFilter === "delivery") {
    query = query.eq("address_type", typeFilter);
  }

  const { data, error } = await query.returns<AddressRow[]>();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ addresses: (data ?? []).map((row) => mapAddress(row)) });
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
  if (!customerId) {
    return NextResponse.json({ error: "Customer ID is required" }, { status: 400 });
  }

  const hasCustomer = await ensureCustomerBelongsToCompany({
    companyId: auth.value.companyId,
    customerId,
    client: auth.value.privilegedClient,
  });

  if (!hasCustomer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const addressType = text(body.addressType) as AddressType;
  if (addressType !== "collection" && addressType !== "delivery") {
    return NextResponse.json({ error: "Address type must be collection or delivery" }, { status: 400 });
  }

  const addressLine1 = text(body.addressLine1);
  const postcode = text(body.postcode);
  if (!addressLine1 || !postcode) {
    return NextResponse.json({ error: "Address line 1 and postcode are required" }, { status: 400 });
  }

  const shouldDefault = body.isDefault === true;

  const insertPayload: Record<string, unknown> = {
    company_id: auth.value.companyId,
    merchant_customer_id: customerId,
    address_type: addressType,
    label: text(body.label) || null,
    contact_name: text(body.contactName) || null,
    phone: text(body.phone) || null,
    email: text(body.email) || null,
    address_line1: addressLine1,
    address_line2: text(body.addressLine2) || null,
    address_line3: text(body.addressLine3) || null,
    postcode,
    country: text(body.country) || "UK",
    instructions: text(body.instructions) || null,
    is_default: shouldDefault,
    archived_at: null,
    created_by_user_id: auth.value.user.id,
    updated_by_user_id: auth.value.user.id,
  };

  const { data, error } = await auth.value.privilegedClient
    .from("merchant_customer_addresses")
    .insert(insertPayload)
    .select(selectFields)
    .single<AddressRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
  }

  if (shouldDefault) {
    await auth.value.privilegedClient
      .from("merchant_customer_addresses")
      .update({ is_default: false, updated_by_user_id: auth.value.user.id })
      .eq("company_id", auth.value.companyId)
      .eq("merchant_customer_id", customerId)
      .eq("address_type", addressType)
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
