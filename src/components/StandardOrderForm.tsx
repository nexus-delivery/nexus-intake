"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createEmptyStandardOrder,
  type IntakeSourceSystem,
  type StandardGoodsItem,
  type StandardOrder,
} from "@/lib/intake/standardOrder";
import { fetchCurrentProfile, supabase } from "@/lib/supabaseClient";
import { resolveSalesChannel } from "@/lib/salesChannels";
import SalesChannelField from "@/components/SalesChannelField";
import {
  profileToStop,
  type CollectionMode,
  type DefaultCollectionProfile,
} from "@/lib/defaultCollectionProfiles";
import { applyCustomerDefaults } from "@/lib/customerBookingDefaults";
import type { MerchantCustomer } from "@/lib/merchantCustomers";
import {
  DELIVERY_RELEASE_WORKING_DAYS,
  evaluateFutureDeliveryHold,
} from "@/lib/orderLifecycle";

type Props = {
  sourceSystem: IntakeSourceSystem;
  title: string;
  subtitle: string;
  bookingVariant?: "standard" | "deliver" | "return" | "request";
};

type SubmitState = "idle" | "submitting" | "success" | "error";

type SavedBookingFormTemplate = {
  id: string;
  name: string;
  savedAt: string;
  customerId: string;
  salesChannelId: string;
  salesChannelName: string;
  collectionMode: CollectionMode;
  merchant: string;
  customer: string;
  collection: StandardOrder["collection"];
  delivery: StandardOrder["delivery"];
  notes: string;
  defaultService: string;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20";

const sectionClass =
  "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

function updateGoodsItem(items: StandardGoodsItem[], index: number, next: Partial<StandardGoodsItem>) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item));
}

const SAVED_BOOKING_FORMS_KEY = "nexus.saved.booking.forms.v1";

function createTemplateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateLabel(value: Date | null): string {
  if (!value) return "";
  return value.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function StandardOrderForm({ sourceSystem, title, subtitle, bookingVariant = "standard" }: Props) {
  const [order, setOrder] = useState<StandardOrder>(() => createEmptyStandardOrder(sourceSystem));
  const [profileCompanyId, setProfileCompanyId] = useState("");
  const [collectionMode, setCollectionMode] = useState<CollectionMode>(bookingVariant === "deliver" ? "depot" : "new_address");
  const [defaultCollectionProfile, setDefaultCollectionProfile] = useState<DefaultCollectionProfile | null>(null);
  const [collectionProfiles, setCollectionProfiles] = useState<DefaultCollectionProfile[]>([]);
  const [selectedCollectionProfileId, setSelectedCollectionProfileId] = useState("");
  const [salesChannelId, setSalesChannelId] = useState("");
  const [salesChannelName, setSalesChannelName] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customers, setCustomers] = useState<MerchantCustomer[]>([]);
  const [trackPodReleaseDecision, setTrackPodReleaseDecision] = useState<"send_now" | "hold_for_date">("send_now");
  const [adminOverrideRelease, setAdminOverrideRelease] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<SavedBookingFormTemplate[]>([]);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const effectiveCompanyId = profileCompanyId;
  const isMerchantView = sourceSystem === "merchant_portal";

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(SAVED_BOOKING_FORMS_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedBookingFormTemplate[];
      if (Array.isArray(parsed)) {
        setSavedTemplates(parsed);
      }
    } catch {
      // Ignore invalid persisted templates.
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SAVED_BOOKING_FORMS_KEY, JSON.stringify(savedTemplates));
  }, [savedTemplates]);

  useEffect(() => {
    let cancelled = false;

    void fetchCurrentProfile().then((result) => {
      if (!cancelled && result.success) {
        setProfileCompanyId(result.data.companyId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCustomers() {
      if (!isMerchantView || !supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/merchant/customers", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;

      const payload = (await response.json().catch(() => ({}))) as {
        customers?: MerchantCustomer[];
      };

      if (!cancelled) {
        setCustomers(payload.customers ?? []);
      }
    }

    void loadCustomers();

    return () => {
      cancelled = true;
    };
  }, [isMerchantView]);

  useEffect(() => {
    let cancelled = false;

    async function loadDefaultCollectionProfile() {
      if (!supabase) return;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) return;

      const response = await fetch("/api/reference/default-collection-profile", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) return;
      const payload = (await response.json().catch(() => ({}))) as {
        profile?: DefaultCollectionProfile | null;
        profiles?: DefaultCollectionProfile[];
        suggestedDepotMode?: boolean;
      };

      if (cancelled) return;

      if (payload.profile) {
        const profiles = payload.profiles ?? [payload.profile];
        const preferredProfile = profiles.find((profile) => profile.isDefault) ?? payload.profile;
        setCollectionProfiles(profiles);
        setDefaultCollectionProfile(preferredProfile);
        setSelectedCollectionProfileId(preferredProfile.id);
        if (payload.suggestedDepotMode || bookingVariant === "deliver") {
          setCollectionMode("depot");
          setOrder((prev) => ({
            ...prev,
            collectionMode: "depot",
            collection: {
              ...prev.collection,
              ...profileToStop(preferredProfile),
            },
          }));
        }
        if (bookingVariant === "return") {
          setOrder((prev) => ({
            ...prev,
            delivery: {
              ...prev.delivery,
              ...profileToStop(preferredProfile),
            },
          }));
        }
      }
    }

    void loadDefaultCollectionProfile();

    return () => {
      cancelled = true;
    };
  }, [bookingVariant]);

  const activeCollectionProfile =
    collectionProfiles.find((profile) => profile.id === selectedCollectionProfileId) ??
    defaultCollectionProfile;

  const canSubmit = useMemo(() => {
    const hasCollection =
      (bookingVariant === "deliver" || collectionMode === "depot")
        ? Boolean(
            activeCollectionProfile?.addressLine1.trim() &&
            activeCollectionProfile?.postcode.trim()
          )
        : order.collection.addressLine1.trim().length > 0;

    const hasDelivery =
      bookingVariant === "return"
        ? Boolean(
            activeCollectionProfile?.addressLine1.trim() &&
            activeCollectionProfile?.postcode.trim()
          )
        : order.delivery.addressLine1.trim().length > 0;

    return (
      hasCollection &&
      hasDelivery &&
      order.goods.some((item) => item.description.trim().length > 0)
    );
  }, [activeCollectionProfile, bookingVariant, collectionMode, order]);

  const resolvedCollection =
    (bookingVariant === "deliver" || collectionMode === "depot") && activeCollectionProfile
      ? {
          ...order.collection,
          ...profileToStop(activeCollectionProfile),
        }
      : order.collection;

  const resolvedDelivery =
    bookingVariant === "return" && activeCollectionProfile
      ? {
          ...order.delivery,
          ...profileToStop(activeCollectionProfile),
        }
      : order.delivery;

  const holdEvaluation = useMemo(
    () => evaluateFutureDeliveryHold(resolvedDelivery.date),
    [resolvedDelivery.date]
  );
  const hasFutureDateWarning = holdEvaluation.shouldHoldDelivery;
  const holdReleaseDate = holdEvaluation.autoReleaseDate;

  const getAuthHeaders = async () => {
    if (!supabase) {
      return {} as Record<string, string>;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      return {} as Record<string, string>;
    }

    return { Authorization: `Bearer ${session.access_token}` };
  };

  const saveCurrentAsTemplate = () => {
    const normalizedName = templateName.trim();
    if (!normalizedName) {
      setSubmitState("error");
      setSubmitMessage("Enter a template name before saving the booking form.");
      return;
    }

    const template: SavedBookingFormTemplate = {
      id: createTemplateId(),
      name: normalizedName,
      savedAt: new Date().toISOString(),
      customerId,
      salesChannelId,
      salesChannelName,
      collectionMode,
      merchant: order.merchant,
      customer: order.customer,
      collection: { ...order.collection },
      delivery: { ...order.delivery },
      notes: order.notes,
      defaultService: order.operations.serviceType,
    };

    setSavedTemplates((current) => [template, ...current].slice(0, 25));
    setTemplateName("");
    setSubmitState("success");
    setSubmitMessage(`Saved reusable booking form: ${template.name}.`);
  };

  const applyTemplate = (template: SavedBookingFormTemplate) => {
    setCustomerId(template.customerId);
    setSalesChannelId(template.salesChannelId);
    setSalesChannelName(template.salesChannelName);
    setCollectionMode(template.collectionMode);
    setOrder((prev) => ({
      ...prev,
      merchant: template.merchant,
      customer: template.customer,
      notes: template.notes,
      collectionMode: template.collectionMode,
      collection: { ...prev.collection, ...template.collection },
      delivery: { ...prev.delivery, ...template.delivery },
      operations: {
        ...prev.operations,
        serviceType: template.defaultService,
      },
    }));
    setSubmitState("success");
    setSubmitMessage(`Loaded reusable booking form: ${template.name}. Enter Order Number, Job Reference, External ID, and Goods for this run.`);
  };

  const deleteTemplate = (templateId: string) => {
    setSavedTemplates((current) => current.filter((item) => item.id !== templateId));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitState("error");
      setSubmitMessage("Complete collection and delivery addresses, and at least one goods description.");
      return;
    }

    setSubmitState("submitting");
    setSubmitMessage("");

    let resolvedSalesChannelId = salesChannelId;
    let resolvedSalesChannelName = salesChannelName.trim();

    if (!effectiveCompanyId) {
      setSubmitState("error");
      setSubmitMessage("No merchant profile found. Sign in and complete onboarding to create a company profile.");
      return;
    }

    try {
      const authHeaders = await getAuthHeaders();

      if (resolvedSalesChannelName) {
        const resolved = await resolveSalesChannel({
          companyId: effectiveCompanyId,
          name: resolvedSalesChannelName,
          authHeaders,
        });
        if (resolved) {
          resolvedSalesChannelId = resolved.id;
          resolvedSalesChannelName = resolved.name;
          setSalesChannelId(resolved.id);
          setSalesChannelName(resolved.name);
        }
      }

      const response = await fetch("/api/intake/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders },
        body: JSON.stringify({
          order: {
            ...order,
            collectionMode,
            collection: resolvedCollection,
            delivery: resolvedDelivery,
            salesChannel: resolvedSalesChannelName,
            operations: {
              ...order.operations,
              readyForTrackPod:
                trackPodReleaseDecision === "send_now" &&
                (!hasFutureDateWarning || adminOverrideRelease),
              adminReleaseOverride: adminOverrideRelease,
            },
          },
          company_id: effectiveCompanyId,
          customer_id: customerId || null,
          sales_channel_id: resolvedSalesChannelId || null,
          sales_channel_name: resolvedSalesChannelName || null,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        jobReference?: string;
        lifecycleStatus?: string;
      };

      if (!response.ok || !payload.success) {
        setSubmitState("error");
        setSubmitMessage(payload.error ?? "Could not create order.");
        return;
      }

      const ref = payload.jobReference ?? "reference pending";
      const status = payload.lifecycleStatus === "READY_FOR_TRACKPOD"
        ? " — ready for operations"
        : payload.lifecycleStatus === "HELD_FUTURE_DATE"
          ? " — HELD - FUTURE DATE"
          : " — held for operational review";
      const reminder = hasFutureDateWarning && trackPodReleaseDecision === "hold_for_date"
        ? ` Reminder scheduled for ${formatDateLabel(holdReleaseDate)} when the order is within ${DELIVERY_RELEASE_WORKING_DAYS} working days.`
        : "";
      setSubmitState("success");
      setSubmitMessage(`Order created: ${ref}${status}.${reminder}`.trim());
      const empty = createEmptyStandardOrder(sourceSystem);
      setOrder(
        (bookingVariant === "deliver" || collectionMode === "depot") && activeCollectionProfile
          ? {
              ...empty,
              collectionMode: "depot",
              collection: {
                ...empty.collection,
                ...profileToStop(activeCollectionProfile),
              },
            }
          : bookingVariant === "return" && activeCollectionProfile
            ? {
                ...empty,
                delivery: {
                  ...empty.delivery,
                  ...profileToStop(activeCollectionProfile),
                },
              }
            : empty
      );
      setCustomerId("");
      setSalesChannelId("");
      setSalesChannelName("");
      setTrackPodReleaseDecision("send_now");
      setAdminOverrideRelease(false);
    } catch (error) {
      setSubmitState("error");
      setSubmitMessage(error instanceof Error ? error.message : "Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Nexus Intake</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Saved Booking Forms</h2>
          <p className="mt-2 text-sm text-slate-600">
            Save reusable defaults for merchant, customer, addresses, contacts, telephone, email, instructions, and service profile.
            For each new order, always set Order Number, Job Reference, External ID, and Goods/Items.
          </p>
          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
            <input
              className={inputClass}
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
              placeholder="Template name e.g. London Retail Daily"
            />
            <button
              type="button"
              onClick={saveCurrentAsTemplate}
              className="self-end rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Save Form
            </button>
          </div>
          {savedTemplates.length > 0 ? (
            <div className="mt-4 grid gap-2 lg:grid-cols-2">
              {savedTemplates.map((template) => (
                <div key={template.id} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                  <p className="text-sm font-semibold text-slate-900">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">Saved {new Date(template.savedAt).toLocaleString()}</p>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => applyTemplate(template)}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700"
                    >
                      Use
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteTemplate(template.id)}
                      className="rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Booking Mode</h2>
          <p className="mt-2 text-sm text-slate-600">
            {bookingVariant === "deliver"
              ? "Deliver it uses your saved depot profile for collection."
              : bookingVariant === "return"
                ? "Return it uses your saved depot profile for delivery."
                : bookingVariant === "request"
                  ? "Request it is fully manual for unusual jobs and exceptions."
                  : "Choose whether this booking collects from your saved depot profile or a one-off address."}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              disabled={bookingVariant !== "standard"}
              onClick={() => {
                setCollectionMode("depot");
                if (activeCollectionProfile) {
                  setOrder((prev) => ({
                    ...prev,
                    collectionMode: "depot",
                    collection: {
                      ...prev.collection,
                      ...profileToStop(activeCollectionProfile),
                    },
                  }));
                }
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                collectionMode === "depot"
                  ? "border-[#7C3AED] bg-violet-50 text-violet-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="font-semibold">Book it from Depot</p>
              <p className="mt-1 text-xs opacity-80">
                Uses saved collection profile and ignores OCR/manual collection replacement.
              </p>
            </button>
            <button
              type="button"
              disabled={bookingVariant !== "standard"}
              onClick={() => {
                setCollectionMode("new_address");
                setOrder((prev) => ({ ...prev, collectionMode: "new_address" }));
              }}
              className={`rounded-xl border px-4 py-3 text-left text-sm ${
                collectionMode === "new_address"
                  ? "border-[#7C3AED] bg-violet-50 text-violet-800"
                  : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="font-semibold">Book it from New Address</p>
              <p className="mt-1 text-xs opacity-80">
                Enter collection details manually for supplier collections, returns, and one-offs.
              </p>
            </button>
          </div>

          {collectionMode === "depot" ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {activeCollectionProfile ? (
                <>
                  {collectionProfiles.length > 1 ? (
                    <>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor="collectionProfileSelect">
                        Collection Profile
                      </label>
                      <select
                        id="collectionProfileSelect"
                        className="mb-3 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                        value={selectedCollectionProfileId}
                        onChange={(event) => {
                          const nextProfileId = event.target.value;
                          setSelectedCollectionProfileId(nextProfileId);
                          const nextProfile = collectionProfiles.find((profile) => profile.id === nextProfileId);
                          if (!nextProfile) return;
                          setOrder((prev) => ({
                            ...prev,
                            collection: {
                              ...prev.collection,
                              ...profileToStop(nextProfile),
                            },
                            delivery:
                              bookingVariant === "return"
                                ? {
                                    ...prev.delivery,
                                    ...profileToStop(nextProfile),
                                  }
                                : prev.delivery,
                          }));
                        }}
                      >
                        {collectionProfiles.map((profile) => (
                          <option key={profile.id} value={profile.id}>
                            {profile.profileName || "Collection profile"}
                            {profile.isDefault ? " (Default)" : ""}
                          </option>
                        ))}
                      </select>
                    </>
                  ) : null}
                  <p className="font-semibold text-slate-900">Saved depot profile</p>
                  <p className="mt-1">{activeCollectionProfile.companyName || "-"}</p>
                  <p>{activeCollectionProfile.addressLine1 || "-"}</p>
                  <p>
                    {[activeCollectionProfile.addressLine2, activeCollectionProfile.addressLine3, activeCollectionProfile.postcode]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-700">No default collection profile saved</p>
                  <p className="mt-1 text-red-600">
                    Save a default depot in Account It before using Depot mode.
                  </p>
                </>
              )}
            </div>
          ) : null}
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Order</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {isMerchantView ? (
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="text-sm font-medium text-slate-700" htmlFor="customerSelect">Select Customer</label>
                <select
                  id="customerSelect"
                  className={inputClass}
                  value={customerId}
                  onChange={(event) => {
                    const nextId = event.target.value;
                    setCustomerId(nextId);
                    const selected = customers.find((customer) => customer.id === nextId);
                    if (!selected) return;
                    setOrder((prev) => applyCustomerDefaults(prev, selected));
                  }}
                >
                  <option value="">Select customer...</option>
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerName} {customer.company ? `(${customer.company})` : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Selecting a customer auto-populates defaults for collection, delivery, instructions, and service profile.
                </p>
              </div>
            ) : null}
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="orderReference">Order Reference</label>
              <input id="orderReference" className={inputClass} value={order.orderReference} onChange={(e) => setOrder((prev) => ({ ...prev, orderReference: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="externalOrderId">External Order ID</label>
              <input id="externalOrderId" className={inputClass} value={order.externalOrderId} onChange={(e) => setOrder((prev) => ({ ...prev, externalOrderId: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-1">
              <SalesChannelField
                companyId={effectiveCompanyId}
                value={salesChannelName}
                selectedId={salesChannelId}
                onChange={({ id, name }) => {
                  setSalesChannelId(id);
                  setSalesChannelName(name);
                  setOrder((prev) => ({ ...prev, salesChannel: name }));
                }}
                helperText="Pick an existing source or create a new company-specific sales channel."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="merchant">Business / Organisation (optional)</label>
              <input id="merchant" className={inputClass} value={order.merchant} onChange={(e) => setOrder((prev) => ({ ...prev, merchant: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="customer">Contact Name</label>
              <input id="customer" className={inputClass} value={order.customer} onChange={(e) => setOrder((prev) => ({ ...prev, customer: e.target.value }))} placeholder="Optional" />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="priority">Priority</label>
              <select id="priority" className={inputClass} value={order.priority} onChange={(e) => setOrder((prev) => ({ ...prev, priority: e.target.value as StandardOrder["priority"] }))}>
                <option>Low</option>
                <option>Normal</option>
                <option>High</option>
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <label className="text-sm font-medium text-slate-700" htmlFor="orderNotes">Notes</label>
              <textarea id="orderNotes" className={inputClass} rows={3} value={order.notes} onChange={(e) => setOrder((prev) => ({ ...prev, notes: e.target.value }))} />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Collection</h2>
          {collectionMode === "depot" ? (
            <p className="mt-2 text-sm text-slate-600">
              Collection details are locked to your default depot profile for this booking.
            </p>
          ) : null}
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.company} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, company: e.target.value } }))} placeholder="Optional" /></div>
            <div><label className="text-sm font-medium text-slate-700">Contact Name</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.contact} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, contact: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Phone</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.phone} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, phone: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 1</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.addressLine1} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine1: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 2</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.addressLine2} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine2: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 3</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.addressLine3} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine3: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Postcode</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.postcode} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, postcode: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Country</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.country} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, country: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Email</label><input disabled={collectionMode === "depot"} className={inputClass} value={order.collection.email} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, email: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Collection Date</label><input type="date" className={inputClass} value={order.collection.date} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, date: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Collection Time</label><input type="time" className={inputClass} value={order.collection.time} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, time: e.target.value } }))} /></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-sm font-medium text-slate-700">Instructions</label><textarea disabled={collectionMode === "depot"} className={inputClass} rows={2} value={order.collection.instructions} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, instructions: e.target.value } }))} /></div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Delivery</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label><input className={inputClass} value={order.delivery.company} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, company: e.target.value } }))} placeholder="Optional" /></div>
            <div><label className="text-sm font-medium text-slate-700">Contact Name</label><input className={inputClass} value={order.delivery.contact} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, contact: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Phone</label><input className={inputClass} value={order.delivery.phone} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, phone: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 1</label><input className={inputClass} value={order.delivery.addressLine1} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, addressLine1: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 2</label><input className={inputClass} value={order.delivery.addressLine2} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, addressLine2: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 3</label><input className={inputClass} value={order.delivery.addressLine3} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, addressLine3: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Postcode</label><input className={inputClass} value={order.delivery.postcode} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, postcode: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Country</label><input className={inputClass} value={order.delivery.country} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, country: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Email</label><input className={inputClass} value={order.delivery.email} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, email: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Delivery Date</label><input type="date" className={inputClass} value={order.delivery.date} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, date: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Delivery Time</label><input type="time" className={inputClass} value={order.delivery.time} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, time: e.target.value } }))} /></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-sm font-medium text-slate-700">Instructions</label><textarea className={inputClass} rows={2} value={order.delivery.instructions} onChange={(e) => setOrder((prev) => ({ ...prev, delivery: { ...prev.delivery, instructions: e.target.value } }))} /></div>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Goods</h2>
            <button
              type="button"
              onClick={() =>
                setOrder((prev) => ({
                  ...prev,
                  goods: [
                    ...prev.goods,
                    {
                      description: "",
                        productCode: "",
                        catalogueItemId: "",
                        itemType: "product",
                        quantity: 1,
                        packages: 0,
                        palletCount: 0,
                        weightKg: 0,
                        dimensions: "",
                        unitPrice: 0,
                        vatRate: 0,
                        lineTotal: 0,
                      fragile: false,
                      twoMan: false,
                      roomOfChoice: false,
                      assembly: false,
                      photosRequired: false,
                        tailLiftRequired: false,
                        dedicatedVehicle: false,
                        northernIrelandDelivery: false,
                        sameDay: false,
                    },
                  ],
                }))
              }
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700"
            >
              Add Item
            </button>
          </div>

          <div className="mt-4 space-y-4">
            {order.goods.map((item, index) => (
              <div key={`goods-${index}`} className="rounded-xl border border-slate-200 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2 lg:col-span-4"><label className="text-sm font-medium text-slate-700">Description</label><input className={inputClass} value={item.description} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { description: e.target.value }) }))} /></div>
                  <div><label className="text-sm font-medium text-slate-700">Quantity</label><input type="number" className={inputClass} value={item.quantity} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { quantity: Number.parseFloat(e.target.value) || 0 }) }))} /></div>
                  <div><label className="text-sm font-medium text-slate-700">Packages</label><input type="number" className={inputClass} value={item.packages} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { packages: Number.parseFloat(e.target.value) || 0 }) }))} /></div>
                  <div><label className="text-sm font-medium text-slate-700">Pallet Count</label><input type="number" className={inputClass} value={item.palletCount} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { palletCount: Number.parseFloat(e.target.value) || 0 }) }))} /></div>
                  <div><label className="text-sm font-medium text-slate-700">Weight (kg)</label><input type="number" className={inputClass} value={item.weightKg} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { weightKg: Number.parseFloat(e.target.value) || 0 }) }))} /></div>
                  <div className="sm:col-span-2 lg:col-span-4"><label className="text-sm font-medium text-slate-700">Dimensions</label><input className={inputClass} value={item.dimensions} onChange={(e) => setOrder((prev) => ({ ...prev, goods: updateGoodsItem(prev.goods, index, { dimensions: e.target.value }) }))} placeholder="e.g. 120 x 80 x 75 cm" /></div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ["fragile", "Fragile"],
                    ["twoMan", "Two-man"],
                    ["roomOfChoice", "Room of choice"],
                    ["assembly", "Assembly"],
                    ["tailLiftRequired", "Tail-lift required"],
                    ["dedicatedVehicle", "Dedicated van"],
                    ["sameDay", "Same day"],
                  ].map(([key, label]) => (
                    <label key={`${index}-${key}`} className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={Boolean(item[key as keyof StandardGoodsItem])}
                        onChange={(e) =>
                          setOrder((prev) => ({
                            ...prev,
                            goods: updateGoodsItem(prev.goods, index, { [key]: e.target.checked }),
                          }))
                        }
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Track-POD Release Check</h2>
          {hasFutureDateWarning ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-semibold">
                Delivery date is more than {DELIVERY_RELEASE_WORKING_DAYS} working days away. Delivery release is held.
              </p>
              <p className="mt-1">
                Planned release date: {formatDateLabel(holdReleaseDate)}. A release reminder should be scheduled and the order should auto-release once it is inside the allowed window.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              No future-date hold detected. Collection can be released immediately, and delivery can be released after collection confirmation.
            </p>
          )}
          {!isMerchantView ? (
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={adminOverrideRelease}
                onChange={(event) => setAdminOverrideRelease(event.target.checked)}
              />
              Admin override: allow delivery release despite hold checks.
            </label>
          ) : null}
          <fieldset className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="flex items-start gap-2">
                <input
                  type="radio"
                  name="trackpod_release"
                  checked={trackPodReleaseDecision === "send_now"}
                  onChange={() => setTrackPodReleaseDecision("send_now")}
                  disabled={hasFutureDateWarning && !adminOverrideRelease}
                />
                <span>
                  <span className="font-semibold text-slate-900">Ready to send to Track-POD now</span>
                  <span className="mt-1 block text-xs text-slate-500">Use when date checks are complete and operations can proceed immediately.</span>
                </span>
              </span>
            </label>
            <label className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <span className="flex items-start gap-2">
                <input
                  type="radio"
                  name="trackpod_release"
                  checked={trackPodReleaseDecision === "hold_for_date"}
                  onChange={() => setTrackPodReleaseDecision("hold_for_date")}
                />
                <span>
                  <span className="font-semibold text-slate-900">Hold for date-related warning</span>
                  <span className="mt-1 block text-xs text-slate-500">Keeps the order in review until the planned release window.</span>
                </span>
              </span>
            </label>
          </fieldset>
          {hasFutureDateWarning && !adminOverrideRelease ? (
            <p className="mt-3 text-xs font-semibold text-amber-700">
              Delivery release is locked until the auto-release window opens or an admin override is applied.
            </p>
          ) : null}
        </section>

        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Commercial</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-sm font-medium text-slate-700">Purchase Order</label><input className={inputClass} value={order.commercial.purchaseOrder} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, purchaseOrder: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Net</label><input className={inputClass} value={order.commercial.net} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, net: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">VAT</label><input className={inputClass} value={order.commercial.vat} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, vat: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Total</label><input className={inputClass} value={order.commercial.total} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, total: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Card Collection on Delivery</label><input className={inputClass} value={order.commercial.cod} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, cod: e.target.value } }))} /></div>
            <label className="flex items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" checked={order.commercial.invoiceRequired} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, invoiceRequired: e.target.checked } }))} />Invoice required</label>
          </div>
        </section>

        {!isMerchantView ? (
          <section className={sectionClass}>
            <h2 className="text-base font-semibold text-slate-900">Operations</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div><label className="text-sm font-medium text-slate-700">Depot</label><input className={inputClass} value={order.operations.depot} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, depot: e.target.value } }))} /></div>
              <div><label className="text-sm font-medium text-slate-700">Warehouse</label><input className={inputClass} value={order.operations.warehouse} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, warehouse: e.target.value } }))} /></div>
              <div><label className="text-sm font-medium text-slate-700">Route</label><input className={inputClass} value={order.operations.route} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, route: e.target.value } }))} /></div>
              <div><label className="text-sm font-medium text-slate-700">Shipper</label><input className={inputClass} value={order.operations.shipper} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, shipper: e.target.value } }))} /></div>
              <div><label className="text-sm font-medium text-slate-700">Service Type</label><input className={inputClass} value={order.operations.serviceType} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, serviceType: e.target.value } }))} /></div>
              <label className="flex items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" checked={order.operations.readyForTrackPod} onChange={(e) => setOrder((prev) => ({ ...prev, operations: { ...prev.operations, readyForTrackPod: e.target.checked } }))} />Ready for Track-POD</label>
            </div>
          </section>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <button
            type="submit"
            disabled={submitState === "submitting"}
            className="rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitState === "submitting" ? "Creating..." : "Create it"}
          </button>

          {submitMessage && (
            <p className={`mt-3 text-sm ${submitState === "success" ? "text-emerald-700" : "text-red-700"}`}>
              {submitMessage}
            </p>
          )}
        </div>
      </form>
    </div>
  );
}
