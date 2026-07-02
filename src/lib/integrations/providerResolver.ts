import type { SupabaseClient } from "@supabase/supabase-js";
import {
  resolveProviderForCapability,
} from "@/lib/integrations/service";

export async function resolveAccountingProvider(
  client: SupabaseClient,
  companyId: string
) {
  return resolveProviderForCapability(client, companyId, "invoice_export");
}

export async function resolveOrderIngestProvider(
  client: SupabaseClient,
  companyId: string
) {
  return resolveProviderForCapability(client, companyId, "order_ingest");
}

export async function resolveOperationalExecutionProvider(
  client: SupabaseClient,
  companyId: string
) {
  return resolveProviderForCapability(client, companyId, "operational_execution");
}

export async function resolveNotificationProvider(
  client: SupabaseClient,
  companyId: string
) {
  return resolveProviderForCapability(client, companyId, "customer_notifications");
}

export async function resolvePaymentsProvider(
  client: SupabaseClient,
  companyId: string
) {
  return resolveProviderForCapability(client, companyId, "payment_collection");
}
