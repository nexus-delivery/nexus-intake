import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";

type DraftJobInvoiceRow = {
  id: string;
  job_reference: string | null;
  customer: string | null;
  delivery_company: string | null;
  goods_description: string | null;
  commercial_total: string | null;
  commercial_net: string | null;
  commercial_vat: string | null;
  invoice_required: boolean | null;
  xero_draft_invoice_id: string | null;
  lifecycle_status: string | null;
  current_status: string | null;
  updated_at: string;
  created_at: string;
};

const selectFields = [
  "id",
  "job_reference",
  "customer",
  "delivery_company",
  "goods_description",
  "commercial_total",
  "commercial_net",
  "commercial_vat",
  "invoice_required",
  "xero_draft_invoice_id",
  "lifecycle_status",
  "current_status",
  "updated_at",
  "created_at",
].join(", ");

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const { data, error } = await context.value.privilegedClient
      .from("draft_jobs")
      .select(selectFields)
      .eq("company_id", context.value.companyId)
      .eq("invoice_required", true)
      .order("updated_at", { ascending: false })
      .limit(300)
      .returns<DraftJobInvoiceRow[]>();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const jobs = (data ?? []).map((job) => ({
      id: job.id,
      jobReference: job.job_reference ?? "",
      customer: job.customer ?? job.delivery_company ?? "",
      goodsDescription: job.goods_description ?? "",
      total: job.commercial_total ?? "",
      net: job.commercial_net ?? "",
      vat: job.commercial_vat ?? "",
      invoiceRequired: job.invoice_required === true,
      xeroDraftInvoiceId: job.xero_draft_invoice_id,
      lifecycleStatus: job.lifecycle_status ?? "",
      currentStatus: job.current_status ?? "",
      updatedAt: job.updated_at,
      createdAt: job.created_at,
    }));

    const awaitingInvoice = jobs.filter((job) => !job.xeroDraftInvoiceId);
    const invoiceHistory = jobs.filter((job) => Boolean(job.xeroDraftInvoiceId));

    return NextResponse.json({
      awaitingInvoice,
      invoiceHistory,
      payments: {
        pendingCount: invoiceHistory.length,
        postedToday: 0,
      },
      creditNotes: {
        openCount: 0,
      },
      statements: {
        generatedToday: 0,
      },
      financeDashboard: {
        awaitingInvoiceCount: awaitingInvoice.length,
        invoicedCount: invoiceHistory.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load Account-it invoices" },
      { status: 500 }
    );
  }
}
