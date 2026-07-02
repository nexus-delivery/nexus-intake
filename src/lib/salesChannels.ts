export type SalesChannelRecord = {
  id: string;
  company_id: string;
  merchant_id: string | null;
  name: string;
  source_type: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export async function resolveSalesChannel(params: {
  companyId: string;
  name: string;
  merchantId?: string | null;
  sourceType?: string | null;
  authHeaders?: Record<string, string>;
}): Promise<SalesChannelRecord | null> {
  const companyId = params.companyId.trim();
  const name = params.name.trim();
  if (!companyId || !name) {
    return null;
  }

  const response = await fetch("/api/reference/sales-channels", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(params.authHeaders ?? {}) },
    body: JSON.stringify({
      company_id: companyId,
      merchant_id: params.merchantId ?? null,
      name,
      source_type: params.sourceType ?? null,
      active: true,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as { item?: SalesChannelRecord; error?: string };
  if (!response.ok || !payload.item) {
    throw new Error(payload.error ?? "Failed to resolve sales channel");
  }

  return payload.item;
}
