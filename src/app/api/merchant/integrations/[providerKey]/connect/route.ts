import { NextRequest, NextResponse } from "next/server";
import {
  encryptCredentials,
  hasCredentialShape,
} from "@/lib/integrations/credentials";
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

  const body = (await request.json().catch(() => ({}))) as {
    credentials?: unknown;
    configuration?: unknown;
  };

  if (!hasCredentialShape(body.credentials) || Object.keys(body.credentials).length === 0) {
    return NextResponse.json({ error: "Credentials are required" }, { status: 400 });
  }

  const configuration =
    body.configuration && typeof body.configuration === "object" && !Array.isArray(body.configuration)
      ? (body.configuration as Record<string, unknown>)
      : {};

  try {
    const providers = await listProviders(auth.value.privilegedClient);
    ensureProviderExists(providers, providerKey);

    const encrypted = encryptCredentials(body.credentials);

    const row = await upsertConnection(auth.value.privilegedClient, {
      company_id: auth.value.companyId,
      provider_key: providerKey,
      connected: true,
      connected_at: new Date().toISOString(),
      disconnected_at: null,
      credentials_ciphertext: encrypted.ciphertext,
      credentials_iv: encrypted.iv,
      credentials_tag: encrypted.tag,
      configuration,
      last_error: null,
      updated_by_user_id: auth.value.user.id,
      created_by_user_id: auth.value.user.id,
    });

    return NextResponse.json({ success: true, connection: mapIntegrationConnection(row) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to connect integration" },
      { status: 500 }
    );
  }
}
