import { NextRequest, NextResponse } from "next/server";
import { decryptCredentials } from "@/lib/integrations/credentials";
import { getConnectionRow } from "@/lib/integrations/service";
import { resolveAccountingProvider } from "@/lib/integrations/providerResolver";
import { getMerchantContext } from "@/lib/serverAuth";

type DraftJobRow = {
  id: string;
  job_reference: string | null;
  customer: string | null;
  delivery_company: string | null;
  delivery_contact: string | null;
  delivery_email: string | null;
  requested_delivery_date: string | null;
  goods_description: string | null;
  commercial_net: string | null;
  commercial_vat: string | null;
  commercial_total: string | null;
  invoice_required: boolean | null;
  xero_draft_invoice_id: string | null;
  integration_metadata: Record<string, unknown> | null;
};

type CreateInvoiceBody = {
  draftJobId?: string;
  forceSimulated?: boolean;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberFromCurrency(value: string | null): number {
  const parsed = Number.parseFloat((value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function firstString(source: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function buildInvoicePayload(args: {
  job: DraftJobRow;
  config: Record<string, unknown>;
  jobReference: string;
}) {
  const { job, config, jobReference } = args;
  const net = numberFromCurrency(job.commercial_net);
  const vat = numberFromCurrency(job.commercial_vat);
  const total = numberFromCurrency(job.commercial_total);

  const contactName =
    text(job.customer) || text(job.delivery_company) || firstString(config, ["contactName", "defaultContactName"]) || "NEXUS Customer";

  const contactId = firstString(config, ["contactId", "xeroContactId"]);
  const salesAccount = firstString(config, ["salesAccount", "xeroSalesAccount"]) || "200";
  const vatCode = firstString(config, ["vatCode", "xeroVatCode"]) || "OUTPUT2";
  const itemCode = firstString(config, ["itemCode", "xeroItemCode"]);
  const paymentTerms = firstString(config, ["paymentTerms"]);
  const brandingTheme = firstString(config, ["brandingTheme", "brandingThemeId"]);

  const lineAmount = total > 0 ? total : net + vat;

  const lineItem: Record<string, unknown> = {
    Description: text(job.goods_description) || `Operational order ${jobReference}`,
    Quantity: 1,
    UnitAmount: lineAmount > 0 ? lineAmount : 1,
    AccountCode: salesAccount,
    TaxType: vatCode,
  };

  if (itemCode) lineItem.ItemCode = itemCode;

  const invoice: Record<string, unknown> = {
    Type: "ACCREC",
    Status: "DRAFT",
    Reference: jobReference,
    Date: text(job.requested_delivery_date) || undefined,
    DueDate: text(job.requested_delivery_date) || undefined,
    Contact: {
      Name: contactName,
      EmailAddress: text(job.delivery_email) || undefined,
      ContactID: contactId || undefined,
    },
    LineAmountTypes: "Exclusive",
    LineItems: [lineItem],
  };

  if (brandingTheme) {
    invoice.BrandingThemeID = brandingTheme;
  }

  if (paymentTerms) {
    invoice.Terms = {
      Type: "DAYSAFTERBILLDATE",
      Day: Number.parseInt(paymentTerms, 10) || undefined,
    };
  }

  return { Invoices: [invoice] };
}

async function createXeroInvoice(args: {
  accessToken: string;
  tenantId: string;
  baseUrl: string;
  payload: Record<string, unknown>;
}) {
  const response = await fetch(`${args.baseUrl.replace(/\/$/, "")}/Invoices`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.accessToken}`,
      "xero-tenant-id": args.tenantId,
      Accept: "application/json",
    },
    body: JSON.stringify(args.payload),
  });

  const payload = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  if (!response.ok) {
    throw new Error(`Xero invoice create failed (${response.status})`);
  }

  const invoices = Array.isArray(payload.Invoices) ? payload.Invoices : [];
  if (invoices.length === 0 || typeof invoices[0] !== "object" || invoices[0] === null) {
    throw new Error("Xero response missing invoice payload");
  }

  const first = invoices[0] as Record<string, unknown>;
  const invoiceId = firstString(first, ["InvoiceID", "InvoiceNumber", "Reference"]);
  if (!invoiceId) {
    throw new Error("Xero response missing invoice id");
  }

  return { invoiceId, raw: payload };
}

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as CreateInvoiceBody;
    const draftJobId = text(body.draftJobId);
    if (!draftJobId) {
      return NextResponse.json({ error: "draftJobId is required" }, { status: 400 });
    }

    const { data: job, error: jobError } = await context.value.privilegedClient
      .from("draft_jobs")
      .select(
        [
          "id",
          "job_reference",
          "customer",
          "delivery_company",
          "delivery_contact",
          "delivery_email",
          "requested_delivery_date",
          "goods_description",
          "commercial_net",
          "commercial_vat",
          "commercial_total",
          "invoice_required",
          "xero_draft_invoice_id",
          "integration_metadata",
        ].join(", ")
      )
      .eq("id", draftJobId)
      .eq("company_id", context.value.companyId)
      .maybeSingle<DraftJobRow>();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (job.invoice_required !== true) {
      return NextResponse.json({ error: "Order is not marked for invoicing" }, { status: 409 });
    }

    if (job.xero_draft_invoice_id) {
      return NextResponse.json({
        success: true,
        alreadyExists: true,
        invoiceId: job.xero_draft_invoice_id,
      });
    }

    const provider = await resolveAccountingProvider(
      context.value.privilegedClient,
      context.value.companyId
    );

    if (!provider) {
      return NextResponse.json({ error: "No connected accounting provider found" }, { status: 409 });
    }

    const providerConnection = await getConnectionRow(
      context.value.privilegedClient,
      context.value.companyId,
      provider.providerKey
    );

    if (!providerConnection?.connected) {
      return NextResponse.json({ error: "Accounting provider is not connected" }, { status: 409 });
    }

    const config =
      providerConnection.configuration &&
      typeof providerConnection.configuration === "object" &&
      !Array.isArray(providerConnection.configuration)
        ? (providerConnection.configuration as Record<string, unknown>)
        : {};

    const encryptedCiphertext =
      typeof providerConnection.credentials_ciphertext === "string"
        ? providerConnection.credentials_ciphertext
        : "";
    const encryptedIv =
      typeof providerConnection.credentials_iv === "string"
        ? providerConnection.credentials_iv
        : "";
    const encryptedTag =
      typeof providerConnection.credentials_tag === "string"
        ? providerConnection.credentials_tag
        : "";

    const credentials =
      encryptedCiphertext && encryptedIv && encryptedTag
        ? decryptCredentials({
            ciphertext: encryptedCiphertext,
            iv: encryptedIv,
            tag: encryptedTag,
          })
        : {};

    const accessToken = firstString(credentials, ["accessToken", "token", "xeroAccessToken"]);
    const tenantId = firstString(credentials, ["tenantId", "xeroTenantId"])
      || firstString(config, ["tenantId", "xeroTenantId"]);

    const xeroBaseUrl =
      firstString(config, ["baseUrl", "xeroBaseUrl"])
      || process.env.XERO_API_BASE_URL
      || "https://api.xero.com/api.xro/2.0";

    const jobReference = text(job.job_reference) || `NEX-${job.id.slice(0, 8).toUpperCase()}`;
    const payload = buildInvoicePayload({
      job,
      config,
      jobReference,
    });

    let invoiceId = "";
    let invoiceResponse: Record<string, unknown> = {};
    let simulated = false;

    if (provider.providerKey === "xero" && accessToken && tenantId && body.forceSimulated !== true) {
      const created = await createXeroInvoice({
        accessToken,
        tenantId,
        baseUrl: xeroBaseUrl,
        payload,
      });
      invoiceId = created.invoiceId;
      invoiceResponse = created.raw;
    } else {
      simulated = true;
      invoiceId = `SIM-XERO-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${job.id.slice(-4).toUpperCase()}`;
      invoiceResponse = {
        simulated: true,
        reason: "Missing live Xero credentials or simulated mode requested",
        payload,
      };
    }

    const previousMetadata =
      job.integration_metadata && typeof job.integration_metadata === "object"
        ? (job.integration_metadata as Record<string, unknown>)
        : {};

    const accountingMeta =
      previousMetadata.accounting && typeof previousMetadata.accounting === "object"
        ? (previousMetadata.accounting as Record<string, unknown>)
        : {};

    const { error: updateError } = await context.value.privilegedClient
      .from("draft_jobs")
      .update({
        xero_draft_invoice_id: invoiceId,
        integration_metadata: {
          ...previousMetadata,
          accounting: {
            ...accountingMeta,
            provider: provider.providerKey,
            invoiceId,
            simulated,
            invoicePayload: payload,
            invoiceResponse,
            createdAt: new Date().toISOString(),
          },
        },
      })
      .eq("id", draftJobId)
      .eq("company_id", context.value.companyId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      provider: provider.providerKey,
      invoiceId,
      simulated,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create invoice" },
      { status: 500 }
    );
  }
}
