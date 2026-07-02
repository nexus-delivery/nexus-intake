import { NextRequest, NextResponse } from "next/server";
import {
  csvRowToUpsert,
  parseCsv,
  toMerchantCustomerInsert,
  type MerchantCustomerUpsert,
} from "@/lib/merchantCustomers";
import { getMerchantContext } from "@/lib/serverAuth";

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => ({}))) as { csvText?: string };
  const csvText = typeof body.csvText === "string" ? body.csvText : "";

  if (!csvText.trim()) {
    return NextResponse.json({ error: "CSV text is required" }, { status: 400 });
  }

  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return NextResponse.json({ error: "CSV must include headers and at least one row" }, { status: 400 });
  }

  const headers = rows[0].map((h) => h.trim().toLowerCase());
  const headerMap: Record<string, number> = {};
  headers.forEach((header, index) => {
    headerMap[header] = index;
  });

  const payloads: MerchantCustomerUpsert[] = [];
  for (let i = 1; i < rows.length; i += 1) {
    const rowPayload = csvRowToUpsert(headerMap, rows[i]);
    if (rowPayload.customerName.trim().length === 0) continue;
    payloads.push(rowPayload);
  }

  if (payloads.length === 0) {
    return NextResponse.json({ error: "No valid customer rows found" }, { status: 400 });
  }

  const inserts = payloads.map((payload) =>
    toMerchantCustomerInsert(payload, context.value.companyId, context.value.user.id)
  );

  const { error } = await context.value.privilegedClient
    .from("merchant_customers")
    .insert(inserts);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, imported: inserts.length });
}
