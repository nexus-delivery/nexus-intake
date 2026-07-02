import { NextRequest, NextResponse } from "next/server";
import {
  ensureProviderExists,
  getConnectionRow,
  listProviders,
  mapIntegrationConnection,
  upsertConnection,
} from "@/lib/integrations/service";
import { getMerchantContext } from "@/lib/serverAuth";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ providerKey: string }> }
) {
  const auth = await getMerchantContext(request);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const params = await context.params;
  const providerKey = params.providerKey?.trim().toLowerCase();
  if (!providerKey) {
    return NextResponse.json({ error: "Missing provider key" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as { configuration?: unknown };
  if (!body.configuration || typeof body.configuration !== "object" || Array.isArray(body.configuration)) {
    return NextResponse.json({ error: "Configuration object is required" }, { status: 400 });
  }

  try {
    const providers = await listProviders(auth.value.privilegedClient);
    ensureProviderExists(providers, providerKey);

    const existing = await getConnectionRow(
      auth.value.privilegedClient,
      auth.value.companyId,
      providerKey
    );

    const mergedConfiguration = {
      ...(existing?.configuration && typeof existing.configuration === "object" && !Array.isArray(existing.configuration)
        ? (existing.configuration as Record<string, unknown>)
        : {}),
      ...(body.configuration as Record<string, unknown>),
    };

    const row = await upsertConnection(auth.value.privilegedClient, {
      company_id: auth.value.companyId,
      provider_key: providerKey,
      connected: existing?.connected === true,
      configuration: mergedConfiguration,
      updated_by_user_id: auth.value.user.id,
      created_by_user_id: auth.value.user.id,
    });

    return NextResponse.json({ success: true, connection: mapIntegrationConnection(row) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update integration configuration",
      },
      { status: 500 }
    );
  }
}
