import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type ConfirmJobRequest = {
  draftJobId?: string;
  trackPodMapping?: Record<string, string | null> | null;
};

type TrackPodResult = {
  deliveryOrderId: string;
  raw: unknown;
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

const trackPodApiBaseUrl = process.env.TRACKPOD_API_BASE_URL;
const trackPodApiKey = process.env.TRACKPOD_API_KEY;
const trackPodApiToken = process.env.TRACKPOD_API_TOKEN;

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

function buildTrackPodPayload(mapping: Record<string, string | null>) {
  return {
    reference: cleanString(mapping.order_reference),
    orderType: cleanString(mapping.order_type),
    collectionDate: cleanString(mapping.collection_date),
    deliveryDate: cleanString(mapping.delivery_date),
    shipper: cleanString(mapping.merchant_shipper),
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
    notes: cleanString(mapping.delivery_notes),
    packages: cleanString(mapping.plt_pkg),
    cod: cleanString(mapping.cod),
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

async function createTrackPodDeliveryOrder(
  mapping: Record<string, string | null>
): Promise<TrackPodResult> {
  if (!trackPodApiBaseUrl || (!trackPodApiKey && !trackPodApiToken)) {
    throw new Error("Track-POD credentials are not configured");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (trackPodApiToken) {
    headers.Authorization = `Bearer ${trackPodApiToken}`;
  }
  if (trackPodApiKey) {
    headers["X-API-Key"] = trackPodApiKey;
  }

  const response = await fetch(`${trackPodApiBaseUrl.replace(/\/$/, "")}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(buildTrackPodPayload(mapping)),
  });

  const payload = (await response.json().catch(() => ({}))) as unknown;

  if (!response.ok) {
    throw new Error(`Track-POD create order failed (${response.status})`);
  }

  const deliveryOrderId =
    extractFirstString(payload, ["id", "orderId", "deliveryOrderId", "reference"])
    ?? "";

  if (!deliveryOrderId) {
    throw new Error("Track-POD response did not include a delivery order ID");
  }

  return { deliveryOrderId, raw: payload };
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
      .select("id, company_id, status")
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

    const jobReference = generateJobReference(draftJob.id);

    const trackPodResult = await createTrackPodDeliveryOrder(mapping);
    const xeroResult = await createXeroDraftInvoice(mapping, jobReference);

    const integrationMetadata = {
      trackpod: trackPodResult.raw,
      xero: xeroResult.raw,
      updatedAt: new Date().toISOString(),
    };

    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        status: "job_created",
        job_reference: jobReference,
        trackpod_delivery_order_id: trackPodResult.deliveryOrderId,
        xero_draft_invoice_id: xeroResult.draftInvoiceId,
        integration_metadata: integrationMetadata,
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
      trackPodDeliveryOrderId: trackPodResult.deliveryOrderId,
      xeroDraftInvoiceId: xeroResult.draftInvoiceId,
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
