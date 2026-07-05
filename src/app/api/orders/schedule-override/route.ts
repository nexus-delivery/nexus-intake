import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function createAuthClient() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length).trim() : "";
}

const fieldToDraftJobColumn = {
  collection_date: "override_collection_date",
  collection_time: "override_collection_time",
  delivery_date: "override_delivery_date",
  delivery_time: "override_delivery_time",
} as const;

type FieldName = keyof typeof fieldToDraftJobColumn;

export async function POST(request: NextRequest) {
  const token = parseBearerToken(request);
  if (!token) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const authClient = createAuthClient();
  const privilegedClient = createPrivilegedClient();
  if (!authClient || !privilegedClient) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return NextResponse.json({ error: "Session expired. Please sign in again." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    draft_job_id?: string;
    field_name?: FieldName;
    new_value?: string;
    reason?: string;
  };

  const draftJobId = body.draft_job_id?.trim() ?? "";
  const fieldName = body.field_name;
  const newValue = body.new_value?.trim() ?? "";
  const reason = body.reason?.trim() ?? "";

  if (!draftJobId || !fieldName || !(fieldName in fieldToDraftJobColumn)) {
    return NextResponse.json({ error: "Invalid schedule override payload" }, { status: 400 });
  }

  if (!reason) {
    return NextResponse.json({ error: "Merchant overrides require a reason" }, { status: 400 });
  }

  const { data: profile, error: profileError } = await privilegedClient
    .from("profiles")
    .select("id, company_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
  }

  const { data: draftJob, error: draftJobError } = await privilegedClient
    .from("draft_jobs")
    .select("id, company_id, requested_collection_date, requested_collection_time, requested_delivery_date, requested_delivery_time")
    .eq("id", draftJobId)
    .eq("company_id", profile.company_id)
    .maybeSingle();

  if (draftJobError) {
    return NextResponse.json({ error: draftJobError.message }, { status: 500 });
  }

  if (!draftJob) {
    return NextResponse.json({ error: "Draft job not found for this company" }, { status: 404 });
  }

  const oldValue =
    fieldName === "collection_date"
      ? (draftJob.requested_collection_date as string | null)
      : fieldName === "collection_time"
        ? (draftJob.requested_collection_time as string | null)
        : fieldName === "delivery_date"
          ? (draftJob.requested_delivery_date as string | null)
          : (draftJob.requested_delivery_time as string | null);

  const overrideColumn = fieldToDraftJobColumn[fieldName];

  const { error: updateError } = await privilegedClient
    .from("draft_jobs")
    .update({ [overrideColumn]: newValue || null })
    .eq("id", draftJob.id)
    .eq("company_id", profile.company_id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  const { error: auditError } = await privilegedClient
    .from("draft_job_schedule_overrides")
    .insert({
      draft_job_id: draftJob.id,
      field_name: fieldName,
      old_value: oldValue,
      new_value: newValue || null,
      reason,
      actor_user_id: user.id,
      actor_email: user.email ?? null,
    });

  if (auditError) {
    return NextResponse.json({ error: auditError.message }, { status: 500 });
  }

  await privilegedClient.from("operations_notifications").insert({
    draft_job_id: draftJob.id,
    category: "schedule_override",
    title: "Merchant schedule override",
    body: `${fieldName} changed from ${oldValue ?? "(empty)"} to ${newValue || "(empty)"}. Reason: ${reason}`,
    created_by_user_id: user.id,
  });

  return NextResponse.json({
    success: true,
    draft_job_id: draftJob.id,
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
    reason,
    user: user.email ?? user.id,
    date: new Date().toISOString(),
  });
}
