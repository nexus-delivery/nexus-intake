import { NextRequest, NextResponse } from "next/server";
import {
  ensureProviderExists,
  getConnectionRow,
  listProviders,
  runGenericConnectionTest,
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

    const connection = await getConnectionRow(
      auth.value.privilegedClient,
      auth.value.companyId,
      providerKey
    );

    if (!connection || connection.connected !== true) {
      return NextResponse.json({ error: "Provider is not connected" }, { status: 400 });
    }

    const testResult = runGenericConnectionTest(connection);

    await upsertConnection(auth.value.privilegedClient, {
      company_id: auth.value.companyId,
      provider_key: providerKey,
      connected: true,
      last_tested_at: testResult.checkedAt,
      last_error: testResult.ok ? null : testResult.message,
      updated_by_user_id: auth.value.user.id,
      created_by_user_id: auth.value.user.id,
    });

    return NextResponse.json({ success: true, result: testResult });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Integration test failed" },
      { status: 500 }
    );
  }
}
