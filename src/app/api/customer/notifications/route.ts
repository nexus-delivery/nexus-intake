import { NextRequest, NextResponse } from "next/server";
import { getCustomerPortalContext } from "@/lib/customerPortalAuth";

export async function GET(request: NextRequest) {
  const context = await getCustomerPortalContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const safeEmail = context.value.customerEmail.replaceAll(",", " ").toLowerCase();

  const { data: jobs, error: jobsError } = await context.value.privilegedClient
    .from("draft_jobs")
    .select("id, job_reference, current_status, updated_at")
    .eq("company_id", context.value.companyId)
    .or(
      `customer_id.eq.${context.value.merchantCustomerId},customer_email.ilike.%${safeEmail}%`
    )
    .order("updated_at", { ascending: false })
    .limit(100)
    .returns<Array<{ id: string; job_reference: string | null; current_status: string | null; updated_at: string | null }>>();

  if (jobsError) {
    return NextResponse.json({ error: jobsError.message }, { status: 500 });
  }

  const jobIds = (jobs ?? []).map((job) => job.id);

  let timeline: Array<{ draft_job_id: string; event_type: string; event_summary: string; created_at: string }> = [];

  if (jobIds.length > 0) {
    const { data } = await context.value.privilegedClient
      .from("discuss_it_timeline")
      .select("draft_job_id, event_type, event_summary, created_at")
      .in("draft_job_id", jobIds)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Array<{ draft_job_id: string; event_type: string; event_summary: string; created_at: string }>>();

    timeline = data ?? [];
  }

  const notifications = timeline.map((entry) => ({
    orderId: entry.draft_job_id,
    eventType: entry.event_type,
    message: entry.event_summary,
    createdAt: entry.created_at,
  }));

  if (notifications.length === 0) {
    notifications.push(
      ...(jobs ?? []).slice(0, 20).map((job) => ({
        orderId: job.id,
        eventType: "status_update",
        message: `Order ${job.job_reference ?? job.id.slice(0, 8)} status: ${job.current_status ?? "Unknown"}`,
        createdAt: job.updated_at ?? new Date().toISOString(),
      }))
    );
  }

  return NextResponse.json({ notifications });
}
