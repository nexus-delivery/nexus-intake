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

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const search = (request.nextUrl.searchParams.get("search") ?? "").trim();
  const archived = request.nextUrl.searchParams.get("archived") === "true";

  let query = context.value.privilegedClient
    .from("merchant_customers")
    .select(customerSelect)
    .eq("company_id", context.value.companyId)
    .order("customer_name", { ascending: true });

  if (!archived) {
    query = query.is("archived_at", null);
  }

  if (search) {
    const escaped = search.replaceAll(",", " ");
    query = query.or(
      [
        `customer_name.ilike.%${escaped}%`,
        `company.ilike.%${escaped}%`,
        `contact_name.ilike.%${escaped}%`,
        `email.ilike.%${escaped}%`,
        `phone.ilike.%${escaped}%`,
        `mobile.ilike.%${escaped}%`,
      ].join(",")
    );
  }

  const { data, error } = await query.returns<MerchantCustomerRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    customers: (data ?? []).map((row) => mapMerchantCustomerRow(row)),
  });
}

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const payload = toPayload(body);

  if (!payload.customerName.trim()) {
    return NextResponse.json({ error: "Customer Name is required" }, { status: 400 });
  }

  const insert = toMerchantCustomerInsert(
    payload,
    context.value.companyId,
    context.value.user.id
  );

  const { data, error } = await context.value.privilegedClient
    .from("merchant_customers")
    .insert(insert)
    .select(customerSelect)
    .single<MerchantCustomerRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Create failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true, customer: mapMerchantCustomerRow(data) });
}
