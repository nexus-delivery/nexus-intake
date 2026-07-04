import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { notifyOrderCreated } from "@/lib/notify/orderCreated";
import { evaluateFutureDeliveryHold } from "@/lib/orderLifecycle";

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

export type CreateJobBody = {
  // Core reference
  orderReference?: string;
  // Collection
  collectionName: string;
  collectionAddress: string;
  collectionPhone?: string;
  collectionEmail?: string;
  // Delivery
  deliveryName: string;
  deliveryAddress: string;
  deliveryPhone?: string;
  deliveryEmail?: string;
  // Order
  goodsDescription?: string;
  shipperName?: string;
  deliveryDate?: string;
  collectionDate?: string;
  merchantName?: string;
  notes?: string;
  trackpodPhotoNote?: string;
  customer_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const token = parseBearerToken(request);
    if (!token) {
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
    } = await authClient.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }

    const body = (await request.json()) as CreateJobBody & { company_id?: string };

    // In development, allow company_id to be passed directly in request body for testing
    let companyId = body.company_id;
    if (!companyId) {
      const { data: profile, error: profileError } = await privilegedClient
        .from("profiles")
        .select("id, company_id")
        .eq("auth_user_id", user.id)
        .maybeSingle();
      if (profileError || !profile?.company_id) {
        return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
      }
      companyId = profile.company_id;
    }

    const resolvedCompanyId = (companyId ?? "").trim();
    if (!resolvedCompanyId) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    if (!body.collectionName?.trim()) {
      return NextResponse.json({ error: "Collection Name is required" }, { status: 400 });
    }
    if (!body.collectionAddress?.trim()) {
      return NextResponse.json({ error: "Collection Address is required" }, { status: 400 });
    }
    if (!body.deliveryName?.trim()) {
      return NextResponse.json({ error: "Delivery Name is required" }, { status: 400 });
    }
    if (!body.deliveryAddress?.trim()) {
      return NextResponse.json({ error: "Delivery Address is required" }, { status: 400 });
    }

    const holdEvaluation = evaluateFutureDeliveryHold(body.deliveryDate ?? "");
    const initialLifecycle = holdEvaluation.shouldHoldDelivery ? "HELD_FUTURE_DATE" : "READY_FOR_TRACKPOD";

    // Create the draft_jobs record
    const { data: newJob, error: insertError } = await privilegedClient
      .from("draft_jobs")
      .insert({
        company_id: resolvedCompanyId,
        created_by_user_id: user.id,
        customer_id: body.customer_id?.trim() || null,
        customer_email: body.deliveryEmail?.trim() || null,
        status: "job_created",
        lifecycle_status: initialLifecycle,
      })
      .select("id")
      .single();

    if (insertError || !newJob) {
      return NextResponse.json({ error: insertError?.message ?? "Insert failed" }, { status: 500 });
    }

    const jobId = (newJob as { id: string }).id;
    const jobReference = body.orderReference?.trim() || generateRef(jobId);

    // Store job reference
    await privilegedClient
      .from("draft_jobs")
      .update({ job_reference: jobReference })
      .eq("id", jobId);

    // Store all field data in document_extracted_fields style via integration_metadata
    // (No document uploaded — fields stored directly in integration_metadata)
    const fields: Record<string, string> = {
      order_reference: jobReference,
      collection_name: body.collectionName.trim(),
      collection_address: body.collectionAddress.trim(),
      collection_phone: body.collectionPhone?.trim() ?? "",
      collection_email: body.collectionEmail?.trim() ?? "",
      colllection_email: body.collectionEmail?.trim() ?? "", // triple-l per blueprint
      delivery_name: body.deliveryName.trim(),
      delivery_address: body.deliveryAddress.trim(),
      delivery_phone: body.deliveryPhone?.trim() ?? "",
      delivery_email: body.deliveryEmail?.trim() ?? "",
      goods_description: body.goodsDescription?.trim() ?? "General goods",
      trackpod_goods: body.goodsDescription?.trim() ?? "General goods",
      merchant_shipper: body.shipperName?.trim() ?? body.collectionName.trim(),
      shipper_name: body.shipperName?.trim() ?? body.collectionName.trim(),
      merchant_name: body.merchantName?.trim() ?? "",
      delivery_date: body.deliveryDate?.trim() ?? "",
      collection_date: body.collectionDate?.trim() ?? "",
      notes: body.notes?.trim() ?? "",
      trackpod_photo_note: body.trackpodPhotoNote?.trim() ?? "",
      source_system: "Manual",
    };

    await privilegedClient
      .from("draft_jobs")
      .update({
        integration_metadata: {
          trackPodMapping: fields,
          releasePolicy: {
            status: holdEvaluation.shouldHoldDelivery ? "held_future_date" : "ready",
            requestedDeliveryDate: body.deliveryDate?.trim() || null,
            workingDaysUntilDelivery: holdEvaluation.workingDaysUntilDelivery,
            autoReleaseDate: holdEvaluation.autoReleaseDate ? holdEvaluation.autoReleaseDate.toISOString().slice(0, 10) : null,
          },
          lifecycle: {
            collectionReleasedAt: null,
            collectionConfirmedAt: null,
            deliveryReleasedAt: null,
            adminOverrideUsed: false,
          },
        },
      })
      .eq("id", jobId);

    await notifyOrderCreated({
      client: privilegedClient,
      draftJobId: jobId,
      companyId: resolvedCompanyId,
      orderReference: jobReference,
      customerName: body.deliveryName?.trim() || body.merchantName?.trim() || null,
      customerEmail: body.deliveryEmail?.trim() || body.collectionEmail?.trim() || null,
      customerPhone: body.deliveryPhone?.trim() || body.collectionPhone?.trim() || null,
    });

    return NextResponse.json({
      success: true,
      jobId,
      jobReference,
      lifecycleStatus: initialLifecycle,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
