import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalContext } from "@/lib/customerPortalAuth";

export async function GET(request: NextRequest) {
  const context = await getCustomerPortalContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const safeEmail = context.value.customerEmail.replaceAll(",", " ").toLowerCase();

  const { data: jobs, error } = await context.value.privilegedClient
    .from("draft_jobs")
    .select("id, lifecycle_status, current_status, updated_at, trackpod_delivery_tracking_url")
    .eq("company_id", context.value.companyId)
    .or(
      `customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .order("updated_at", { ascending: false })
    .limit(500)
    .returns<
      Array<{
        id: string;
        lifecycle_status: string | null;
        current_status: string | null;
        updated_at: string | null;
        trackpod_delivery_tracking_url: string | null;
      }>
    >();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = jobs ?? [];

  const summary = {
    totalOrders: rows.length,
    activeOrders: rows.filter((row) => !String(row.current_status ?? "").toLowerCase().includes("delivered")).length,
    deliveredOrders: rows.filter((row) => String(row.current_status ?? "").toLowerCase().includes("delivered")).length,
    latestUpdateAt: rows[0]?.updated_at ?? null,
  };

  return NextResponse.json({
    customer: {
      customerName: context.value.customerName,
      contactName: context.value.contactName,
      email: context.value.customerEmail,
    },
    summary,
    latestOrders: rows.slice(0, 5),
  });
}
