import { NextRequest, NextResponse } from "next/server";
import {
  mapMerchantCustomerRow,
  toMerchantCustomerInsert,
  type MerchantCustomerUpsert,
} from "@/lib/merchantCustomers";
import { getMerchantContext } from "@/lib/serverAuth";

type MerchantCustomerRow = Record<string, unknown>;

const customerSelect = [
  "id",
  "company_id",
  "customer_name",
  "company",
  "contact_name",
  "email",
  "mobile",
  "phone",
  "billing_address",
  "default_collection_address",
  "default_delivery_address",
  "delivery_instructions",
  "vat_number",
  "account_number",
  "pricing_profile",
  "default_service",
  "notes",
  "archived_at",
  "created_at",
  "updated_at",
].join(", ");

function toPayload(body: Record<string, unknown>): MerchantCustomerUpsert {
  const text = (value: unknown): string => (typeof value === "string" ? value : "");
  return {
    customerName: text(body.customerName),
    company: text(body.company),
    contactName: text(body.contactName),
    email: text(body.email),
    mobile: text(body.mobile),
    phone: text(body.phone),
    billingAddress: text(body.billingAddress),
    defaultCollectionAddress: text(body.defaultCollectionAddress),
    defaultDeliveryAddress: text(body.defaultDeliveryAddress),
    deliveryInstructions: text(body.deliveryInstructions),
    vatNumber: text(body.vatNumber),
    accountNumber: text(body.accountNumber),
    pricingProfile: text(body.pricingProfile),
    defaultService: text(body.defaultService),
    notes: text(body.notes),
  };
}

function isAdminRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return ["admin", "owner", "operations_admin", "ops_admin", "platform_admin", "super_admin"].includes(normalized);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const id = params.id?.trim();
  if (!id) {
    return NextResponse.json({ error: "Missing customer ID" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const requestedCompanyId = (typeof body.companyId === "string" ? body.companyId : "").trim();
  const targetCompanyId = requestedCompanyId && isAdminRole(auth.value.role)
    ? requestedCompanyId
    : auth.value.companyId;
  const archive = body.archive === true;
  const restore = body.restore === true;

  let updatePayload: Record<string, unknown>;

  if (archive || restore) {
    updatePayload = {
      archived_at: archive ? new Date().toISOString() : null,
      updated_by_user_id: auth.value.user.id,
    };
  } else {
    const payload = toPayload(body);
    if (!payload.customerName.trim()) {
      return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
    }

    updatePayload = toMerchantCustomerInsert(
      payload,
      targetCompanyId,
      auth.value.user.id,
      (body.archivedAt as string | null | undefined) ?? null
    );
    delete updatePayload.created_by_user_id;
  }

  const { data, error } = await auth.value.privilegedClient
    .from("merchant_customers")
    .update(updatePayload)
    .eq("id", id)
    .eq("company_id", targetCompanyId)
    .select(customerSelect)
    .maybeSingle<MerchantCustomerRow>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, customer: mapMerchantCustomerRow(data) });
}
