import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ConfirmUploadRequest = {
  draftJobId?: string;
  documentId?: string;
  trackPodMapping?: Record<string, string | null> | null;
  readyForTrackPod?: boolean;
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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function preferIncoming(
  incoming: Record<string, string | null>,
  existing: Record<string, string | null>,
  key: string
): string | null {
  const incomingValue = clean(incoming[key]);
  if (incomingValue) return incomingValue;
  const existingValue = clean(existing[key]);
  return existingValue || null;
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

    const existingMeta = asRecord(draftJob.integration_metadata);
    const releaseApproved = body.readyForTrackPod !== false;
    const nextLifecycleStatus = releaseApproved ? "READY_FOR_TRACKPOD" : "REVIEW_REQUIRED";
    const existingTrackPodMapping = asRecord(existingMeta.trackPodMapping) as Record<string, string | null>;

    const existingCollectionMode =
      typeof existingMeta.collectionMode === "string" ? existingMeta.collectionMode : null;

    const resolvedCollectionMode =
      clean(existingCollectionMode) ||
      clean(mapping.collection_mode) ||
      clean(existingTrackPodMapping.collection_mode) ||
      "new_address";

    const mergedMapping: Record<string, string | null> = {
      ...existingTrackPodMapping,
      ...mapping,
      collection_mode: resolvedCollectionMode,
    };

    if (resolvedCollectionMode === "depot") {
      const protectedCollectionKeys = [
        "collection_name",
        "merchant_shipper",
        "shipper_name",
        "collection_address",
        "collection_phone",
        "collection_email",
        "colllection_email",
        "collection_date",
        "collection_time",
        "collection_instructions",
        "collection_latitude",
        "collection_longitude",
      ];

      for (const key of protectedCollectionKeys) {
        const existingValue = clean(existingTrackPodMapping[key]);
        if (existingValue) {
          mergedMapping[key] = existingValue;
        }
      }
    }

    const jobReference =
      clean(mergedMapping.order_reference) ||
      clean(draftJob.job_reference as string | null) ||
      generateRef(draftJob.id as string);

    const now = new Date().toISOString();
    console.info("[confirm-upload] saving-trackpod-mapping", {
      draft_job_id: draftJob.id,
      document_id: body.documentId,
      mapped_fields: mapping,
    });

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        status: "job_created",
        lifecycle_status: nextLifecycleStatus,
        current_status: nextLifecycleStatus,
        job_reference: jobReference,
        collection_company: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_name"),
        collection_address_line1: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_address"),
        collection_phone: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_phone"),
        collection_email: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_email"),
        collection_instructions: preferIncoming(
          mergedMapping,
          existingTrackPodMapping,
          "collection_instructions"
        ),
        delivery_company: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_name"),
        delivery_address_line1: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_address"),
        delivery_phone: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_phone"),
        delivery_email: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_email"),
        delivery_instructions: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_notes"),
        requested_collection_date: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_date"),
        requested_collection_time: preferIncoming(mergedMapping, existingTrackPodMapping, "collection_time"),
        requested_delivery_date: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_date"),
        requested_delivery_time: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_time"),
        goods_description: preferIncoming(mergedMapping, existingTrackPodMapping, "goods_description"),
        external_order_id: preferIncoming(mergedMapping, existingTrackPodMapping, "external_order_id"),
        notes: preferIncoming(mergedMapping, existingTrackPodMapping, "delivery_notes"),
        integration_metadata: {
          ...existingMeta,
          collectionMode: resolvedCollectionMode,
          readyForTrackPod: releaseApproved,
          trackPodMapping: mergedMapping,
          updatedAt: now,
        },
        last_sync: now,
      })
      .eq("id", draftJob.id)
      .eq("company_id", profile.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    console.info("[confirm-upload] saved-trackpod-mapping", {
      draft_job_id: draftJob.id,
      document_id: body.documentId,
      saved_fields: mergedMapping,
    });

    return NextResponse.json({
      success: true,
      jobId: draftJob.id,
      jobReference,
      lifecycleStatus: nextLifecycleStatus,
      currentStatus: nextLifecycleStatus,
      primaryDocumentId: draftJob.primary_document_id ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to prepare job for Process It" },
      { status: 500 }
    );
  }
}
