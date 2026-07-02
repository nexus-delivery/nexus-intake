import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalContext } from "@/lib/customerPortalAuth";

export async function GET(request: NextRequest) {
  const context = await getCustomerPortalContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const safeEmail = context.value.customerEmail.replaceAll(",", " ").toLowerCase();

  const { data, error } = await context.value.privilegedClient
    .from("draft_jobs")
    .select(
      "id, job_reference, purchase_order, commercial_net, commercial_vat, commercial_total, invoice_required, current_status, updated_at"
    )
    .eq("company_id", context.value.companyId)
    .or(
      `customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .eq("invoice_required", true)
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<
      Array<{
        id: string;
        job_reference: string | null;
        purchase_order: string | null;
        commercial_net: number | null;
        commercial_vat: number | null;
        commercial_total: number | null;
        invoice_required: boolean | null;
        current_status: string | null;
        updated_at: string | null;
      }>
    >();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data ?? [] });
}
