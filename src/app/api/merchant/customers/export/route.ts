import { NextRequest, NextResponse } from "next/server";
import { mapMerchantCustomerRow, toCsv } from "@/lib/merchantCustomers";
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

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { data, error } = await context.value.privilegedClient
    .from("merchant_customers")
    .select(customerSelect)
    .eq("company_id", context.value.companyId)
    .is("archived_at", null)
    .order("customer_name", { ascending: true })
    .returns<MerchantCustomerRow[]>();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const customers = (data ?? []).map((row) => mapMerchantCustomerRow(row));
  const csv = toCsv(customers);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="merchant-customers.csv"',
    },
  });
}
