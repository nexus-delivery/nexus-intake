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
    .select("id, job_reference, document_filename, document_url, document_file_type, updated_at")
    .eq("company_id", context.value.companyId)
    .or(
      `customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .not("document_url", "is", null)
    .order("updated_at", { ascending: false })
    .limit(200)
    .returns<
      Array<{
        id: string;
        job_reference: string | null;
        document_filename: string | null;
        document_url: string | null;
        document_file_type: string | null;
        updated_at: string | null;
      }>
    >();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ documents: data ?? [] });
}
