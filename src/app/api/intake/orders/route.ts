import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sanitizeStandardOrder,
  toTrackPodMapping,
  type StandardOrder,
} from "@/lib/intake/standardOrder";

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

function parseBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

function generateRef(id: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = id.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${date}-${suffix}`;
}

function validate(order: StandardOrder): string | null {
  if (!order.collection.company.trim()) return "Collection company is required";
  if (!order.collection.addressLine1.trim()) return "Collection address line 1 is required";
  if (!order.delivery.company.trim()) return "Delivery company is required";
  if (!order.delivery.addressLine1.trim()) return "Delivery address line 1 is required";
  if (!order.goods.some((item) => item.description.trim().length > 0)) {
    return "At least one goods description is required";
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      order?: unknown;
      company_id?: string;
    };
    const order = sanitizeStandardOrder(body.order);
    const validationError = validate(order);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();
    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    let companyId = body.company_id?.trim() || "";
    let userId: string | null = null;
    const token = parseBearerToken(request);

    if (token) {
      const {
        data: { user },
      } = await authClient.auth.getUser(token);
      userId = user?.id ?? null;

      if (userId && !companyId) {
        const { data: profile } = await privilegedClient
          .from("profiles")
          .select("company_id")
          .eq("auth_user_id", userId)
          .maybeSingle();

        companyId = profile?.company_id ?? "";
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company linked to this intake request" },
        { status: 403 }
      );
    }

    const { data: inserted, error: insertError } = await privilegedClient
      .from("draft_jobs")
      .insert({
        company_id: companyId,
        created_by_user_id: userId,
        status: "job_created",
        lifecycle_status: order.operations.readyForTrackPod
          ? "READY_FOR_TRACKPOD"
          : "REVIEW_REQUIRED",
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      return NextResponse.json(
        { error: insertError?.message ?? "Failed to create job" },
        { status: 500 }
      );
    }

    const jobId = inserted.id as string;
    const jobReference = order.orderReference.trim() || generateRef(jobId);
    const mapping = toTrackPodMapping({ ...order, orderReference: jobReference });

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        job_reference: jobReference,
        integration_metadata: {
          source: "nexus_intake_v1",
          standardOrder: { ...order, orderReference: jobReference },
          trackPodMapping: mapping,
        },
      })
      .eq("id", jobId);

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message ?? "Failed to update job metadata" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      jobId,
      jobReference,
      lifecycleStatus: order.operations.readyForTrackPod
        ? "READY_FOR_TRACKPOD"
        : "REVIEW_REQUIRED",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
