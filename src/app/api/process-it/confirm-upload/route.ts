import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ConfirmUploadRequest = {
  draftJobId?: string;
  documentId?: string;
  trackPodMapping?: Record<string, string | null> | null;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function clean(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function generateRef(id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = id.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${date}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = parseBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();
    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = (await request.json()) as ConfirmUploadRequest;
    if (!body.draftJobId) {
      return NextResponse.json({ error: "Missing draft job ID" }, { status: 400 });
    }
    if (!body.documentId) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const mapping = body.trackPodMapping;
    if (!mapping) {
      return NextResponse.json({ error: "Missing Track-POD mapping payload" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("id, company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company is linked to this user" }, { status: 403 });
    }

    const { data: draftJob, error: draftJobError } = await privilegedClient
      .from("draft_jobs")
      .select("id, company_id, job_reference, primary_document_id, integration_metadata")
      .eq("id", body.draftJobId)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (draftJobError) {
      return NextResponse.json({ error: draftJobError.message }, { status: 500 });
    }
    if (!draftJob) {
      return NextResponse.json({ error: "Draft job not found for this company" }, { status: 404 });
    }

    if ((draftJob.primary_document_id as string | null) !== body.documentId) {
      return NextResponse.json(
        { error: "Draft job is not linked to the current uploaded document" },
        { status: 409 }
      );
    }

    const existingMeta =
      draftJob.integration_metadata && typeof draftJob.integration_metadata === "object"
        ? (draftJob.integration_metadata as Record<string, unknown>)
        : {};

    const existingTrackPodMapping =
      existingMeta.trackPodMapping && typeof existingMeta.trackPodMapping === "object"
        ? (existingMeta.trackPodMapping as Record<string, string | null>)
        : {};

    const mergedTrackPodMapping: Record<string, string | null> = {
      ...existingTrackPodMapping,
      ...mapping,
    };

    const jobReference =
      clean(mapping.order_reference) ||
      clean(draftJob.job_reference as string | null) ||
      generateRef(draftJob.id as string);

    const now = new Date().toISOString();
    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        status: "job_created",
        lifecycle_status: "READY_FOR_TRACKPOD",
        current_status: "READY_FOR_TRACKPOD",
        job_reference: jobReference,
        integration_metadata: {
          ...existingMeta,
          trackPodMapping: mergedTrackPodMapping,
          updatedAt: now,
        },
        last_sync: now,
      })
      .eq("id", draftJob.id)
      .eq("company_id", profile.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      jobId: draftJob.id,
      jobReference,
      lifecycleStatus: "READY_FOR_TRACKPOD",
      currentStatus: "READY_FOR_TRACKPOD",
      primaryDocumentId: draftJob.primary_document_id ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to prepare job for Process It" },
      { status: 500 }
    );
  }
}
