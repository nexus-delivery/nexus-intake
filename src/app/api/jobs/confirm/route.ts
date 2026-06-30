import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ConfirmJobRequest = {
  draftJobId?: string;
  trackPodMapping?: Record<string, string | null> | null;
};

type TrackPodOrderType = 1 | 0;

type TrackPodOrderResult = {
  orderId: string;
  trackingUrl: string;
  raw: unknown;
};

type TrackPodResult = {
  collectionOrderId: string;
  deliveryOrderId: string;
  collectionTrackingUrl: string;
  deliveryTrackingUrl: string;
  raw: {
    collection: unknown;
    delivery: unknown;
  };
};

type XeroResult = {
  draftInvoiceId: string;
  raw: unknown;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const trackPodApiBaseUrl =
  process.env.TRACKPOD_API_BASE_URL ?? "https://api.track-pod.com/Order";
const trackPodApiKey = process.env.TRACKPOD_API_KEY ?? "";

const xeroApiBaseUrl = process.env.XERO_API_BASE_URL ?? "https://api.xero.com/api.xro/2.0";
const xeroAccessToken = process.env.XERO_ACCESS_TOKEN;
const xeroTenantId = process.env.XERO_TENANT_ID;

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

function cleanString(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function parseCurrencyToNumber(value: string | null | undefined): number {
  const numeric = Number.parseFloat((value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function extractFirstString(payload: unknown, keys: string[]): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

function resolveMasterReference(
  mapping: Record<string, string | null>,
  draftJobId: string
): string {
  const customerReference = cleanString(mapping.order_reference);
  if (customerReference) {
    return customerReference;
  }
  return generateJobReference(draftJobId);
}

function isTestOrderReference(ref: string): boolean {
  return /^(TEST-|NEX-TEST-)/i.test(ref.trim());
}

function buildTrackPodPayload(
  mapping: Record<string, string | null>,
  masterReference: string,
  orderType: TrackPodOrderType,
  documentInfo: {
    documentUrl: string;
    fileName: string;
    fileType: string;
    filePath: string;
  } | null
) {
  const baseNotes = cleanString(mapping.delivery_notes);
  const documentNotes = documentInfo
    ? [
        "Delivery Notes...",
        `Purchase Order: ${documentInfo.documentUrl}`,
        `Document Filename: ${documentInfo.fileName}`,
        `Document File Type: ${documentInfo.fileType}`,
      ].join("\n")
    : "";

  const mergedNotes = [baseNotes, documentNotes].filter(Boolean).join("\n\n");

  const client = cleanString(mapping.customer);
  const shipper = cleanString(mapping.merchant_shipper) || cleanString(mapping.collection_name);
  const depotShipFrom = cleanString(mapping.collection_name);

  return {
    Number: masterReference,
    Id: masterReference,
    Type: orderType,
    reference: masterReference,
    collectionOrderNumber: masterReference,
    deliveryOrderNumber: masterReference,
    orderType: cleanString(mapping.order_type),
    collectionDate: cleanString(mapping.collection_date),
    deliveryDate: cleanString(mapping.delivery_date),
    client,
    shipper,
    depotShipFrom,
    collectionName: cleanString(mapping.collection_name),
    collectionAddress: cleanString(mapping.collection_address),
    deliveryName: cleanString(mapping.customer),
    deliveryAddress: cleanString(mapping.delivery_address),
    contactName: cleanString(mapping.contact_name),
    phone: cleanString(mapping.telephone),
    email: cleanString(mapping.email),
    goodsDescription: cleanString(mapping.goods_description),
    quantity: cleanString(mapping.quantity),
    weight: cleanString(mapping.weight),
    notes: mergedNotes,
    packages: cleanString(mapping.plt_pkg),
    cod: cleanString(mapping.cod),
    documentUrl: documentInfo?.documentUrl ?? "",
    documentFilename: documentInfo?.fileName ?? "",
    documentFileType: documentInfo?.fileType ?? "",
    documentStoragePath: documentInfo?.filePath ?? "",
  };
}

function buildXeroDraftInvoicePayload(
  mapping: Record<string, string | null>,
  jobReference: string
) {
  const netAmount = parseCurrencyToNumber(mapping.net_amount);
  const vatAmount = parseCurrencyToNumber(mapping.vat_amount);
  const grossAmount = parseCurrencyToNumber(mapping.gross_total);
  const effectiveGross = grossAmount > 0 ? grossAmount : netAmount + vatAmount;

  return {
    Type: "ACCREC",
    Status: "DRAFT",
    Reference: jobReference,
    Contact: {
      Name: cleanString(mapping.customer) || "Delivery Customer",
      EmailAddress: cleanString(mapping.email) || undefined,
    },
    Date: cleanString(mapping.delivery_date) || undefined,
    DueDate: cleanString(mapping.delivery_date) || undefined,
    LineAmountTypes: "Exclusive",
    LineItems: [
      {
        Description: cleanString(mapping.goods_description) || "Delivery job",
        Quantity: Number.parseFloat(cleanString(mapping.quantity)) || 1,
        UnitAmount: netAmount > 0 ? netAmount : effectiveGross,
        TaxAmount: vatAmount,
        LineAmount: netAmount > 0 ? netAmount : effectiveGross,
      },
    ],
  };
}

async function createTrackPodOrder(
  mapping: Record<string, string | null>,
  masterReference: string,
  orderType: TrackPodOrderType,
  documentInfo: {
    documentUrl: string;
    fileName: string;
    fileType: string;
    filePath: string;
  } | null
): Promise<TrackPodOrderResult> {
  const step = orderType === 0 ? "delivery_order" : "collection_order";

  console.info("[jobs/confirm] Track-POD config", {
    step,
    orderType,
    reference: masterReference,
    keyExists: Boolean(trackPodApiKey),
    keyLength: trackPodApiKey.length,
    baseUrl: trackPodApiBaseUrl,
  });

  if (!trackPodApiBaseUrl || !trackPodApiKey) {
    throw new Error("Track-POD credentials are not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  headers["X-API-KEY"] = trackPodApiKey;

  const response = await fetch(trackPodApiBaseUrl.replace(/\/$/, ""), {
    method: "POST",
    headers,
    body: JSON.stringify(buildTrackPodPayload(mapping, masterReference, orderType, documentInfo)),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    const responseText = JSON.stringify(payload);
    throw new Error(`Track-POD create order failed (${response.status}): ${responseText}`);
  }

  console.info("[jobs/confirm] Track-POD order created", {
    step,
    orderType,
    reference: masterReference,
    status: response.status,
    locationHeader: response.headers.get("location") ?? null,
  });

  const orderId =
    extractFirstString(payload, ["id", "orderId", "deliveryOrderId", "reference"])
    ?? masterReference;

  const trackingUrl =
    extractFirstString(payload, ["deliveryTrackingUrl", "trackingUrl", "publicTrackingUrl"])
    ?? "";

  if (!orderId) {
    throw new Error("Track-POD response did not include a delivery order ID");
  }

  return { orderId, trackingUrl, raw: payload };
}

async function createXeroDraftInvoice(
  mapping: Record<string, string | null>,
  jobReference: string
): Promise<XeroResult> {
  if (!xeroAccessToken || !xeroTenantId) {
    throw new Error("Xero credentials are not configured");
  }

  const response = await fetch(`${xeroApiBaseUrl.replace(/\/$/, "")}/Invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${xeroAccessToken}`,
      "xero-tenant-id": xeroTenantId,
      Accept: "application/json",
    },
    body: JSON.stringify({
      Invoices: [buildXeroDraftInvoicePayload(mapping, jobReference)],
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(`Xero draft invoice create failed (${response.status})`);
  }

  let draftInvoiceId: string | null = null;
  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const invoices = obj.Invoices;
    if (Array.isArray(invoices) && invoices.length > 0) {
      draftInvoiceId = extractFirstString(invoices[0], ["InvoiceID", "InvoiceNumber", "Reference"]);
    }
  }

  if (!draftInvoiceId) {
    throw new Error("Xero response did not include a draft invoice ID");
  }

  return { draftInvoiceId, raw: payload };
}

function generateJobReference(jobId: string): string {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = jobId.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${dateStr}-${suffix}`;
}

async function resolveDocumentInfo(
  privilegedClient: any,
  companyId: string,
  documentId: string | null
): Promise<{ documentUrl: string; fileName: string; fileType: string; filePath: string } | null> {
  if (!documentId) return null;

  const { data: document, error: documentError } = await privilegedClient
    .from("uploaded_documents")
    .select("file_name, file_type, file_path")
    .eq("id", documentId)
    .eq("company_id", companyId)
    .maybeSingle();

  const resolvedDocument = document as
    | { file_name: string; file_type: string; file_path: string }
    | null;

  if (documentError || !resolvedDocument) {
    return null;
  }

  const publicUrlResult = privilegedClient.storage
    .from("merchant-documents")
    .getPublicUrl(resolvedDocument.file_path);

  const documentUrl = publicUrlResult?.data?.publicUrl ?? "";

  return {
    documentUrl,
    fileName: resolvedDocument.file_name,
    fileType: resolvedDocument.file_type,
    filePath: resolvedDocument.file_path,
  };
}

export async function POST(request: NextRequest) {
  try {
    const accessToken = parseBearerToken(request);
    if (!accessToken) {
      return NextResponse.json({ error: "Please sign in to access this action" }, { status: 401 });
    }

    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();

    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase environment is not configured" }, { status: 500 });
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: "Please sign in to access this action" }, { status: 401 });
    }

    const body = (await request.json()) as ConfirmJobRequest;
    if (!body.draftJobId) {
      return NextResponse.json({ error: "Missing draft job ID" }, { status: 400 });
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
      .select("id, company_id, status, primary_document_id")
      .eq("id", body.draftJobId)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (draftJobError) {
      return NextResponse.json({ error: draftJobError.message }, { status: 500 });
    }

    if (!draftJob) {
      return NextResponse.json({ error: "Draft job not found for this company" }, { status: 404 });
    }

    const mapping = body.trackPodMapping;
    if (!mapping) {
      return NextResponse.json({ error: "Missing Track-POD mapping payload" }, { status: 400 });
    }

    const masterReference = resolveMasterReference(mapping, draftJob.id);
    const jobReference = masterReference;

    if (
      isTestOrderReference(masterReference) &&
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

    const documentInfo = await resolveDocumentInfo(
      privilegedClient,
      profile.company_id,
      draftJob.primary_document_id
    );

    console.info("[jobs/confirm] Starting Track-POD order creation", {
      draftJobId: draftJob.id,
      reference: masterReference,
      hasDocument: Boolean(draftJob.primary_document_id),
    });

    let deliveryOrder: TrackPodOrderResult;
    try {
      deliveryOrder = await createTrackPodOrder(
        mapping,
        masterReference,
        0,
        documentInfo
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await privilegedClient
        .from("draft_jobs")
        .update({
          lifecycle_status: "TRACKPOD_ERROR",
          trackpod_error_detail: {
            step: "delivery_order",
            message,
            reference: masterReference,
            payload: buildTrackPodPayload(mapping, masterReference, 0, documentInfo),
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", draftJob.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        {
          error: `Delivery order failed: ${message}`,
          step: "delivery_order",
        },
        { status: 502 }
      );
    }

    let collectionOrder: TrackPodOrderResult;
    try {
      collectionOrder = await createTrackPodOrder(
        mapping,
        masterReference,
        1,
        documentInfo
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      await privilegedClient
        .from("draft_jobs")
        .update({
          trackpod_delivery_order_id: deliveryOrder.orderId,
          lifecycle_status: "TRACKPOD_ERROR",
          trackpod_error_detail: {
            step: "collection_order",
            message,
            reference: masterReference,
            payload: buildTrackPodPayload(mapping, masterReference, 1, documentInfo),
            deliveryOrderAlreadyCreated: deliveryOrder.orderId,
          },
          trackpod_error_at: new Date().toISOString(),
        })
        .eq("id", draftJob.id)
        .eq("company_id", profile.company_id);

      return NextResponse.json(
        {
          error: `Collection order failed (delivery order was created): ${message}`,
          step: "collection_order",
          partialSuccess: {
            trackPodDeliveryOrderId: deliveryOrder.orderId,
          },
        },
        { status: 502 }
      );
    }

    const trackPodResult: TrackPodResult = {
      collectionOrderId: collectionOrder.orderId,
      deliveryOrderId: deliveryOrder.orderId,
      collectionTrackingUrl: collectionOrder.trackingUrl,
      deliveryTrackingUrl: deliveryOrder.trackingUrl,
      raw: {
        collection: collectionOrder.raw,
        delivery: deliveryOrder.raw,
      },
    };

    const xeroResult = await createXeroDraftInvoice(mapping, jobReference);

    const integrationMetadata = {
      masterReference,
      events: [
        {
          event: "master_reference_assigned",
          value: masterReference,
          source: cleanString(mapping.order_reference) ? "customer_order_reference" : "nexus_generated",
          createdAt: new Date().toISOString(),
        },
      ],
      routeIt: {
        state: "sent_to_trackpod",
        collectionOrderId: trackPodResult.collectionOrderId,
        deliveryOrderId: trackPodResult.deliveryOrderId,
        collectionTrackingUrl: trackPodResult.collectionTrackingUrl,
        deliveryTrackingUrl: trackPodResult.deliveryTrackingUrl,
      },
      trackpod: trackPodResult.raw,
      xero: xeroResult.raw,
      currentStatus: "track_it",
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        status: "job_created",
        job_reference: jobReference,
        trackpod_collection_order_id: trackPodResult.collectionOrderId,
        trackpod_delivery_order_id: trackPodResult.deliveryOrderId,
        trackpod_collection_tracking_url: trackPodResult.collectionTrackingUrl,
        trackpod_delivery_tracking_url: trackPodResult.deliveryTrackingUrl,
        xero_draft_invoice_id: xeroResult.draftInvoiceId,
        document_url: documentInfo?.documentUrl ?? null,
        document_filename: documentInfo?.fileName ?? null,
        document_file_type: documentInfo?.fileType ?? null,
        document_storage_path: documentInfo?.filePath ?? null,
        current_status: "track_it",
        last_sync: new Date().toISOString(),
        last_api_response: {
          trackpod: trackPodResult.raw,
          xero: xeroResult.raw,
        },
        integration_metadata: integrationMetadata,
      })
      .eq("id", draftJob.id)
      .eq("company_id", profile.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    if (draftJob.primary_document_id) {
      const { error: timelineError } = await privilegedClient
        .from("document_timeline")
        .insert({
          document_id: draftJob.primary_document_id,
          company_id: profile.company_id,
          event: "master_reference_applied",
          actor: user.email ?? user.id,
          actor_profile_id: profile.id,
          metadata: {
            masterReference,
            trackPodCollectionOrderId: trackPodResult.collectionOrderId,
            trackPodDeliveryOrderId: trackPodResult.deliveryOrderId,
            trackPodCollectionTrackingUrl: trackPodResult.collectionTrackingUrl,
            trackPodDeliveryTrackingUrl: trackPodResult.deliveryTrackingUrl,
            xeroDraftInvoiceId: xeroResult.draftInvoiceId,
            documentUrl: documentInfo?.documentUrl ?? null,
          },
        });

      if (timelineError) {
        return NextResponse.json({ error: timelineError.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      jobId: draftJob.id,
      jobReference,
      trackPodCollectionOrderId: trackPodResult.collectionOrderId,
      trackPodDeliveryOrderId: trackPodResult.deliveryOrderId,
      trackPodCollectionTrackingUrl: trackPodResult.collectionTrackingUrl,
      trackPodDeliveryTrackingUrl: trackPodResult.deliveryTrackingUrl,
      xeroDraftInvoiceId: xeroResult.draftInvoiceId,
      documentUrl: documentInfo?.documentUrl ?? null,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to confirm job",
      },
      { status: 500 }
    );
  }
}
