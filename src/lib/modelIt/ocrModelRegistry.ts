import type { UploadedDocumentMetadata } from "@/lib/supabaseClient";
import type { OcrReviewData, PriorityLevel, SupportedDocumentType } from "@/lib/modelIt/ocrSchema";

export type OcrModelArtifact = {
  modelKey: string;
  modelName: string;
  workspaceKey: string;
  merchantKey: string;
  customerKey: string | null;
  documentType: SupportedDocumentType;
  version: number;
  readinessStatus: "active" | "awaiting_sample";
};

export type OcrModelContext = {
  metadata: UploadedDocumentMetadata;
  rawText: string;
  documentType: SupportedDocumentType;
};

type OcrModelDefinition = {
  artifact: OcrModelArtifact;
  matchScore: (context: OcrModelContext) => number;
  parse: (context: OcrModelContext) => OcrReviewData;
};

export const BLB_PRODUCTION_MODEL_TAG = "model-it-document-model-v1";
export const BLB_PRODUCTION_FREEZE = {
  modelKey: "merchant.blb_home_group.purchase_order.v1",
  version: 1,
  tag: BLB_PRODUCTION_MODEL_TAG,
  frozenOn: "2026-07-01",
} as const;

export type OcrModelSelection = {
  model: OcrModelArtifact;
  confidence: "high" | "medium" | "low";
};

function normalizeCurrency(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) return "";
  return `£${amount.toFixed(2)}`;
}

function normalizeDate(value: string | null | undefined): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return trimmed;

  const dmyMatch = trimmed.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, "0");
    const month = dmyMatch[2].padStart(2, "0");
    const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  return "";
}

function normalizePhone(value: string | null | undefined): string {
  if (!value) return "";
  return value.replace(/[^0-9+]/g, "");
}

function toPercent(value: number): string {
  return `${value.toFixed(value % 1 === 0 ? 0 : 2)}%`;
}

function inferVatRate(netAmount: string, vatAmount: string): string {
  const net = Number.parseFloat(netAmount.replace(/[^0-9.-]/g, ""));
  const vat = Number.parseFloat(vatAmount.replace(/[^0-9.-]/g, ""));
  if (!Number.isFinite(net) || !Number.isFinite(vat) || net <= 0) {
    return "";
  }
  return toPercent((vat / net) * 100);
}

function pickFirst(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return "";
}

function normalizeLabelKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatCompressedValue(value: string): string {
  if (!value) return "";

  const expanded = value
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .replace(/([a-z])(to|of|and|for|at|in)([A-Z])/g, "$1 $2 $3")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return expanded.replace(
    /\b([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})\b/g,
    "$1 $2"
  );
}

function lineLooksLikeLabel(line: string): boolean {
  const trimmed = line.trim();
  if (/^[A-Za-z][A-Za-z0-9 /&()\-]{1,40}\s*[:\-]\s*/.test(trimmed)) {
    return true;
  }
  const compact = normalizeLabelKey(trimmed);
  const knownLabelStarts = [
    "orderreference",
    "orderref",
    "orderno",
    "ordernumber",
    "ponumber",
    "customer",
    "consignee",
    "deliveryname",
    "deliverto",
    "shipto",
    "collectionaddress",
    "collectfromaddress",
    "collectfrom",
    "collectionname",
    "pickupname",
    "deliveryaddress",
    "collectiondate",
    "deliverydate",
    "contact",
    "telephone",
    "phone",
    "email",
    "goodsdescription",
    "description",
    "quantity",
    "qty",
    "weight",
    "volume",
    "priority",
    "notes",
  ];
  return knownLabelStarts.some((label) => compact === label || compact.startsWith(label));
}

function findLabelValue(text: string, labels: string[]): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const labelPatterns = labels.map(
    (label) => new RegExp(`^${label}\\s*[:\\-]?\\s*(.*)$`, "i")
  );

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line) continue;

    const matchedPattern = labelPatterns.find((pattern) => pattern.test(line));
    if (!matchedPattern) continue;

    const inline = (line.match(matchedPattern)?.[1] ?? "").trim();
    if (inline) {
      return formatCompressedValue(inline);
    }

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = (lines[cursor] ?? "").trim();
      if (!next) continue;
      if (lineLooksLikeLabel(next)) break;
      return formatCompressedValue(next);
    }
  }

  return "";
}

function findMultilineValue(text: string, labels: string[]): string {
  const lines = text.split(/\r?\n/).map((line) => line.trim());
  const labelPatterns = labels.map(
    (label) => new RegExp(`^${label}\\s*[:\\-]?\\s*(.*)$`, "i")
  );

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (!line) continue;

    const matchedPattern = labelPatterns.find((pattern) => pattern.test(line));
    if (!matchedPattern) continue;

    const first = (line.match(matchedPattern)?.[1] ?? "").trim();
    const parts: string[] = first ? [formatCompressedValue(first)] : [];

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      const next = (lines[cursor] ?? "").trim();
      if (!next) {
        if (parts.length > 0) break;
        continue;
      }
      if (lineLooksLikeLabel(next)) break;
      parts.push(formatCompressedValue(next));
      if (parts.length >= 4) break;
    }

    if (parts.length > 0) {
      return parts.join("\n");
    }
  }

  return "";
}

function normalizeOrderReference(rawValue: string): string {
  if (!rawValue) return "";
  const numberMatch = rawValue.match(/\b(\d{3,})[A-Za-z]?\b/);
  if (numberMatch?.[1]) {
    return numberMatch[1];
  }
  return rawValue.trim();
}

function stripLeadingLabelArtifacts(value: string): string {
  return value
    .replace(/^\s*(name|address|description|notes?)\s*[:\-]\s*/i, "")
    .trim();
}

function toTitleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s{2,}/g, " ").trim();
}

function parseMerchantAndTrading(value: string): {
  merchantShipper: string;
  tradingName: string;
} {
  const trimmed = normalizeWhitespace(value);
  if (!trimmed) {
    return { merchantShipper: "", tradingName: "" };
  }

  const segments = trimmed.split("/").map((segment) => normalizeWhitespace(segment));
  const tIndex = segments.findIndex((segment) => /^t$/i.test(segment));
  const aIndex = segments.findIndex((segment, index) => index > tIndex && /^a(\s|$)/i.test(segment));

  let tradingName = "";
  const merchantSegments: string[] = [];

  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index] ?? "";
    if (tIndex >= 0 && aIndex === tIndex + 1) {
      if (index < tIndex) {
        merchantSegments.push(segment);
        continue;
      }

      if (index < aIndex) {
        continue;
      }

      if (!tradingName) {
        const fromA = segment.replace(/^a\s*/i, "").trim();
        tradingName = fromA ? `T/A ${toTitleCase(fromA)}` : "";
        continue;
      }
    }

    if (/^t\/?a\b/i.test(segment)) {
      const stripped = segment.replace(/^t\/?a\s*/i, "").trim();
      tradingName = stripped ? `T/A ${toTitleCase(stripped)}` : tradingName;
      continue;
    }

    merchantSegments.push(segment);
  }

  const merchantShipper = merchantSegments.length > 0
    ? merchantSegments.map((segment) => toTitleCase(segment)).join(" / ")
    : toTitleCase(trimmed.replace(/^t\/?a\s*/i, ""));

  return {
    merchantShipper,
    tradingName,
  };
}

function parsePricingAmounts(text: string): {
  netAmount: string;
  vatAmount: string;
  grossTotal: string;
} {
  const directNet = normalizeCurrency(
    findLabelValue(text, ["Net\\s*Amount", "Net"]) ||
      pickFirst(text, [/(?:net\s*amount|net)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );

  const directVat = normalizeCurrency(
    findLabelValue(text, ["VAT\\s*Amount", "VAT"]) ||
      pickFirst(text, [/(?:vat\s*amount|vat)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );

  const directGross = normalizeCurrency(
    findLabelValue(text, ["Gross\\s*Total", "Total\\s*Inc\\s*VAT", "Total"]) ||
      pickFirst(text, [/(?:gross\s*total|total\s*inc\s*vat|total)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );

  const pricingLine =
    findLabelValue(text, ["Pricing", "Price", "Total\\s*Amount"]) ||
    pickFirst(text, [/(?:pricing|price|total\s*amount)\s*[:\-]?\s*([^\n]+)/i]);

  if (!pricingLine) {
    return {
      netAmount: directNet,
      vatAmount: directVat,
      grossTotal: directGross,
    };
  }

  const pricingNumbers = Array.from(
    pricingLine.matchAll(/£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/g),
    (match) => match[1]
  );

  const pricingNet = pricingNumbers[0] ? normalizeCurrency(pricingNumbers[0]) : "";
  const pricingVat = pricingNumbers[1] ? normalizeCurrency(pricingNumbers[1]) : "";
  const pricingGross = pricingNumbers[2] ? normalizeCurrency(pricingNumbers[2]) : "";

  return {
    netAmount: directNet || pricingNet,
    vatAmount: directVat || pricingVat,
    grossTotal: directGross || pricingGross,
  };
}

function parsePriority(text: string): PriorityLevel {
  const priorityText = pickFirst(text, [
    /priority\s*[:\-]\s*(high|normal|low)/i,
  ]).toLowerCase();

  if (priorityText === "high") return "High";
  if (priorityText === "normal") return "Normal";
  if (priorityText === "low") return "Low";
  return "Not Set";
}

function buildDefaultReviewData(context: OcrModelContext): OcrReviewData {
  const { rawText: text, documentType } = context;
  const orderReferenceRaw =
    findLabelValue(text, ["Order\\s*Reference", "Order\\s*Ref", "Order\\s*No\\.?", "PO\\s*(?:Number|No\\.?|#)?"]) ||
    pickFirst(text, [
      /order\s*(?:reference|ref|number|no\.?|#)\s*[:\-]\s*([^\n]+)/i,
      /po\s*(?:number|no\.?|#)?\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const orderTypeText = pickFirst(text, [
    /order\s*type\s*[:\-]\s*(collection|delivery)/i,
    /(collection|delivery)\s+order/i,
  ]);

  const codRaw = pickFirst(text, [
    /cash\s*on\s*delivery\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /\bcod\b\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
  ]);

  const collectionDateRaw = pickFirst(text, [
    /collection\s*date\s*[:\-]?\s*([^\n]+)/i,
    /collect\s*on\s*[:\-]\s*([^\n]+)/i,
    /rtc\s*date\s*[:\-]\s*([^\n]+)/i,
  ]) || findLabelValue(text, ["Collection\\s*Date", "Collect\\s*On", "RTC\\s*Date"]);

  const deliveryDateRaw = pickFirst(text, [
    /delivery\s*date\s*[:\-]?\s*([^\n]+)/i,
    /delivery\s*(?:by|on)\s*[:\-]?\s*([^\n]+)/i,
  ]) || findLabelValue(text, ["Delivery\\s*Date", "Delivery\\s*By", "Delivery\\s*On"]);

  const normalizedCollectionDate = normalizeDate(collectionDateRaw);
  const normalizedDeliveryDate = normalizeDate(deliveryDateRaw);

  const netAmount = normalizeCurrency(
    pickFirst(text, [
      /(?:net\s*amount|subtotal|sub\s*total|net)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    ])
  );
  const vatAmount = normalizeCurrency(
    pickFirst(text, [
      /(?:vat\s*amount|vat)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
      /(?:tax)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    ])
  );
  const grossTotal = normalizeCurrency(
    pickFirst(text, [
      /(?:gross\s*total|total\s*amount|order\s*total|total)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    ])
  );

  const explicitVatRate = pickFirst(text, [
    /vat\s*rate\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*%)/i,
    /vat\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*%)/i,
  ]).replace(/\s+/g, "");

  const customerValue =
    findLabelValue(text, ["Customer", "Consignee", "Delivery\\s*Name", "Deliver\\s*To", "Ship\\s*To"]) ||
    pickFirst(text, [
      /(?:customer|consignee|delivery\s*name|deliver\s*to|ship\s*to)\s*[:\-]\s*([^\n]+)/i,
    ]);

  const collectionAddressValue =
    findMultilineValue(text, ["Collection\\s*Address", "Collect\\s*From\\s*Address", "Collect\\s*From", "Collection\\b"]) ||
    pickFirst(text, [
      /collection\s*address\s*[:\-]\s*([^\n]+)/i,
      /collect\s*from\s*[:\-]\s*([^\n]+)/i,
    ]);

  const deliveryAddressValue =
    findMultilineValue(text, ["Delivery\\s*Address", "Deliver\\s*To\\s*Address", "Deliver\\s*To", "Delivery\\b"]) ||
    pickFirst(text, [
      /delivery\s*address\s*[:\-]\s*([^\n]+)/i,
      /deliver\s*to\s*[:\-]\s*([^\n]+)/i,
    ]);

  return {
    documentType,
    orderReference: normalizeOrderReference(orderReferenceRaw),
    tradingName: findLabelValue(text, ["Trading\\s*Name", "T\\/A"]) || "",
    orderType:
      orderTypeText.toLowerCase() === "collection"
        ? "Collection"
        : orderTypeText.toLowerCase() === "delivery"
          ? "Delivery"
          : "",
    collectionDate: normalizedCollectionDate,
    collectionDateConfidence: normalizedCollectionDate ? "high" : "low",
    deliveryDate: normalizedDeliveryDate,
    deliveryDateConfidence: normalizedDeliveryDate ? "high" : "low",
    merchantShipper: pickFirst(text, [
      /(?:merchant|shipper|sender|from)\s*[:\-]\s*([^\n]+)/i,
    ]),
    customer: customerValue,
    collectionName:
      findLabelValue(text, [
        "Collection\\s*Name",
        "Collect\\s*From\\s*Name",
        "Pickup\\s*Name",
        "Collection\\b",
        "Collect\\s*From",
      ]) ||
      pickFirst(text, [
        /(?:collection\s*name|collect\s*from\s*name|pickup\s*name)\s*[:\-]?\s*([^\n]+)/i,
        /(?:collection\s*from)\s*[:\-]?\s*([^\n]+)/i,
      ]),
    collectionAddress: collectionAddressValue,
    deliveryName:
      findLabelValue(text, ["Delivery\\s*Name", "Deliver\\s*To", "Consignee"]) ||
      customerValue,
    deliveryAddress: deliveryAddressValue,
    contactName: pickFirst(text, [
      /contact\s*(?:name)?\s*[:\-]\s*([^\n]+)/i,
    ]),
    deliveryPhone: normalizePhone(pickFirst(text, [
      /(?:telephone|phone|tel|mobile)\s*[:\-]\s*([+()0-9\s-]{6,})/i,
    ])),
    telephone: normalizePhone(pickFirst(text, [
      /(?:telephone|phone|tel|mobile)\s*[:\-]\s*([+()0-9\s-]{6,})/i,
    ])),
    deliveryEmail: pickFirst(text, [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i,
    ]),
    email: pickFirst(text, [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i,
    ]),
    goodsDescription: pickFirst(text, [
      /(?:goods\s*description|description|items?)\s*[:\-]\s*([^\n]+)/i,
    ]),
    packages: pickFirst(text, [
      /(?:packages?|pallets?|plt\/?pkg|pkgs?)\s*[:\-]\s*(\d+)/i,
    ]),
    quantity: pickFirst(text, [/(?:qty|quantity)\s*[:\-]\s*(\d+)/i]),
    weight: pickFirst(text, [
      /weight\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|kgs|t|tonnes?)?)/i,
    ]),
    volume: pickFirst(text, [
      /(?:volume|cbm|m3)\s*[:\-]\s*([0-9]+(?:[.,][0-9]+)?\s*(?:cbm|m3)?)/i,
    ]),
    priority: parsePriority(text),
    cashOnDelivery: normalizeCurrency(codRaw),
    netAmount,
    vatAmount,
    grossTotal,
    vatRate: explicitVatRate || inferVatRate(netAmount, vatAmount),
    notes: pickFirst(text, [
      /(?:delivery\s*notes?|special\s*instructions?)\s*[:\-]\s*([^\n]+)/i,
      /notes?\s*[:\-]\s*([^\n]+)/i,
    ]),
  };
}

function buildBlbPurchaseOrderData(context: OcrModelContext): OcrReviewData {
  const defaultData = buildDefaultReviewData(context);
  const text = context.rawText;

  const orderNo =
    findLabelValue(text, ["Order\\s*No\\.?", "Order\\s*Number", "PO\\s*Number", "PO\\s*#"]) ||
    pickFirst(text, [
      /(?:order\s*(?:no\.?|number)|po\s*(?:number|#))\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const rtcDate =
    findLabelValue(text, ["RTC\\s*Date", "Ready\\s*To\\s*Collect\\s*Date"]) ||
    pickFirst(text, [
      /(?:rtc\s*date|ready\s*to\s*collect\s*date)\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const reference =
    findLabelValue(text, ["Reference", "Customer\\s*Reference"]) ||
    pickFirst(text, [/(?:^|\n)\s*(?:customer\s*reference|reference)\s*[:\-]?\s*([^\n]+)/i]);

  const merchantShipperRaw =
    findLabelValue(text, ["Merchant\\s*\\/\\s*Shipper", "Merchant", "Shipper"]) ||
    defaultData.merchantShipper;

  const merchantAndTrading = parseMerchantAndTrading(merchantShipperRaw);

  const tradingName =
    findLabelValue(text, ["Trading\\s*Name", "T\\/A"]) ||
    merchantAndTrading.tradingName ||
    defaultData.tradingName;

  const deliveryDate =
    findLabelValue(text, ["Delivery\\s*Date", "Delivery\\s*By", "Delivery\\s*On"]) ||
    defaultData.deliveryDate;

  const collectionAddress =
    findMultilineValue(text, ["Collection\\s*Address", "Collect\\s*From\\s*Address"]) ||
    defaultData.collectionAddress;

  const deliveryAddress =
    findMultilineValue(text, ["Delivery\\s*Address", "Deliver\\s*To\\s*Address"]) ||
    defaultData.deliveryAddress;

  const collectionName =
    findLabelValue(text, ["Collection\\s*Name", "Collect\\s*From\\s*Name", "Collect\\s*From"]) ||
    defaultData.collectionName;

  const deliveryName =
    findLabelValue(text, ["Delivery\\s*Name", "Delivery\\s*To", "Deliver\\s*To"]) ||
    reference ||
    defaultData.customer;

  const contactDetails =
    findLabelValue(text, ["Contact\\s*Details", "Contact\\s*Name", "Contact"]);
  const explicitPhone = normalizePhone(
    pickFirst(text, [/(?:telephone|phone|tel|mobile)\s*[:\-]?\s*([+()0-9\s-]{6,})/i])
  );
  const explicitEmail = pickFirst(text, [
    /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i,
  ]);

  const goods =
    findMultilineValue(text, ["Goods", "Goods\\s*Description", "Items"]) ||
    defaultData.goodsDescription;

  const pricing = parsePricingAmounts(text);

  const deliveryNotes =
    findLabelValue(text, ["Delivery\\s*Notes", "Notes", "Special\\s*Instructions"]) ||
    defaultData.notes;

  const normalizedRtcDate = normalizeDate(rtcDate || defaultData.collectionDate);
  const normalizedDeliveryDate = normalizeDate(deliveryDate);
  const modelCustomer = reference || defaultData.customer;
  const modelDeliveryName = stripLeadingLabelArtifacts(
    deliveryName || modelCustomer || defaultData.deliveryName
  );
  const tradingCore = merchantAndTrading.tradingName.replace(/^T\/A\s*/i, "").trim();
  const modelMerchant =
    merchantAndTrading.merchantShipper && tradingCore
      ? `${merchantAndTrading.merchantShipper} / ${tradingCore}`
      : merchantAndTrading.merchantShipper || defaultData.merchantShipper;

  return {
    ...defaultData,
    documentType: "purchase_order",
    tradingName,
    merchantShipper: modelMerchant,
    orderReference: normalizeOrderReference(orderNo || reference || defaultData.orderReference),
    collectionDate: normalizedRtcDate,
    collectionDateConfidence: normalizedRtcDate
      ? "high"
      : defaultData.collectionDateConfidence,
    deliveryDate: normalizedDeliveryDate,
    deliveryDateConfidence: normalizedDeliveryDate
      ? "high"
      : defaultData.deliveryDateConfidence,
    customer: modelCustomer,
    collectionName: stripLeadingLabelArtifacts(collectionName),
    collectionAddress: stripLeadingLabelArtifacts(collectionAddress),
    deliveryName: modelDeliveryName,
    deliveryAddress: stripLeadingLabelArtifacts(deliveryAddress),
    contactName: contactDetails || defaultData.contactName,
    deliveryPhone: explicitPhone || defaultData.deliveryPhone,
    telephone: explicitPhone || defaultData.telephone,
    deliveryEmail: explicitEmail || defaultData.deliveryEmail,
    email: explicitEmail || defaultData.email,
    goodsDescription: stripLeadingLabelArtifacts(goods),
    netAmount: pricing.netAmount || defaultData.netAmount,
    vatAmount: pricing.vatAmount || defaultData.vatAmount,
    grossTotal: pricing.grossTotal || defaultData.grossTotal,
    vatRate:
      defaultData.vatRate ||
      inferVatRate(
        pricing.netAmount || defaultData.netAmount,
        pricing.vatAmount || defaultData.vatAmount
      ),
    notes: deliveryNotes,
  };
}

function buildDoorwayDeliveryNoteData(context: OcrModelContext): OcrReviewData {
  const defaultData = buildDefaultReviewData(context);
  return {
    ...defaultData,
    documentType: "delivery_note",
    notes: [
      defaultData.notes,
      "Doorway model awaiting sample document for layout-specific extraction rules.",
    ]
      .filter(Boolean)
      .join(" | "),
  };
}

const blbPurchaseOrderModel: OcrModelDefinition = {
  artifact: {
    modelKey: "merchant.blb_home_group.purchase_order.v1",
    modelName: "BLB Home Group Purchase Order",
    workspaceKey: "merchant:blb-home-group",
    merchantKey: "blb-home-group",
    customerKey: null,
    documentType: "purchase_order",
    version: 1,
    readinessStatus: "active",
  },
  matchScore(context) {
    const source = `${context.metadata.fileName} ${context.rawText}`.toLowerCase();
    let score = 0;
    if (source.includes("blb")) score += 50;
    if (source.includes("home group")) score += 35;
    if (source.includes("purchase order")) score += 20;
    if (source.includes("rtc date")) score += 10;
    if (source.includes("order no") || source.includes("po number")) score += 10;
    if (source.includes("reference")) score += 5;
    return score;
  },
  parse: buildBlbPurchaseOrderData,
};

const doorwayDeliveryNoteModel: OcrModelDefinition = {
  artifact: {
    modelKey: "merchant.doorway.delivery_note.v1",
    modelName: "Doorway Delivery Note",
    workspaceKey: "merchant:doorway",
    merchantKey: "doorway",
    customerKey: null,
    documentType: "delivery_note",
    version: 1,
    readinessStatus: "awaiting_sample",
  },
  matchScore(context) {
    const source = `${context.metadata.fileName} ${context.rawText}`.toLowerCase();
    let score = 0;
    if (source.includes("doorway")) score += 50;
    if (source.includes("delivery note") || source.includes("deliverynote")) score += 25;
    if (source.includes("consignee")) score += 10;
    if (source.includes("delivery note no") || source.includes("dn no")) score += 10;
    return score;
  },
  parse: buildDoorwayDeliveryNoteData,
};

const defaultModel: OcrModelDefinition = {
  artifact: {
    modelKey: "system.default.ocr.v1",
    modelName: "System Default OCR",
    workspaceKey: "system:default",
    merchantKey: "system",
    customerKey: null,
    documentType: "order_form",
    version: 1,
    readinessStatus: "active",
  },
  matchScore() {
    return 1;
  },
  parse: buildDefaultReviewData,
};

const OCR_MODELS: OcrModelDefinition[] = [
  blbPurchaseOrderModel,
  doorwayDeliveryNoteModel,
];

export function identifyOcrModel(context: OcrModelContext): OcrModelSelection {
  let selectedModel = defaultModel;
  let selectedScore = 0;

  for (const model of OCR_MODELS) {
    if (model.artifact.documentType !== context.documentType) {
      continue;
    }
    const score = model.matchScore(context);
    if (score > selectedScore) {
      selectedModel = model;
      selectedScore = score;
    }
  }

  if (selectedModel === defaultModel && context.documentType !== "order_form") {
    selectedModel = {
      ...defaultModel,
      artifact: {
        ...defaultModel.artifact,
        documentType: context.documentType,
      },
    };
  }

  return {
    model: selectedModel.artifact,
    confidence: selectedScore >= 55 ? "high" : selectedScore >= 25 ? "medium" : "low",
  };
}

export function applyOcrModel(
  selection: OcrModelSelection,
  context: OcrModelContext
): OcrReviewData {
  const active = OCR_MODELS.find(
    (model) => model.artifact.modelKey === selection.model.modelKey
  );

  if (active) {
    return active.parse(context);
  }

  return buildDefaultReviewData(context);
}