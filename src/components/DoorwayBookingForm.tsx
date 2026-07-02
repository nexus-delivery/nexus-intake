"use client";

import { useEffect, useMemo, useState } from "react";
import type { IntakeSourceSystem, StandardOrder } from "@/lib/intake/standardOrder";
import { createEmptyStandardOrder } from "@/lib/intake/standardOrder";
import { fetchCurrentProfile } from "@/lib/supabaseClient";
import type { CatalogueItem } from "@/lib/catalogue";
import SalesChannelField from "@/components/SalesChannelField";
import { resolveSalesChannel } from "@/lib/salesChannels";

type GoodsLine = {
  catalogueItemId: string;
  productCode: string;
  itemType: string;
  description: string;
  quantity: string;
  packages: string;
  weight: string;
  dimensions: string;
  unitPrice: string;
  vatRate: string;
  lineTotal: string;
  notes: string;
};

type PriceItLookup = {
  net: number;
  vatRate: number;
  total: number;
};

type RouteValidationPayload = {
  valid: boolean;
  collection: { latitude: string; longitude: string };
  delivery: { latitude: string; longitude: string };
  distanceKm: string;
  journeyMinutes: string;
  message?: string;
};

type Props = {
  sourceSystem: IntakeSourceSystem;
  modeLabel: string;
  intro: string;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20";

const sectionClass = "rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30";

function emptyGoodsLine(): GoodsLine {
  return {
    catalogueItemId: "",
    productCode: "",
    itemType: "product",
    description: "",
    quantity: "1",
    packages: "0",
    weight: "0",
    dimensions: "",
    unitPrice: "0",
    vatRate: "0",
    lineTotal: "0",
    notes: "",
  };
}

function toPositiveNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toMoney(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function buildLineTotal(quantity: string, unitPrice: string): number {
  return Number((toPositiveNumber(quantity) * toMoney(unitPrice)).toFixed(2));
}

function stripLeadingZerosInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const numeric = Number.parseFloat(trimmed);
  if (!Number.isFinite(numeric)) return trimmed;
  return String(numeric);
}

async function fetchPriceItCommercial(merchantId: string, catalogueItemId: string): Promise<PriceItLookup | null> {
  if (!merchantId || !catalogueItemId) return null;
  const response = await fetch(
    `/api/price-it/commercial?merchant_id=${encodeURIComponent(merchantId)}&catalogue_item_id=${encodeURIComponent(catalogueItemId)}`
  );
  const payload = (await response.json().catch(() => ({}))) as { item?: PriceItLookup };
  if (!response.ok || !payload.item) return null;
  return payload.item;
}

export default function DoorwayBookingForm({ sourceSystem, modeLabel, intro }: Props) {
  const [jobNumber, setJobNumber] = useState("");
  const [jobReference, setJobReference] = useState("");
  const [customer, setCustomer] = useState("");
  const [invoiceAddress, setInvoiceAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [invoiceContact, setInvoiceContact] = useState("");
  const [invoicePhone, setInvoicePhone] = useState("");
  const [invoiceEmail, setInvoiceEmail] = useState("");
  const [deliveryContact, setDeliveryContact] = useState("");
  const [deliveryPhone, setDeliveryPhone] = useState("");
  const [deliveryEmail, setDeliveryEmail] = useState("");
  const [collectionDate, setCollectionDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [collectionTime, setCollectionTime] = useState("");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [instructions, setInstructions] = useState("");
  const [twoMan, setTwoMan] = useState(false);
  const [tailLiftRequired, setTailLiftRequired] = useState(false);
  const [dedicatedVehicle, setDedicatedVehicle] = useState(false);
  const [northernIrelandDelivery, setNorthernIrelandDelivery] = useState(false);
  const [cardCollectionOnDelivery, setCardCollectionOnDelivery] = useState(false);
  const [goodsLines, setGoodsLines] = useState<GoodsLine[]>([emptyGoodsLine()]);
  const [merchantId, setMerchantId] = useState("");
  const [salesChannelId, setSalesChannelId] = useState("");
  const [salesChannelName, setSalesChannelName] = useState("");
  const [catalogueSuggestions, setCatalogueSuggestions] = useState<Record<number, CatalogueItem[]>>({});
  const [busy, setBusy] = useState(false);
  const [routeBusy, setRouteBusy] = useState(false);
  const [routeMessage, setRouteMessage] = useState("");
  const [collectionLatitude, setCollectionLatitude] = useState("");
  const [collectionLongitude, setCollectionLongitude] = useState("");
  const [deliveryLatitude, setDeliveryLatitude] = useState("");
  const [deliveryLongitude, setDeliveryLongitude] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [journeyMinutes, setJourneyMinutes] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const orderReference = useMemo(() => {
    const left = jobNumber.trim();
    const right = jobReference.trim();
    return left && right ? `${left} - ${right}` : left || right;
  }, [jobNumber, jobReference]);

  const canSubmit = useMemo(() => {
    return Boolean(
      invoiceContact.trim() &&
      deliveryContact.trim() &&
      invoiceAddress.trim() &&
      deliveryAddress.trim() &&
      orderReference.trim() &&
      salesChannelName.trim()
    );
  }, [deliveryAddress, deliveryContact, invoiceAddress, invoiceContact, orderReference, salesChannelName]);

  const commercialSummary = useMemo(() => {
    const net = goodsLines.reduce((sum, line) => sum + toMoney(line.lineTotal), 0);
    const vat = goodsLines.reduce((sum, line) => {
      const lineNet = toMoney(line.lineTotal);
      const lineVatRate = toMoney(line.vatRate);
      return sum + (lineNet * lineVatRate) / 100;
    }, 0);
    const total = net + vat;
    return {
      net: net.toFixed(2),
      vat: vat.toFixed(2),
      total: total.toFixed(2),
    };
  }, [goodsLines]);

  const updateGoodsLine = (index: number, next: Partial<GoodsLine>) => {
    setGoodsLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              ...next,
              lineTotal:
                next.quantity !== undefined || next.unitPrice !== undefined
                  ? buildLineTotal(next.quantity ?? line.quantity, next.unitPrice ?? line.unitPrice).toFixed(2)
                  : line.lineTotal,
            }
          : line
      )
    );
  };

  useEffect(() => {
    let cancelled = false;

    void fetchCurrentProfile().then((result) => {
      if (!cancelled && result.success) {
        setMerchantId(result.data.companyId);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!merchantId) return;

    const timer = window.setTimeout(() => {
      void Promise.all(
        goodsLines.map(async (line, index) => {
          if (line.description.trim().length < 2) {
            return { index, items: [] as CatalogueItem[] };
          }

          const response = await fetch(
            `/api/catalogue/items?merchant_id=${encodeURIComponent(merchantId)}&query=${encodeURIComponent(line.description)}`
          );
          const payload = (await response.json().catch(() => ({}))) as { items?: CatalogueItem[] };
          return { index, items: Array.isArray(payload.items) ? payload.items.slice(0, 5) : [] };
        })
      ).then((entries) => {
        if (entries.length === 0) return;
        setCatalogueSuggestions((current) => {
          const nextSuggestions: Record<number, CatalogueItem[]> = {};
          for (const entry of entries) {
            nextSuggestions[entry.index] = entry.items;
          }
          return { ...current, ...nextSuggestions };
        });
      });
    }, 250);

    return () => window.clearTimeout(timer);
  }, [goodsLines, merchantId]);

  const selectCatalogueItem = async (index: number, item: CatalogueItem) => {
    const priceItCommercial = await fetchPriceItCommercial(merchantId, item.id);
    const resolvedUnitPrice = priceItCommercial ? priceItCommercial.net : Number(item.default_price);
    const resolvedVatRate = priceItCommercial ? priceItCommercial.vatRate : Number(item.vat_rate);

    setGoodsLines((current) =>
      current.map((line, lineIndex) =>
        lineIndex === index
          ? {
              ...line,
              catalogueItemId: item.id,
              productCode: item.sku ?? "",
              itemType: item.item_type,
              description: item.name,
              unitPrice: resolvedUnitPrice.toFixed(2),
              vatRate: resolvedVatRate.toFixed(2),
              lineTotal: buildLineTotal(line.quantity, resolvedUnitPrice.toFixed(2)).toFixed(2),
            }
          : line
      )
    );
  };

  const validateRoute = async () => {
    if (!invoiceAddress.trim() || !deliveryAddress.trim()) {
      setRouteMessage("Enter both collection and delivery addresses before route validation.");
      return;
    }

    setRouteBusy(true);
    setRouteMessage("");

    const response = await fetch("/api/maps/route", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        collectionAddress: invoiceAddress,
        deliveryAddress,
      }),
    });

    const payload = (await response.json().catch(() => ({}))) as RouteValidationPayload;
    if (!response.ok || !payload.valid) {
      setRouteMessage(payload.message ?? "Unable to validate route.");
      setRouteBusy(false);
      return;
    }

    setCollectionLatitude(payload.collection.latitude);
    setCollectionLongitude(payload.collection.longitude);
    setDeliveryLatitude(payload.delivery.latitude);
    setDeliveryLongitude(payload.delivery.longitude);
    setDistanceKm(payload.distanceKm);
    setJourneyMinutes(payload.journeyMinutes);
    setRouteMessage(payload.message ?? "Route validated.");
    setRouteBusy(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus("error");
      setMessage("Enter the order reference, contact names, addresses and sales channel.");
      return;
    }

    setBusy(true);
    setStatus("idle");
    setMessage("");

    let resolvedSalesChannelId = salesChannelId;
    let resolvedSalesChannelName = salesChannelName.trim();

    if (merchantId && resolvedSalesChannelName) {
      const resolved = await resolveSalesChannel({
        companyId: merchantId,
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

    const standardOrder: StandardOrder = {
      ...createEmptyStandardOrder(sourceSystem),
      orderReference,
      merchant: "Doorway Group LTD",
      salesChannel: resolvedSalesChannelName,
      sourceSystem,
      customer,
      notes: instructions,
      collection: {
        company: customer,
        contact: invoiceContact,
        addressLine1: invoiceAddress,
        addressLine2: "",
        addressLine3: "",
        postcode: "",
        country: "UK",
        phone: invoicePhone,
        email: invoiceEmail,
        date: collectionDate,
        time: collectionTime,
        instructions,
        latitude: collectionLatitude,
        longitude: collectionLongitude,
      },
      delivery: {
        ...createEmptyStandardOrder(sourceSystem).delivery,
        company: customer,
        contact: deliveryContact,
        addressLine1: deliveryAddress,
        addressLine2: "",
        addressLine3: "",
        postcode: "",
        country: "UK",
        phone: deliveryPhone,
        email: deliveryEmail,
        date: deliveryDate,
        time: deliveryTime,
        instructions,
        latitude: deliveryLatitude,
        longitude: deliveryLongitude,
      },
      goods: goodsLines.map((line) => ({
        catalogueItemId: line.catalogueItemId,
        description: line.description.trim(),
        productCode: line.productCode.trim(),
        itemType: line.itemType,
        quantity: toPositiveNumber(line.quantity) || 1,
        packages: toPositiveNumber(line.packages),
        palletCount: 0,
        weightKg: toPositiveNumber(line.weight),
        dimensions: line.dimensions,
        unitPrice: toMoney(line.unitPrice),
        vatRate: toMoney(line.vatRate),
        lineTotal: toMoney(line.lineTotal),
        fragile: false,
        twoMan,
        roomOfChoice: false,
        assembly: false,
        photosRequired: false,
        tailLiftRequired,
        dedicatedVehicle,
        northernIrelandDelivery,
        sameDay: false,
      })),
      commercial: {
        ...createEmptyStandardOrder(sourceSystem).commercial,
        net: commercialSummary.net,
        vat: commercialSummary.vat,
        total: commercialSummary.total,
        cod: cardCollectionOnDelivery ? "Card Collection on Delivery" : "",
      },
      operations: {
        ...createEmptyStandardOrder(sourceSystem).operations,
        depot: "Doorway",
        warehouse: "",
        route: "",
        shipper: "Doorway Group LTD",
        serviceType: "Doorway Booking Form",
        readyForTrackPod: false,
        distanceKm,
        journeyMinutes,
      },
    };

    try {
      const response = await fetch("/api/intake/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order: standardOrder,
          merchant_id: merchantId || undefined,
          sales_channel_id: resolvedSalesChannelId || undefined,
          sales_channel_name: resolvedSalesChannelName,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as { success?: boolean; jobReference?: string; error?: string };
      if (!response.ok || !payload.success) {
        setStatus("error");
        setMessage(payload.error ?? "Unable to create booking.");
        setBusy(false);
        return;
      }

      setStatus("success");
      setMessage(`Booking created: ${payload.jobReference ?? orderReference}`);
      setJobNumber("");
      setJobReference("");
      setCustomer("");
      setInvoiceAddress("");
      setDeliveryAddress("");
      setInvoiceContact("");
      setInvoicePhone("");
      setInvoiceEmail("");
      setDeliveryContact("");
      setDeliveryPhone("");
      setDeliveryEmail("");
      setCollectionDate("");
      setDeliveryDate("");
      setCollectionTime("");
      setDeliveryTime("");
      setInstructions("");
      setTwoMan(false);
      setTailLiftRequired(false);
      setDedicatedVehicle(false);
      setNorthernIrelandDelivery(false);
      setCardCollectionOnDelivery(false);
      setCollectionLatitude("");
      setCollectionLongitude("");
      setDeliveryLatitude("");
      setDeliveryLongitude("");
      setDistanceKm("");
      setJourneyMinutes("");
      setRouteMessage("");
      setGoodsLines([emptyGoodsLine()]);
      setSalesChannelId("");
      setSalesChannelName("");
    } catch {
      setStatus("error");
      setMessage("Network error.");
    }

    setBusy(false);
  };

  return (
    <div className="space-y-6">
      <header className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/40">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Doorway demo</p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-950">Book It</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">{intro}</p>
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <div className="grid gap-2 sm:grid-cols-2">
            <p><span className="font-semibold">Merchant:</span> Doorway Group LTD</p>
            <p><span className="font-semibold">Depot:</span> Doorway</p>
            <p><span className="font-semibold">Source:</span> Nexus Booking Form</p>
            <p><span className="font-semibold">Sales Channel:</span> {salesChannelName || "Not selected"}</p>
            <p><span className="font-semibold">Mode:</span> {modeLabel}</p>
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Order</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div className="md:col-span-3">
              <SalesChannelField
                companyId={merchantId}
                value={salesChannelName}
                selectedId={salesChannelId}
                onChange={({ id, name }) => {
                  setSalesChannelId(id);
                  setSalesChannelName(name);
                }}
                helperText="Pick an existing channel or create a new company-specific source."
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Job Number</label>
              <input className={inputClass} value={jobNumber} onChange={(e) => setJobNumber(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Job Reference</label>
              <input className={inputClass} value={jobReference} onChange={(e) => setJobReference(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Order Reference</label>
              <input className={inputClass} value={orderReference} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label>
              <input className={inputClass} value={customer} onChange={(e) => setCustomer(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium text-slate-700">Instructions</label>
              <textarea className={inputClass} rows={3} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Invoice Address</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label>
              <textarea className={inputClass} rows={4} value={invoiceAddress} onChange={(e) => setInvoiceAddress(e.target.value)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Contact Name</label>
                <input className={inputClass} value={invoiceContact} onChange={(e) => setInvoiceContact(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Invoice Phone</label>
                <input className={inputClass} value={invoicePhone} onChange={(e) => setInvoicePhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Invoice Email</label>
                <input className={inputClass} value={invoiceEmail} onChange={(e) => setInvoiceEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Delivery Address</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Business / Organisation (optional)</label>
              <textarea className={inputClass} rows={4} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Contact Name</label>
                <input className={inputClass} value={deliveryContact} onChange={(e) => setDeliveryContact(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Delivery Phone</label>
                <input className={inputClass} value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Delivery Email</label>
                <input className={inputClass} value={deliveryEmail} onChange={(e) => setDeliveryEmail(e.target.value)} />
              </div>
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Dates</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Collection Date</label>
              <input type="date" className={inputClass} value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Collection Time</label>
              <input type="time" className={inputClass} value={collectionTime} onChange={(e) => setCollectionTime(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Delivery Date</label>
              <input type="date" className={inputClass} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Delivery Time</label>
              <input type="time" className={inputClass} value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
            </div>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Delivery Requirements</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={twoMan} onChange={(e) => setTwoMan(e.target.checked)} />
              Two-man
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={tailLiftRequired} onChange={(e) => setTailLiftRequired(e.target.checked)} />
              Tail-lift Required
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={dedicatedVehicle} onChange={(e) => setDedicatedVehicle(e.target.checked)} />
              Dedicated Vehicle
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
              <input type="checkbox" checked={northernIrelandDelivery} onChange={(e) => setNorthernIrelandDelivery(e.target.checked)} />
              Northern Ireland Delivery
            </label>
          </div>
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Google Maps Foundation</h2>
            <button
              type="button"
              onClick={() => {
                void validateRoute();
              }}
              disabled={routeBusy}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700 disabled:opacity-60"
            >
              {routeBusy ? "Validating..." : "Validate Route"}
            </button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <p className="text-sm text-slate-600">Collection Coordinates: {collectionLatitude || "-"}, {collectionLongitude || "-"}</p>
            <p className="text-sm text-slate-600">Delivery Coordinates: {deliveryLatitude || "-"}, {deliveryLongitude || "-"}</p>
            <p className="text-sm text-slate-600">Distance: {distanceKm || "-"} km</p>
            <p className="text-sm text-slate-600">Journey Time: {journeyMinutes || "-"} mins</p>
          </div>
          {routeMessage ? <p className="mt-3 text-sm text-slate-600">{routeMessage}</p> : null}
        </section>

        <section className={sectionClass}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-950">Goods Lines</h2>
            <button
              type="button"
              onClick={() => setGoodsLines((current) => [...current, emptyGoodsLine()])}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-700"
            >
              Add Line
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {goodsLines.map((line, index) => (
              <div key={`${index}-${line.description}`} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Goods Description</label>
                    <input className={inputClass} value={line.description} onChange={(e) => updateGoodsLine(index, { description: e.target.value, catalogueItemId: "" })} />
                    {catalogueSuggestions[index]?.length ? (
                      <div className="mt-2 space-y-2 rounded-xl border border-slate-200 bg-white p-2">
                        {catalogueSuggestions[index].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => selectCatalogueItem(index, item)}
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <div className="font-medium text-slate-900">{item.name}</div>
                            <div className="text-xs text-slate-500">
                              {item.sku ? `${item.sku} · ` : ""}{item.item_type} · £{Number(item.default_price).toFixed(2)}
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Product Code</label>
                    <input className={inputClass} value={line.productCode} onChange={(e) => updateGoodsLine(index, { productCode: e.target.value })} placeholder="Optional" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                    <input
                      className={inputClass}
                      value={line.quantity}
                      onChange={(e) => updateGoodsLine(index, { quantity: e.target.value })}
                      onBlur={(e) => updateGoodsLine(index, { quantity: stripLeadingZerosInput(e.target.value) || "0" })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Packages</label>
                    <input
                      className={inputClass}
                      value={line.packages}
                      onChange={(e) => updateGoodsLine(index, { packages: e.target.value })}
                      onBlur={(e) => updateGoodsLine(index, { packages: stripLeadingZerosInput(e.target.value) || "0" })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Weight</label>
                    <input
                      className={inputClass}
                      value={line.weight}
                      onChange={(e) => updateGoodsLine(index, { weight: e.target.value })}
                      onBlur={(e) => updateGoodsLine(index, { weight: stripLeadingZerosInput(e.target.value) || "0" })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Dimensions</label>
                    <input className={inputClass} value={line.dimensions} onChange={(e) => updateGoodsLine(index, { dimensions: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Unit Price</label>
                    <input
                      className={inputClass}
                      value={line.unitPrice}
                      onChange={(e) => updateGoodsLine(index, { unitPrice: e.target.value })}
                      onBlur={(e) => updateGoodsLine(index, { unitPrice: stripLeadingZerosInput(e.target.value) || "0" })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">VAT %</label>
                    <input
                      className={inputClass}
                      value={line.vatRate}
                      onChange={(e) => updateGoodsLine(index, { vatRate: e.target.value })}
                      onBlur={(e) => updateGoodsLine(index, { vatRate: stripLeadingZerosInput(e.target.value) || "0" })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Line Total</label>
                    <input className={inputClass} value={line.lineTotal} readOnly />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <input className={inputClass} value={line.notes} onChange={(e) => updateGoodsLine(index, { notes: e.target.value })} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-slate-500">Free text is allowed. When a line matches Catalogue it, you can pick it or let the booking learn it automatically.</p>
              </div>
            ))}
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Commercial</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium text-slate-700">Net</label>
              <input className={inputClass} value={commercialSummary.net} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">VAT</label>
              <input className={inputClass} value={commercialSummary.vat} readOnly />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Total</label>
              <input className={inputClass} value={commercialSummary.total} readOnly />
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
            <label className="flex items-center gap-2 font-semibold">
              <input
                type="checkbox"
                checked={cardCollectionOnDelivery}
                onChange={(e) => setCardCollectionOnDelivery(e.target.checked)}
              />
              Card Collection on Delivery
            </label>
            <p className="mt-2">NEXUS does not collect cash.</p>
            <p>Card payments only.</p>
            <p>A handling fee of 5% applies.</p>
            <p>The fee is deducted before settlement or charged via the merchant account.</p>
          </div>
        </section>

        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Booking</h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={busy}
              className="rounded-2xl bg-[#7C3AED] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
            >
              {busy ? "Creating Booking..." : "Create Booking"}
            </button>
            <p className="text-sm text-slate-600">Creates one standard order for Nexus intake.</p>
          </div>
          {message ? (
            <p className={`mt-3 text-sm ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>{message}</p>
          ) : null}
        </section>
      </form>
    </div>
  );
}
