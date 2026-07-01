"use client";

import { useMemo, useState } from "react";
import type { IntakeSourceSystem, StandardOrder } from "@/lib/intake/standardOrder";
import { createEmptyStandardOrder } from "@/lib/intake/standardOrder";

type GoodsLine = {
  productCode: string;
  description: string;
  quantity: string;
  packages: string;
  weight: string;
  dimensions: string;
  notes: string;
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
    productCode: "",
    description: "",
    quantity: "1",
    packages: "0",
    weight: "0",
    dimensions: "",
    notes: "",
  };
}

function toPositiveNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
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
  const [instructions, setInstructions] = useState("");
  const [goodsLines, setGoodsLines] = useState<GoodsLine[]>([emptyGoodsLine()]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const orderReference = useMemo(() => {
    const left = jobNumber.trim();
    const right = jobReference.trim();
    return left && right ? `${left} - ${right}` : left || right;
  }, [jobNumber, jobReference]);

  const canSubmit = useMemo(() => {
    return Boolean(customer.trim() && invoiceAddress.trim() && deliveryAddress.trim() && orderReference.trim());
  }, [customer, deliveryAddress, invoiceAddress, orderReference]);

  const updateGoodsLine = (index: number, next: Partial<GoodsLine>) => {
    setGoodsLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...next } : line)));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      setStatus("error");
      setMessage("Enter the order reference, customer, invoice address and delivery address.");
      return;
    }

    setBusy(true);
    setStatus("idle");
    setMessage("");

    const standardOrder: StandardOrder = {
      ...createEmptyStandardOrder(sourceSystem),
      orderReference,
      merchant: "Doorway Group LTD",
      salesChannel: modeLabel,
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
        time: "",
        instructions,
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
        time: "",
        instructions,
      },
      goods: goodsLines.map((line) => ({
        description: [line.productCode, line.description].filter(Boolean).join(" - "),
        quantity: toPositiveNumber(line.quantity) || 1,
        packages: toPositiveNumber(line.packages),
        palletCount: 0,
        weightKg: toPositiveNumber(line.weight),
        dimensions: line.dimensions,
        fragile: false,
        twoMan: false,
        roomOfChoice: false,
        assembly: false,
        photosRequired: false,
      })),
      operations: {
        ...createEmptyStandardOrder(sourceSystem).operations,
        depot: "Doorway",
        warehouse: "",
        route: "",
        shipper: "Doorway Group LTD",
        serviceType: "Doorway Booking Form",
        readyForTrackPod: false,
      },
    };

    try {
      const response = await fetch("/api/intake/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: standardOrder }),
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
      setInstructions("");
      setGoodsLines([emptyGoodsLine()]);
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
            <p><span className="font-semibold">Source:</span> NEXUS Booking Form</p>
            <p><span className="font-semibold">Sales Channel:</span> Doorway Booking Form</p>
          </div>
        </div>
      </header>

      <form onSubmit={submit} className="space-y-6">
        <section className={sectionClass}>
          <h2 className="text-lg font-semibold text-slate-950">Order</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
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
              <label className="text-sm font-medium text-slate-700">Customer</label>
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
              <label className="text-sm font-medium text-slate-700">Invoice Address</label>
              <textarea className={inputClass} rows={4} value={invoiceAddress} onChange={(e) => setInvoiceAddress(e.target.value)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Invoice Contact</label>
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
              <label className="text-sm font-medium text-slate-700">Delivery Address</label>
              <textarea className={inputClass} rows={4} value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} />
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Delivery Contact</label>
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
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-slate-700">Collection Date</label>
              <input type="date" className={inputClass} value={collectionDate} onChange={(e) => setCollectionDate(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Delivery Date</label>
              <input type="date" className={inputClass} value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
          </div>
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
                  <div>
                    <label className="text-sm font-medium text-slate-700">Product Code</label>
                    <input className={inputClass} value={line.productCode} onChange={(e) => updateGoodsLine(index, { productCode: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Description</label>
                    <input className={inputClass} value={line.description} onChange={(e) => updateGoodsLine(index, { description: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Quantity</label>
                    <input className={inputClass} value={line.quantity} onChange={(e) => updateGoodsLine(index, { quantity: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Packages</label>
                    <input className={inputClass} value={line.packages} onChange={(e) => updateGoodsLine(index, { packages: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-700">Weight</label>
                    <input className={inputClass} value={line.weight} onChange={(e) => updateGoodsLine(index, { weight: e.target.value })} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Dimensions</label>
                    <input className={inputClass} value={line.dimensions} onChange={(e) => updateGoodsLine(index, { dimensions: e.target.value })} />
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-slate-700">Notes</label>
                    <input className={inputClass} value={line.notes} onChange={(e) => updateGoodsLine(index, { notes: e.target.value })} />
                  </div>
                </div>
              </div>
            ))}
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
            <p className="text-sm text-slate-600">Creates one standard order for NEXUS intake.</p>
          </div>
          {message ? (
            <p className={`mt-3 text-sm ${status === "success" ? "text-emerald-700" : "text-red-700"}`}>{message}</p>
          ) : null}
        </section>
      </form>
    </div>
  );
}
