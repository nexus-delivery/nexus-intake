import { NextRequest, NextResponse } from "next/server";
import {
  ensureProviderExists,
  listProviders,
  mapIntegrationConnection,
  upsertConnection,
} from "@/lib/integrations/service";
import { getMerchantContext } from "@/lib/serverAuth";

export async function POST(
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

  try {
    const providers = await listProviders(auth.value.privilegedClient);
    ensureProviderExists(providers, providerKey);

    const row = await upsertConnection(auth.value.privilegedClient, {
      company_id: auth.value.companyId,
      provider_key: providerKey,
      connected: false,
      disconnected_at: new Date().toISOString(),
      credentials_ciphertext: null,
      credentials_iv: null,
      credentials_tag: null,
      last_error: null,
      updated_by_user_id: auth.value.user.id,
      created_by_user_id: auth.value.user.id,
    });

    return NextResponse.json({ success: true, connection: mapIntegrationConnection(row) });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to disconnect integration",
      },
      { status: 500 }
    );
  }
}
