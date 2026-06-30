import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Production Track-POD API endpoint and auth — as per reference/trackpod/PROCESS-IT.md
const TRACKPOD_API_URL = "https://api.track-pod.com/Order";
const TRACKPOD_API_KEY =
  process.env.TRACKPOD_API_KEY ??
  process.env.TRACKPOD_API_TOKEN ??
  "";

// Rate limit: 20 req/sec, 429 = retry after 60s (handled by client retry logic)
const TRACKPOD_REQUEST_TIMEOUT_MS = 15_000;

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

function clean(v: string | null | undefined): string {
  return (v ?? "").trim();
}

function ifempty(a: string, b: string): string {
  return a || b;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Normalise to YYYY-MM-DD
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
}

// ─── Production payload builders ──────────────────────────────────────────────
// Field names and fallback chains exactly as documented in
// reference/trackpod/PROCESS-IT.md and reference/trackpod/TRACKPOD-API-MAPPINGS.md

function buildDeliveryPayload(
  fields: Record<string, string>,
  orderRef: string,
  sourceSystem: "Wodely" | "WooCommerce"
): Record<string, unknown> {
  const deliveryName = clean(
    ifempty(fields.delivery_name ?? fields.customer ?? "", fields.collection_name ?? "")
  );
  const collectionName = clean(
    ifempty(fields.collection_name ?? "", fields.merchant_shipper ?? "")
  );
  const deliveryDate = formatDate(fields.delivery_date ?? fields.collection_date ?? "");
  const goodsNote = ""; // delivery orders always get empty Note per blueprint

  const payload: Record<string, unknown> = {
    Number: orderRef,
    Id: orderRef,
    Type: 0, // Delivery
    Client: ifempty(deliveryName, collectionName),
    ContactName:
      sourceSystem === "WooCommerce"
        ? collectionName // THDG cross-maps ContactName = Collection Name
        : ifempty(deliveryName, collectionName),
    Address: clean(fields.delivery_address ?? ""),
    Phone: clean(fields.delivery_phone ?? fields.telephone ?? fields.phone ?? ""),
    Shipper: clean(ifempty(fields.merchant_shipper ?? "", fields.collection_name ?? "")),
    GoodsList: [
      {
        GoodsName: clean(fields.goods_description ?? fields.trackpod_goods ?? "Delivery"),
        GoodsUnit: "pcs",
        Quantity: 1,
        Note: goodsNote,
      },
    ],
  };

  // Email: Wodely uses delivery_email only; WooCommerce concatenates both
  if (sourceSystem === "WooCommerce") {
    const collEmail = clean(fields.collection_email ?? fields.email ?? "");
    const delEmail = clean(fields.delivery_email ?? fields.email ?? "");
    const combinedEmail = [collEmail, delEmail].filter(Boolean).join(", ");
    if (combinedEmail) payload.Email = combinedEmail;
  } else {
    const delEmail = clean(fields.delivery_email ?? fields.email ?? "");
    if (delEmail) payload.Email = delEmail;
  }

  // Date: Wodely only — use requested delivery date, fall back to collection date
  if (sourceSystem === "Wodely" && deliveryDate) {
    payload.Date = deliveryDate;
  }

  return payload;
}

function buildCollectionPayload(
  fields: Record<string, string>,
  orderRef: string,
  sourceSystem: "Wodely" | "WooCommerce"
): Record<string, unknown> {
  const collectionName = clean(
    ifempty(fields.collection_name ?? "", fields.merchant_shipper ?? "")
  );

  // Note: production Airtable field name is "Colllection Email" (triple-l)
  // We normalise it from whichever variant is present in extracted fields
  const collectionEmail = clean(
    fields.colllection_email ??
      fields.collection_email ??
      fields.email ??
      ""
  );

  const goodsNote =
    sourceSystem === "Wodely"
      ? clean(fields.trackpod_photo_note ?? fields.notes ?? "")
      : ""; // WooCommerce/THDG always uses empty Note for collection

  return {
    Number: orderRef,
    Id: orderRef,
    Type: 1, // Collection / Pickup
    Client: collectionName,
    ContactName: collectionName,
    Address: clean(fields.collection_address ?? ""),
    Phone: clean(fields.collection_phone ?? fields.telephone ?? fields.phone ?? ""),
    Email: collectionEmail,
    Shipper: clean(ifempty(fields.merchant_shipper ?? "", fields.collection_name ?? "")),
    GoodsList: [
      {
        GoodsName: clean(fields.goods_description ?? fields.trackpod_goods ?? "Collection"),
        GoodsUnit: "pcs",
        Quantity: 1,
        Note: goodsNote,
      },
    ],
  };
}

// ─── Track-POD API call ───────────────────────────────────────────────────────

type TrackPodResult = {
  locationHeader: string;
  orderId: string;
  trackLink: string | null;
  trackKey: string | null;
  trackId: string | null;
  rawResponse: unknown;
  httpStatus: number;
};

async function callTrackPod(
  payload: Record<string, unknown>
): Promise<TrackPodResult> {
  if (!TRACKPOD_API_KEY) {
    throw new Error("TRACKPOD_API_KEY environment variable is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRACKPOD_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(TRACKPOD_API_URL, {
      method: "POST",
      headers: {
        "X-API-KEY": TRACKPOD_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  // Parse body regardless of status (needed for error messages)
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail = JSON.stringify(body);
    throw Object.assign(
      new Error(`Track-POD API error ${response.status}: ${detail}`),
      { httpStatus: response.status, body }
    );
  }

  // Production response: 201 Created, Location header = /Order/Number/{ref}
  const locationHeader = response.headers.get("location") ?? "";

  // ── Fetch the created order to retrieve TrackLink, TrackKey, TrackId ──────
  // The POST body only returns {"Status":201,...}; tracking URLs require a GET.
  let trackLink: string | null = null;
  let trackKey: string | null = null;
  let trackId: string | null = null;

  if (locationHeader) {
    try {
      const getController = new AbortController();
      const getTimer = setTimeout(() => getController.abort(), 10_000);
      let getResp: Response;
      try {
        getResp = await fetch(`https://api.track-pod.com${locationHeader}`, {
          headers: {
            "X-API-KEY": TRACKPOD_API_KEY,
            Accept: "application/json",
          },
          signal: getController.signal,
        });
      } finally {
        clearTimeout(getTimer);
      }
      if (getResp.ok) {
        const orderData = (await getResp.json()) as Record<string, unknown>;
        trackLink = typeof orderData.TrackLink === "string" ? orderData.TrackLink : null;
        trackKey = typeof orderData.TrackKey === "string" ? orderData.TrackKey : null;
        trackId = typeof orderData.TrackId === "string" ? orderData.TrackId : null;
      }
    } catch {
      // Non-fatal — tracking URL can be fetched later by a background job
    }
  }

  return {
    locationHeader,
    orderId: locationHeader || (payload.Number as string) || "",
    trackLink,
    trackKey,
    trackId,
    rawResponse: body,
    httpStatus: response.status,
  };
}

// ─── POST /api/process-it/send ────────────────────────────────────────────────

type SendRequest = {
  draftJobId: string;
  /** Override source system detection (defaults to "Wodely") */
  sourceSystem?: "Wodely" | "WooCommerce";
  /** Skip if already sent (default true) */
  checkDuplicate?: boolean;
};

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

    const body = (await request.json()) as SendRequest;
    if (!body.draftJobId) {
      return NextResponse.json({ error: "draftJobId is required" }, { status: 400 });
    }

    const { data: profile, error: profileError } = await privilegedClient
      .from("profiles")
      .select("id, company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError || !profile?.company_id) {
      return NextResponse.json({ error: "No company linked to user" }, { status: 403 });
    }

    // ── Fetch the draft job ─────────────────────────────────────────────────
    const { data: job, error: jobError } = await privilegedClient
      .from("draft_jobs")
      .select(
        "id, company_id, status, lifecycle_status, job_reference, primary_document_id, " +
          "trackpod_delivery_order_id, trackpod_collection_order_id, " +
          "integration_metadata"
      )
      .eq("id", body.draftJobId)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const jobRecord = job as unknown as Record<string, unknown>;

    // ── Duplicate prevention ────────────────────────────────────────────────
    const checkDuplicate = body.checkDuplicate !== false;
    if (checkDuplicate) {
      const hasDelivery = Boolean(jobRecord.trackpod_delivery_order_id);
      const hasCollection = Boolean(jobRecord.trackpod_collection_order_id);
      if (hasDelivery && hasCollection) {
        return NextResponse.json(
          {
            error: "Both Track-POD orders already exist for this job",
            trackpodDeliveryOrderId: jobRecord.trackpod_delivery_order_id,
            trackpodCollectionOrderId: jobRecord.trackpod_collection_order_id,
          },
          { status: 409 }
        );
      }
    }

    // ── Load extracted fields ───────────────────────────────────────────────
    const fields: Record<string, string> = {};
    const docId = jobRecord.primary_document_id as string | null;

    if (docId) {
      const { data: extracted } = await privilegedClient
        .from("document_extracted_fields")
        .select("field_name, field_value")
        .eq("document_id", docId)
        .eq("company_id", profile.company_id);

      if (extracted) {
        for (const row of extracted as Array<{
          field_name: string;
          field_value: string | null;
        }>) {
          if (row.field_value != null) {
            fields[row.field_name] = row.field_value;
          }
        }
      }
    }

    // Also merge from integration_metadata if it has a trackPodMapping
    if (jobRecord.integration_metadata && typeof jobRecord.integration_metadata === "object") {
      const meta = jobRecord.integration_metadata as Record<string, unknown>;
      if (meta.trackPodMapping && typeof meta.trackPodMapping === "object") {
        for (const [k, v] of Object.entries(
          meta.trackPodMapping as Record<string, string | null>
        )) {
          if (v != null && !fields[k]) fields[k] = v;
        }
      }
    }

    // Determine order reference
    const orderRef =
      clean(jobRecord.job_reference as string | null) ||
      clean(fields.order_reference) ||
      (jobRecord.id as string);

    // Determine source system
    const sourceSystem: "Wodely" | "WooCommerce" =
      body.sourceSystem ??
      (clean(fields.source_system).toLowerCase().includes("woocommerce")
        ? "WooCommerce"
        : "Wodely");

    // ── Mark attempt start ──────────────────────────────────────────────────
    await privilegedClient
      .from("draft_jobs")
      .update({
        trackpod_push_attempted_at: new Date().toISOString(),
        lifecycle_status: "READY_FOR_TRACKPOD",
        trackpod_error_detail: null,
        trackpod_error_at: null,
      })
      .eq("id", jobRecord.id)
      .eq("company_id", profile.company_id);

    // ── Create Delivery order (Type 0) ──────────────────────────────────────
    const deliveryPayload = buildDeliveryPayload(fields, orderRef, sourceSystem);

    let deliveryResult: TrackPodResult;
    try {
      deliveryResult = await callTrackPod(deliveryPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const httpStatus =
        (err as { httpStatus?: number }).httpStatus ?? 500;
      const errBody = (err as { body?: unknown }).body ?? null;

      await privilegedClient
        .from("draft_jobs")
        .update({
          lifecycle_status: "TRACKPOD_ERROR",
          trackpod_error_detail: {
            step: "delivery_order",
            message: errMsg,
            httpStatus,
            body: errBody,
            payload: deliveryPayload,
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", jobRecord.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        { error: `Delivery order failed: ${errMsg}`, httpStatus },
        { status: 502 }
      );
    }

    // Store delivery ID immediately
    await privilegedClient
      .from("draft_jobs")
      .update({ trackpod_delivery_order_id: deliveryResult.locationHeader })
      .eq("id", jobRecord.id)
      .eq("company_id", profile.company_id);

    // ── Create Collection order (Type 1) ────────────────────────────────────
    const collectionPayload = buildCollectionPayload(fields, orderRef, sourceSystem);

    let collectionResult: TrackPodResult;
    try {
      collectionResult = await callTrackPod(collectionPayload);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      const httpStatus =
        (err as { httpStatus?: number }).httpStatus ?? 500;
      const errBody = (err as { body?: unknown }).body ?? null;

      await privilegedClient
        .from("draft_jobs")
        .update({
          lifecycle_status: "TRACKPOD_ERROR",
          trackpod_error_detail: {
            step: "collection_order",
            message: errMsg,
            httpStatus,
            body: errBody,
            payload: collectionPayload,
            deliveryOrderAlreadyCreated: deliveryResult.locationHeader,
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", jobRecord.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        {
          error: `Collection order failed (delivery order was created): ${errMsg}`,
          httpStatus,
          partialSuccess: {
            trackpodDeliveryOrderId: deliveryResult.locationHeader,
          },
        },
        { status: 502 }
      );
    }

    // ── Atomic final update: both IDs, status → READY_FOR_ROUTE ─────────────
    const now = new Date().toISOString();
    const { error: finalUpdateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        trackpod_delivery_order_id: deliveryResult.locationHeader,
        trackpod_collection_order_id: collectionResult.locationHeader,
        trackpod_delivery_tracking_url: deliveryResult.trackLink ?? "",
        trackpod_collection_tracking_url: collectionResult.trackLink ?? "",
        lifecycle_status: "READY_FOR_ROUTE",
        trackpod_push_completed_at: now,
        trackpod_error_detail: null,
        trackpod_error_at: null,
        last_sync: now,
        current_status: "READY_FOR_ROUTE",
        last_api_response: {
          delivery: {
            locationHeader: deliveryResult.locationHeader,
            trackLink: deliveryResult.trackLink,
            trackKey: deliveryResult.trackKey,
            trackId: deliveryResult.trackId,
            raw: deliveryResult.rawResponse,
          },
          collection: {
            locationHeader: collectionResult.locationHeader,
            trackLink: collectionResult.trackLink,
            trackKey: collectionResult.trackKey,
            trackId: collectionResult.trackId,
            raw: collectionResult.rawResponse,
          },
        },
      })
      .eq("id", jobRecord.id)
      .eq("company_id", profile.company_id);

    if (finalUpdateError) {
      return NextResponse.json({ error: finalUpdateError.message }, { status: 500 });
    }

    // ── Timeline entry ──────────────────────────────────────────────────────
    if (docId) {
      await privilegedClient.from("document_timeline").insert({
        document_id: docId,
        company_id: profile.company_id,
        event: "trackpod_orders_created",
        actor: user.email ?? user.id,
        actor_profile_id: profile.id,
        metadata: {
          deliveryOrderId: deliveryResult.locationHeader,
          collectionOrderId: collectionResult.locationHeader,
          deliveryTrackLink: deliveryResult.trackLink,
          collectionTrackLink: collectionResult.trackLink,
          orderRef,
          sourceSystem,
        },
      });
    }

    return NextResponse.json({
      success: true,
      jobId: jobRecord.id,
      orderRef,
      trackpodDeliveryOrderId: deliveryResult.locationHeader,
      trackpodCollectionOrderId: collectionResult.locationHeader,
      trackpodDeliveryTrackingUrl: deliveryResult.trackLink ?? null,
      trackpodCollectionTrackingUrl: collectionResult.trackLink ?? null,
      trackpodDeliveryTrackKey: deliveryResult.trackKey ?? null,
      trackpodCollectionTrackKey: collectionResult.trackKey ?? null,
      lifecycleStatus: "READY_FOR_ROUTE",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
