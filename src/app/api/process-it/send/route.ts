import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { buildTrackPodOrderReference } from "@/lib/trackpodReference";

// Production Track-POD API endpoint and auth — as per reference/trackpod/PROCESS-IT.md
const TRACKPOD_API_BASE_URL =
  process.env.TRACKPOD_API_BASE_URL ?? "https://api.track-pod.com/Order";
const TRACKPOD_API_KEY = process.env.TRACKPOD_API_KEY ?? "";

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

function firstNonBlank(fields: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const value = clean(fields[key]);
    if (value) return value;
  }
  return "";
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  // Normalise to YYYY-MM-DD
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toISOString().slice(0, 10);
}

function isTestOrderReference(ref: string): boolean {
  return /^(TEST-|NEX-TEST-)/i.test(ref.trim());
}

function toBoolString(value: string | null | undefined): boolean {
  const normalized = clean(value).toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

function buildServiceTags(fields: Record<string, string>): string[] {
  const tags: string[] = [];
  if (toBoolString(fields.two_man)) tags.push("2 MAN");
  if (toBoolString(fields.northern_ireland_delivery)) tags.push("NI");
  if (toBoolString(fields.tail_lift_required)) tags.push("TAIL LIFT");
  if (toBoolString(fields.dedicated_vehicle)) tags.push("DEDICATED VEHICLE");
  return tags;
}

// ─── Production payload builders ──────────────────────────────────────────────
// Field names and fallback chains exactly as documented in
// reference/trackpod/PROCESS-IT.md and reference/trackpod/TRACKPOD-API-MAPPINGS.md

function buildDeliveryPayload(
  fields: Record<string, string>,
  orderRef: string
): Record<string, unknown> {
  const tags = buildServiceTags(fields);
  const refWithTags = buildTrackPodOrderReference({
    orderReference: orderRef,
    externalOrderId: fields.external_order_id,
    twoMan: fields.two_man,
  });
  const deliveryName = firstNonBlank(fields, ["delivery_name", "Delivery Name"]);
  const collectionName = firstNonBlank(fields, ["collection_name", "Collection Name"]);
  const shipperName = firstNonBlank(fields, ["shipper_name", "Shipper Name", "merchant_shipper"]);
  const deliveryAddress = firstNonBlank(fields, ["delivery_address", "Delivery Address"]);
  const deliveryPhone = firstNonBlank(fields, ["delivery_phone", "Delivery Phone"]);
  const deliveryEmail = firstNonBlank(fields, ["delivery_email", "Delivery Email"]);

  const requestedDeliveryDate = firstNonBlank(fields, [
    "requested_delivery_date",
    "Requested Delivery Date",
    "delivery_date",
  ]);
  const expectedCollectionDate = firstNonBlank(fields, [
    "expected_collection_date",
    "Expected Collection Date",
    "collection_date",
  ]);

  const goodsName = firstNonBlank(fields, [
    "trackpod_goods",
    "TrackPOD Goods",
    "goods_description",
    "Goods Description",
  ]);

  const baseNote = firstNonBlank(fields, ["delivery_notes", "Notes", "notes"]);
  const taggedNote = [tags.length ? `Service Flags: ${tags.join(" | ")}` : "", baseNote]
    .filter(Boolean)
    .join("\n\n");

  return {
    Number: refWithTags,
    Id: refWithTags,
    Type: 0, // Delivery
    Date: formatDate(ifempty(requestedDeliveryDate, expectedCollectionDate)),
    Client: ifempty(deliveryName, collectionName),
    ContactName: ifempty(deliveryName, collectionName),
    Address: deliveryAddress,
    Phone: deliveryPhone,
    Email: deliveryEmail,
    Shipper: shipperName,
    GoodsList: [
      {
        GoodsName: goodsName || "Delivery",
        GoodsUnit: "pcs",
        Quantity: 1,
        Note: taggedNote,
      },
    ],
  };
}

function buildCollectionPayload(
  fields: Record<string, string>,
  orderRef: string
): Record<string, unknown> {
  const tags = buildServiceTags(fields);
  const refWithTags = buildTrackPodOrderReference({
    orderReference: orderRef,
    externalOrderId: fields.external_order_id,
    twoMan: fields.two_man,
  });
  const collectionName = firstNonBlank(fields, ["collection_name", "Collection Name"]);
  const shipperName = firstNonBlank(fields, ["shipper_name", "Shipper Name", "merchant_shipper"]);
  const collectionAddress = firstNonBlank(fields, ["collection_address", "Collection Address"]);
  const collectionPhone = firstNonBlank(fields, ["collection_phone", "Collection Phone"]);
  const collectionEmail = firstNonBlank(fields, [
    "colllection_email",
    "Colllection Email",
    "collection_email",
  ]);
  const goodsName = firstNonBlank(fields, [
    "trackpod_goods",
    "TrackPOD Goods",
    "goods_description",
    "Goods Description",
  ]);
  const goodsNote = firstNonBlank(fields, [
    "trackpod_photo_note",
    "TRACKPOD PHOTO & NOTE",
  ]);

  const taggedNote = [tags.length ? `Service Flags: ${tags.join(" | ")}` : "", goodsNote]
    .filter(Boolean)
    .join("\n\n");

  return {
    Number: refWithTags,
    Id: refWithTags,
    Type: 1, // Collection / Pickup
    Client: ifempty(collectionName, shipperName),
    ContactName: ifempty(collectionName, shipperName),
    Address: collectionAddress,
    Phone: collectionPhone,
    Email: collectionEmail,
    Shipper: shipperName,
    GoodsList: [
      {
        GoodsName: goodsName || "Collection",
        GoodsUnit: "pcs",
        Quantity: 1,
        Note: taggedNote,
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
  console.info("[process-it/send] Track-POD config", {
    keyExists: Boolean(TRACKPOD_API_KEY),
    keyLength: TRACKPOD_API_KEY.length,
    baseUrl: TRACKPOD_API_BASE_URL,
  });

  if (!TRACKPOD_API_KEY) {
    throw new Error("TRACKPOD_API_KEY environment variable is not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TRACKPOD_REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(TRACKPOD_API_BASE_URL, {
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
          if (v != null && !clean(fields[k])) fields[k] = v;
        }
      }
    }

    // Determine order reference
    const orderRef =
      clean(jobRecord.job_reference as string | null) ||
      clean(fields.order_reference) ||
      (jobRecord.id as string);

    if (
      isTestOrderReference(orderRef) &&
      process.env.TRACKPOD_ALLOW_TEST_ORDERS !== "true"
    ) {
      return NextResponse.json(
        {
          error:
            "Track-POD test order creation is blocked. Set TRACKPOD_ALLOW_TEST_ORDERS=true only for explicitly approved test runs.",
        },
        { status: 403 }
      );
    }

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

    // ── Create Collection order (Type 1) first ─────────────────────────────
    const collectionPayload = buildCollectionPayload(fields, orderRef);

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
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", jobRecord.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        { error: `Collection order failed: ${errMsg}`, httpStatus },
        { status: 502 }
      );
    }

    // Store collection ID immediately
    await privilegedClient
      .from("draft_jobs")
      .update({ trackpod_collection_order_id: collectionResult.locationHeader })
      .eq("id", jobRecord.id)
      .eq("company_id", profile.company_id);

    // ── Create Delivery order (Type 0) after collection ─────────────────────
    const deliveryPayload = buildDeliveryPayload(fields, orderRef);

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
            collectionOrderAlreadyCreated: collectionResult.locationHeader,
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", jobRecord.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        {
          error: `Delivery order failed (collection order was created): ${errMsg}`,
          httpStatus,
          partialSuccess: {
            trackpodCollectionOrderId: collectionResult.locationHeader,
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
