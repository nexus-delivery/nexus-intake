"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createEmptyStandardOrder,
  type IntakeSourceSystem,
  type StandardGoodsItem,
  type StandardOrder,
} from "@/lib/intake/standardOrder";
import { fetchCurrentProfile } from "@/lib/supabaseClient";
import { resolveSalesChannel } from "@/lib/salesChannels";
import SalesChannelField from "@/components/SalesChannelField";

type Props = {
  sourceSystem: IntakeSourceSystem;
  title: string;
  subtitle: string;
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20";

const sectionClass =
  "rounded-2xl border border-slate-200 bg-white p-5 sm:p-6";

function updateGoodsItem(items: StandardGoodsItem[], index: number, next: Partial<StandardGoodsItem>) {
  return items.map((item, itemIndex) => (itemIndex === index ? { ...item, ...next } : item));
}

export default function StandardOrderForm({ sourceSystem, title, subtitle }: Props) {
  const [order, setOrder] = useState<StandardOrder>(() => createEmptyStandardOrder(sourceSystem));
  const [profileCompanyId, setProfileCompanyId] = useState("");
  const [salesChannelId, setSalesChannelId] = useState("");
  const [salesChannelName, setSalesChannelName] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitMessage, setSubmitMessage] = useState("");

  const effectiveCompanyId = profileCompanyId;

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

  const canSubmit = useMemo(() => {
    return (
      order.collection.contact.trim().length > 0 &&
      order.collection.addressLine1.trim().length > 0 &&
      order.delivery.contact.trim().length > 0 &&
      order.delivery.addressLine1.trim().length > 0 &&
      order.goods.some((item) => item.description.trim().length > 0) &&
      salesChannelName.trim().length > 0
    );
  }, [order, salesChannelName]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setSubmitState("error");
      setSubmitMessage("Complete contact names, addresses, sales channel and at least one goods description.");
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
      if (resolvedSalesChannelName) {
        const resolved = await resolveSalesChannel({
          companyId: effectiveCompanyId,
          name: resolvedSalesChannelName,
          sourceType: sourceSystem,
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: { ...order, salesChannel: resolvedSalesChannelName },
          company_id: effectiveCompanyId,
          sales_channel_id: resolvedSalesChannelId || undefined,
          sales_channel_name: resolvedSalesChannelName,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
        jobReference?: string;
      };

      if (!response.ok || !payload.success) {
        setSubmitState("error");
        setSubmitMessage(payload.error ?? "Could not create order.");
        return;
      }

      setSubmitState("success");
      setSubmitMessage(`Order created: ${payload.jobReference ?? "reference pending"}`);
      setOrder(createEmptyStandardOrder(sourceSystem));
      setSalesChannelId("");
      setSalesChannelName("");
    } catch {
      setSubmitState("error");
      setSubmitMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-200 bg-white p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">NEXUS Intake</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="text-base font-semibold text-slate-900">Order</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="orderReference">Order Reference</label>
              <input id="orderReference" className={inputClass} value={order.orderReference} onChange={(e) => setOrder((prev) => ({ ...prev, orderReference: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="externalOrderId">External Order ID</label>
              <input id="externalOrderId" className={inputClass} value={order.externalOrderId} onChange={(e) => setOrder((prev) => ({ ...prev, externalOrderId: e.target.value }))} />
            </div>
            <div>
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
              <input id="customer" className={inputClass} value={order.customer} onChange={(e) => setOrder((prev) => ({ ...prev, customer: e.target.value }))} />
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
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label><input className={inputClass} value={order.collection.company} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, company: e.target.value } }))} placeholder="Optional" /></div>
            <div><label className="text-sm font-medium text-slate-700">Contact Name</label><input className={inputClass} value={order.collection.contact} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, contact: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Phone</label><input className={inputClass} value={order.collection.phone} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, phone: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 1</label><input className={inputClass} value={order.collection.addressLine1} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine1: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 2</label><input className={inputClass} value={order.collection.addressLine2} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine2: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Address Line 3</label><input className={inputClass} value={order.collection.addressLine3} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, addressLine3: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Postcode</label><input className={inputClass} value={order.collection.postcode} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, postcode: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Country</label><input className={inputClass} value={order.collection.country} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, country: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Email</label><input className={inputClass} value={order.collection.email} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, email: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Collection Date</label><input type="date" className={inputClass} value={order.collection.date} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, date: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Collection Time</label><input type="time" className={inputClass} value={order.collection.time} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, time: e.target.value } }))} /></div>
            <div className="sm:col-span-2 lg:col-span-3"><label className="text-sm font-medium text-slate-700">Instructions</label><textarea className={inputClass} rows={2} value={order.collection.instructions} onChange={(e) => setOrder((prev) => ({ ...prev, collection: { ...prev.collection, instructions: e.target.value } }))} /></div>
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
                    ["photosRequired", "Photos required"],
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
          <h2 className="text-base font-semibold text-slate-900">Commercial</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div><label className="text-sm font-medium text-slate-700">Purchase Order</label><input className={inputClass} value={order.commercial.purchaseOrder} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, purchaseOrder: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Net</label><input className={inputClass} value={order.commercial.net} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, net: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">VAT</label><input className={inputClass} value={order.commercial.vat} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, vat: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">Total</label><input className={inputClass} value={order.commercial.total} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, total: e.target.value } }))} /></div>
            <div><label className="text-sm font-medium text-slate-700">COD</label><input className={inputClass} value={order.commercial.cod} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, cod: e.target.value } }))} /></div>
            <label className="flex items-center gap-2 self-end text-sm text-slate-700"><input type="checkbox" checked={order.commercial.invoiceRequired} onChange={(e) => setOrder((prev) => ({ ...prev, commercial: { ...prev.commercial, invoiceRequired: e.target.checked } }))} />Invoice required</label>
          </div>
        </section>

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

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <button
            type="submit"
            disabled={submitState === "submitting"}
            className="rounded-xl bg-[#7C3AED] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {submitState === "submitting" ? "Creating Order..." : "Create Standard Order"}
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
