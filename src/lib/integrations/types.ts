export type IntegrationCategory =
  | "accounting"
  | "commerce"
  | "operations"
  | "communications"
  | "payments";

export type IntegrationCapability =
  | "invoice_export"
  | "order_ingest"
  | "operational_execution"
  | "customer_notifications"
  | "payment_collection";

export type IntegrationProvider = {
  providerKey: string;
  category: IntegrationCategory;
  displayName: string;
  capabilities: IntegrationCapability[];
  sortOrder: number;
  isActive: boolean;
};

export type MerchantIntegrationConnection = {
  providerKey: string;
  connected: boolean;
  connectedAt: string | null;
  disconnectedAt: string | null;
  configuration: Record<string, unknown>;
  lastSynchronisedAt: string | null;
  lastTestedAt: string | null;
  lastError: string | null;
};

export type MerchantIntegrationView = IntegrationProvider & MerchantIntegrationConnection;

export type IntegrationTestResult = {
  ok: boolean;
  checkedAt: string;
  message: string;
};
