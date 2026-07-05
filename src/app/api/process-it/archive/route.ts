import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const { draftJobId } = (await request.json().catch(() => ({}))) as {
      draftJobId?: string;
    };

    if (!draftJobId?.trim()) {
      return NextResponse.json({ error: "draftJobId is required" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    const { data: job, error: jobError } = await privilegedClient
      .from("draft_jobs")
      .select("id, integration_metadata")
      .eq("id", draftJobId)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const metadata =
      job.integration_metadata && typeof job.integration_metadata === "object"
        ? (job.integration_metadata as Record<string, unknown>)
        : {};

    const nowIso = new Date().toISOString();
    const nextMetadata: Record<string, unknown> = {
      ...metadata,
      archivedAt: nowIso,
      archivedBy: user.id,
    };

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        lifecycle_status: "ARCHIVED",
        current_status: "ARCHIVED",
        integration_metadata: nextMetadata,
      })
      .eq("id", draftJobId)
      .eq("company_id", profile.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      draftJobId,
      lifecycleStatus: "ARCHIVED",
      archivedAt: nowIso,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
