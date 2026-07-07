import { NextRequest, NextResponse } from "next/server";
import { canManageMerchants, getMerchantContext } from "@/lib/serverAuth";

type CompanyRow = {
  id: string;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  created_at: string;
  updated_at: string;
};

function restoreName(name: string): string {
  return name.replace(/^\[archived\]\s*/i, "").trim();
}

function restoreBusinessType(value: string | null): string {
  return (value ?? "").replace(/^disabled:\s*/i, "").trim();
}

function applyAction(company: CompanyRow, action: string): { name: string; business_type: string | null } {
  const cleanedName = restoreName(company.name);
  const cleanedBusinessType = restoreBusinessType(company.business_type);

  switch (action) {
    case "archive":
      return {
        name: `[ARCHIVED] ${cleanedName || "Merchant"}`,
        business_type: cleanedBusinessType || null,
      };
    case "restore":
      return {
        name: cleanedName || company.name,
        business_type: cleanedBusinessType || null,
      };
    case "disable":
      return {
        name: cleanedName || company.name,
        business_type: `disabled:${cleanedBusinessType || "general"}`,
      };
    case "enable":
      return {
        name: cleanedName || company.name,
        business_type: cleanedBusinessType || null,
      };
    default:
      return {
        name: cleanedName || company.name,
        business_type: cleanedBusinessType || null,
      };
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const isAdmin = canManageMerchants(context.value.role);
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admin roles can update merchants." }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const action = String(body.action ?? "").trim().toLowerCase();

  const { data: company, error: companyError } = await context.value.privilegedClient
    .from("companies")
    .select("id, name, trading_name, business_type, created_at, updated_at")
    .eq("id", id)
    .maybeSingle<CompanyRow>();

  if (companyError) {
    return NextResponse.json({ error: companyError.message }, { status: 500 });
  }

  if (!company) {
    return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {};

  if (action === "edit") {
    const merchantName = String(body.merchantName ?? "").trim();
    const tradingName = String(body.company ?? "").trim();
    const businessType = String(body.businessType ?? "").trim();
    const status = String(body.status ?? "").trim().toLowerCase();

    if (!merchantName) {
      return NextResponse.json({ error: "Merchant name is required." }, { status: 400 });
    }

    updatePayload.name = merchantName;
    updatePayload.trading_name = tradingName || null;
    updatePayload.business_type = businessType || null;

    if (["active", "disabled", "archived"].includes(status)) {
      const applied = applyAction(company, status === "active" ? "restore" : status);
      updatePayload.name = applied.name;
      updatePayload.business_type = applied.business_type;
    }
  } else {
    const next = applyAction(company, action);
    updatePayload.name = next.name;
    updatePayload.business_type = next.business_type;
  }

  const { data: updated, error: updateError } = await context.value.privilegedClient
    .from("companies")
    .update(updatePayload)
    .eq("id", id)
    .select("id, name, trading_name, business_type, created_at, updated_at")
    .single<CompanyRow>();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message ?? "Failed to update merchant" }, { status: 500 });
  }

  return NextResponse.json({ success: true, merchant: updated });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const isAdmin = canManageMerchants(context.value.role);
  if (!isAdmin) {
    return NextResponse.json({ error: "Only admin roles can delete merchants." }, { status: 403 });
  }

  const { id } = await params;

  const dependencies = await Promise.all([
    context.value.privilegedClient.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", id),
    context.value.privilegedClient.from("draft_jobs").select("id", { count: "exact", head: true }).eq("company_id", id),
    context.value.privilegedClient.from("merchant_customers").select("id", { count: "exact", head: true }).eq("company_id", id),
  ]);

  const hasDependencies = dependencies.some((result) => (result.count ?? 0) > 0);
  if (hasDependencies) {
    return NextResponse.json(
      { error: "Merchant has linked users, orders, or customers. Archive or disable it instead." },
      { status: 409 }
    );
  }

  const { error } = await context.value.privilegedClient.from("companies").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
