"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { IntegrationCategory, MerchantIntegrationView } from "@/lib/integrations/types";

type IntegrationsResponse = {
  integrations?: MerchantIntegrationView[];
  error?: string;
};

const categoryLabels: Record<IntegrationCategory, string> = {
  accounting: "Accounting",
  commerce: "Commerce",
  operations: "Courier & Operations",
  communications: "Communications",
  payments: "Payments",
};

async function authHeaders(): Promise<Record<string, string>> {
  if (!supabase) return {};
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
}

function formatDate(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Never" : date.toLocaleString();
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value ?? {}, null, 2);
}

export default function IntegrateItManager() {
  const [integrations, setIntegrations] = useState<MerchantIntegrationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [busyProviderKey, setBusyProviderKey] = useState<string | null>(null);
  const [editingProviderKey, setEditingProviderKey] = useState<string | null>(null);
  const [credentialsText, setCredentialsText] = useState("{\n  \"apiKey\": \"\"\n}");
  const [configurationText, setConfigurationText] = useState("{\n  \"syncMode\": \"manual\"\n}");
  const [xeroSettings, setXeroSettings] = useState({
    provider: "xero",
    tenantId: "",
    contactId: "",
    brandingTheme: "",
    salesAccount: "",
    vatCode: "",
    itemCode: "",
    paymentTerms: "",
    invoiceDefaults: "",
  });

  const grouped = useMemo(() => {
    return integrations.reduce<Record<string, MerchantIntegrationView[]>>((acc, integration) => {
      const key = integration.category;
      if (!acc[key]) acc[key] = [];
      acc[key].push(integration);
      return acc;
    }, {});
  }, [integrations]);

  const loadIntegrations = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/merchant/integrations", {
        headers: await authHeaders(),
      });
      const payload = (await response.json()) as IntegrationsResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? `Failed to load integrations (${response.status})`);
      }

      setIntegrations(payload.integrations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load integrations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadIntegrations();
  }, [loadIntegrations]);

  useEffect(() => {
    const xero = integrations.find((integration) => integration.providerKey === "xero");
    if (!xero) return;

    const config = xero.configuration ?? {};
    setXeroSettings({
      provider: "xero",
      tenantId: typeof config.tenantId === "string" ? config.tenantId : "",
      contactId: typeof config.contactId === "string" ? config.contactId : "",
      brandingTheme: typeof config.brandingTheme === "string" ? config.brandingTheme : "",
      salesAccount: typeof config.salesAccount === "string" ? config.salesAccount : "",
      vatCode: typeof config.vatCode === "string" ? config.vatCode : "",
      itemCode: typeof config.itemCode === "string" ? config.itemCode : "",
      paymentTerms: typeof config.paymentTerms === "string" ? config.paymentTerms : "",
      invoiceDefaults:
        typeof config.invoiceDefaults === "string"
          ? config.invoiceDefaults
          : config.invoiceDefaults && typeof config.invoiceDefaults === "object"
            ? JSON.stringify(config.invoiceDefaults)
            : "",
    });
  }, [integrations]);

  function openConfiguration(integration: MerchantIntegrationView) {
    setEditingProviderKey(integration.providerKey);
    setCredentialsText("{\n  \"apiKey\": \"\"\n}");
    setConfigurationText(prettyJson(integration.configuration));
    setStatusMessage(null);
    setError(null);
  }

  async function connect(providerKey: string) {
    setBusyProviderKey(providerKey);
    setError(null);
    setStatusMessage(null);

    try {
      const credentials = JSON.parse(credentialsText) as unknown;
      const configuration = JSON.parse(configurationText) as unknown;
      const response = await fetch(`/api/merchant/integrations/${providerKey}/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ credentials, configuration }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to connect integration");
      }

      setStatusMessage("Provider connected");
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect integration");
    } finally {
      setBusyProviderKey(null);
    }
  }

  async function disconnect(providerKey: string) {
    setBusyProviderKey(providerKey);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/merchant/integrations/${providerKey}/disconnect`, {
        method: "POST",
        headers: await authHeaders(),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to disconnect integration");
      }

      setStatusMessage("Provider disconnected");
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect integration");
    } finally {
      setBusyProviderKey(null);
    }
  }

  async function test(providerKey: string) {
    setBusyProviderKey(providerKey);
    setError(null);
    setStatusMessage(null);

    try {
      const response = await fetch(`/api/merchant/integrations/${providerKey}/test`, {
        method: "POST",
        headers: await authHeaders(),
      });
      const payload = (await response.json()) as {
        error?: string;
        result?: { ok: boolean; message: string };
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Connection test failed");
      }

      setStatusMessage(payload.result?.message ?? "Connection test completed");
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection test failed");
    } finally {
      setBusyProviderKey(null);
    }
  }

  async function saveConfiguration(providerKey: string) {
    setBusyProviderKey(providerKey);
    setError(null);
    setStatusMessage(null);

    try {
      const configuration = JSON.parse(configurationText) as unknown;
      const response = await fetch(`/api/merchant/integrations/${providerKey}/configuration`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({ configuration }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save configuration");
      }

      setStatusMessage("Configuration saved");
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save configuration");
    } finally {
      setBusyProviderKey(null);
    }
  }

  async function saveXeroSettings() {
    setBusyProviderKey("xero");
    setError(null);
    setStatusMessage(null);

    try {
      let invoiceDefaults: Record<string, unknown> | string = xeroSettings.invoiceDefaults.trim();
      if (xeroSettings.invoiceDefaults.trim().startsWith("{")) {
        invoiceDefaults = JSON.parse(xeroSettings.invoiceDefaults);
      }

      const response = await fetch(`/api/merchant/integrations/xero/configuration`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(await authHeaders()),
        },
        body: JSON.stringify({
          configuration: {
            provider: "xero",
            tenantId: xeroSettings.tenantId.trim(),
            contactId: xeroSettings.contactId.trim(),
            brandingTheme: xeroSettings.brandingTheme.trim(),
            salesAccount: xeroSettings.salesAccount.trim(),
            vatCode: xeroSettings.vatCode.trim(),
            itemCode: xeroSettings.itemCode.trim(),
            paymentTerms: xeroSettings.paymentTerms.trim(),
            invoiceDefaults,
          },
        }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save Xero settings");
      }

      setStatusMessage("Xero settings saved");
      await loadIntegrations();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Xero settings");
    } finally {
      setBusyProviderKey(null);
    }
  }

  return (
    <section className="space-y-6 rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Connection Hub</p>
        <h1 className="text-3xl font-semibold text-slate-950">Integrate-it</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Integrate-it only handles external system connections. Once connected, providers are used automatically in
          Create it, Process it, Track it, and Account it.
        </p>
      </header>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-3">
        {[
          "Connect Xero",
          "Connect QuickFile",
          "Connect WooCommerce",
          "Connect Shopify",
          "Connect Stripe",
          "Connect Dispatch Provider",
          "Connect Resend",
          "Connect Twilio",
          "Future integrations",
        ].map((item) => (
          <div key={item} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
            {item}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <button
          onClick={() => void loadIntegrations()}
          className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-600 hover:border-slate-300"
        >
          Refresh
        </button>
      </div>

      {statusMessage ? <p className="text-sm text-green-700">{statusMessage}</p> : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      {loading ? <p className="text-sm text-slate-500">Loading integrations...</p> : null}

      {!loading ? (
        <div className="space-y-6">
          <article className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">Xero Accounting Settings</h2>
            <p className="mt-2 text-sm text-slate-600">
              Stored per merchant: Provider, Tenant ID, Contact ID, Branding Theme, Sales Account, VAT Code, Item Code, Payment Terms, Invoice Defaults.
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.provider} onChange={(event) => setXeroSettings((prev) => ({ ...prev, provider: event.target.value }))} placeholder="Provider" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.tenantId} onChange={(event) => setXeroSettings((prev) => ({ ...prev, tenantId: event.target.value }))} placeholder="Tenant ID" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.contactId} onChange={(event) => setXeroSettings((prev) => ({ ...prev, contactId: event.target.value }))} placeholder="Contact ID" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.brandingTheme} onChange={(event) => setXeroSettings((prev) => ({ ...prev, brandingTheme: event.target.value }))} placeholder="Branding Theme" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.salesAccount} onChange={(event) => setXeroSettings((prev) => ({ ...prev, salesAccount: event.target.value }))} placeholder="Sales Account" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.vatCode} onChange={(event) => setXeroSettings((prev) => ({ ...prev, vatCode: event.target.value }))} placeholder="VAT Code" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.itemCode} onChange={(event) => setXeroSettings((prev) => ({ ...prev, itemCode: event.target.value }))} placeholder="Item Code" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" value={xeroSettings.paymentTerms} onChange={(event) => setXeroSettings((prev) => ({ ...prev, paymentTerms: event.target.value }))} placeholder="Payment Terms (days)" />
              <input className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm md:col-span-2 xl:col-span-3" value={xeroSettings.invoiceDefaults} onChange={(event) => setXeroSettings((prev) => ({ ...prev, invoiceDefaults: event.target.value }))} placeholder='Invoice Defaults (text or JSON e.g. {"currency":"GBP"})' />
            </div>
            <button
              onClick={() => void saveXeroSettings()}
              disabled={busyProviderKey === "xero"}
              className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {busyProviderKey === "xero" ? "Saving..." : "Save Xero Settings"}
            </button>
          </article>

          {Object.entries(grouped).map(([category, items]) => (
            <article key={category} className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-500">
                {categoryLabels[category as IntegrationCategory] ?? category}
              </h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {items.map((integration) => {
                  const isBusy = busyProviderKey === integration.providerKey;
                  const isEditing = editingProviderKey === integration.providerKey;

                  return (
                    <div key={integration.providerKey} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">{integration.displayName}</h3>
                          <p className="text-xs text-slate-500">{integration.providerKey}</p>
                        </div>
                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                            integration.connected
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-600"
                          }`}
                        >
                          {integration.connected ? "Connected" : "Not Connected"}
                        </span>
                      </div>

                      <dl className="mt-3 space-y-1 text-xs text-slate-600">
                        <div className="flex justify-between gap-2">
                          <dt>Last Synchronised</dt>
                          <dd>{formatDate(integration.lastSynchronisedAt)}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Usage Metrics</dt>
                          <dd>{integration.connected ? "Active" : "Inactive"}</dd>
                        </div>
                        <div className="flex justify-between gap-2">
                          <dt>Last Error</dt>
                          <dd className="max-w-[58%] text-right">{integration.lastError ?? "None"}</dd>
                        </div>
                      </dl>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => openConfiguration(integration)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        >
                          Configuration
                        </button>
                        <button
                          disabled={isBusy}
                          onClick={() => void test(integration.providerKey)}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                        >
                          Test Connection
                        </button>
                        {integration.connected ? (
                          <button
                            disabled={isBusy}
                            onClick={() => void disconnect(integration.providerKey)}
                            className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-50"
                          >
                            Disconnect
                          </button>
                        ) : (
                          <button
                            disabled={isBusy || !isEditing}
                            onClick={() => void connect(integration.providerKey)}
                            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                          >
                            Connect
                          </button>
                        )}
                      </div>

                      {isEditing ? (
                        <div className="mt-4 space-y-2 rounded-xl border border-slate-200 bg-white p-3">
                          <label className="space-y-1 text-xs text-slate-600">
                            <span className="font-semibold">Credentials JSON</span>
                            <textarea
                              rows={5}
                              value={credentialsText}
                              onChange={(event) => setCredentialsText(event.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs"
                            />
                          </label>

                          <label className="space-y-1 text-xs text-slate-600">
                            <span className="font-semibold">Configuration JSON</span>
                            <textarea
                              rows={5}
                              value={configurationText}
                              onChange={(event) => setConfigurationText(event.target.value)}
                              className="w-full rounded-lg border border-slate-200 px-2 py-1.5 font-mono text-xs"
                            />
                          </label>

                          <div className="flex flex-wrap gap-2">
                            <button
                              disabled={isBusy}
                              onClick={() => void saveConfiguration(integration.providerKey)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-50"
                            >
                              Save Configuration
                            </button>
                            <button
                              onClick={() => setEditingProviderKey(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
