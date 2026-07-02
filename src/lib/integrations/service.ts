import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  IntegrationCapability,
  IntegrationCategory,
  IntegrationProvider,
  IntegrationTestResult,
  MerchantIntegrationConnection,
  MerchantIntegrationView,
} from "@/lib/integrations/types";

type IntegrationProviderRow = Record<string, unknown>;
type ConnectionRow = Record<string, unknown>;

const providerSelect = [
  "provider_key",
  "category",
  "display_name",
  "capabilities",
  "sort_order",
  "is_active",
].join(", ");

const connectionSelect = [
  "provider_key",
  "connected",
  "connected_at",
  "disconnected_at",
  "configuration",
  "last_synchronised_at",
  "last_tested_at",
  "last_error",
  "credentials_ciphertext",
  "credentials_iv",
  "credentials_tag",
].join(", ");

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function toOptionalText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function toBool(value: unknown): boolean {
  return value === true;
}

function toCapabilities(value: unknown): IntegrationCapability[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is IntegrationCapability => typeof entry === "string") as IntegrationCapability[];
}

function toConfiguration(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

export function mapIntegrationProvider(row: IntegrationProviderRow): IntegrationProvider {
  return {
    providerKey: toText(row.provider_key),
    category: toText(row.category) as IntegrationCategory,
    displayName: toText(row.display_name),
    capabilities: toCapabilities(row.capabilities),
    sortOrder: Number(row.sort_order) || 100,
    isActive: row.is_active !== false,
  };
}

export function mapIntegrationConnection(row: ConnectionRow): MerchantIntegrationConnection {
  return {
    providerKey: toText(row.provider_key),
    connected: toBool(row.connected),
    connectedAt: toOptionalText(row.connected_at),
    disconnectedAt: toOptionalText(row.disconnected_at),
    configuration: toConfiguration(row.configuration),
    lastSynchronisedAt: toOptionalText(row.last_synchronised_at),
    lastTestedAt: toOptionalText(row.last_tested_at),
    lastError: toOptionalText(row.last_error),
  };
}

export async function listProviders(client: SupabaseClient): Promise<IntegrationProvider[]> {
  const { data, error } = await client
    .from("integration_providers")
    .select(providerSelect)
    .eq("is_active", true)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .returns<IntegrationProviderRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => mapIntegrationProvider(row));
}

export async function listMerchantConnections(
  client: SupabaseClient,
  companyId: string
): Promise<ConnectionRow[]> {
  const { data, error } = await client
    .from("merchant_integration_connections")
    .select(connectionSelect)
    .eq("company_id", companyId)
    .returns<ConnectionRow[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function listMerchantIntegrations(
  client: SupabaseClient,
  companyId: string
): Promise<MerchantIntegrationView[]> {
  const [providers, connectionRows] = await Promise.all([
    listProviders(client),
    listMerchantConnections(client, companyId),
  ]);

  const connections = new Map(
    connectionRows.map((row) => [toText(row.provider_key), mapIntegrationConnection(row)])
  );

  return providers.map((provider) => {
    const connection = connections.get(provider.providerKey);

    return {
      ...provider,
      providerKey: provider.providerKey,
      connected: connection?.connected ?? false,
      connectedAt: connection?.connectedAt ?? null,
      disconnectedAt: connection?.disconnectedAt ?? null,
      configuration: connection?.configuration ?? {},
      lastSynchronisedAt: connection?.lastSynchronisedAt ?? null,
      lastTestedAt: connection?.lastTestedAt ?? null,
      lastError: connection?.lastError ?? null,
    };
  });
}

export function ensureProviderExists(
  providers: IntegrationProvider[],
  providerKey: string
): IntegrationProvider {
  const match = providers.find((provider) => provider.providerKey === providerKey);
  if (!match) {
    throw new Error("Integration provider not found");
  }
  return match;
}

export async function getConnectionRow(
  client: SupabaseClient,
  companyId: string,
  providerKey: string
): Promise<ConnectionRow | null> {
  const { data, error } = await client
    .from("merchant_integration_connections")
    .select(connectionSelect)
    .eq("company_id", companyId)
    .eq("provider_key", providerKey)
    .maybeSingle<ConnectionRow>();

  if (error) {
    throw new Error(error.message);
  }

  return data ?? null;
}

export async function upsertConnection(
  client: SupabaseClient,
  row: Record<string, unknown>
): Promise<ConnectionRow> {
  const { data, error } = await client
    .from("merchant_integration_connections")
    .upsert(row, { onConflict: "company_id,provider_key" })
    .select(connectionSelect)
    .single<ConnectionRow>();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to save integration connection");
  }

  return data;
}

export async function resolveProviderForCapability(
  client: SupabaseClient,
  companyId: string,
  capability: IntegrationCapability
): Promise<MerchantIntegrationView | null> {
  const integrations = await listMerchantIntegrations(client, companyId);
  return (
    integrations.find(
      (integration) =>
        integration.connected && integration.capabilities.includes(capability)
    ) ?? null
  );
}

export function runGenericConnectionTest(connection: ConnectionRow): IntegrationTestResult {
  const hasSecrets =
    typeof connection.credentials_ciphertext === "string" &&
    connection.credentials_ciphertext.length > 0 &&
    typeof connection.credentials_iv === "string" &&
    connection.credentials_iv.length > 0 &&
    typeof connection.credentials_tag === "string" &&
    connection.credentials_tag.length > 0;

  const checkedAt = new Date().toISOString();

  if (!hasSecrets) {
    return {
      ok: false,
      checkedAt,
      message: "Credentials are not configured",
    };
  }

  return {
    ok: true,
    checkedAt,
    message: "Connection profile is valid",
  };
}
