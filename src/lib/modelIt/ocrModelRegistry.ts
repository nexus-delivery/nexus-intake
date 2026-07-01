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

function normalizeUkMobile(value: string | null | undefined): string {
  const normalized = normalizePhone(value);
  if (!normalized) return "";
  if (/^7\d{9}$/.test(normalized)) {
    return `0${normalized}`;
  }
  if (/^447\d{9}$/.test(normalized)) {
    return `+${normalized}`;
  }
  return normalized;
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
    .replace(/([a-z])(to|of|and|for|at|in)([A-Z])/g, "$1 $2 $3")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  return expanded;
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
    .replace(/^\s*(name|address|description|notes?|del\s*notes?)\s*[:\-]\s*/i, "")
    .trim();
}

function normalizeOcrWhitespace(text: string): string {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{2,}/g, "\n")
    .trim();
}

function cleanAddressValue(value: string): string {
  if (!value) return "";

  const cleaned = value
    .replace(/,\s*/g, "\n")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/£\s*\d/i.test(line))
    .filter((line) => !/\b(?:qty|quantity|price|amount|subtotal|total|vat|net|gross|line\s*total)\b/i.test(line))
    .filter((line) => !/^\d+(?:\.\d+)?$/.test(line))
    .map((line) => stripLeadingLabelArtifacts(line))
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();

  return cleaned;
}

function cleanGoodsValue(value: string): string {
  if (!value) return "";

  return value
    .split(/\r?\n/)
    .map((line) => stripLeadingLabelArtifacts(line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/£\s*\d/i.test(line))
    .filter((line) => !/\b(?:qty|quantity|price|amount|subtotal|total|vat|net|gross|code|\/?each)\b/i.test(line))
    .filter((line) => !/^\d+(?:\.\d+)?$/.test(line))
    .join("\n");
}

function cleanBlbOcrArtifacts(value: string): string {
  if (!value) return "";
  return value
    .replace(/[!"#$%]+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function cleanBlbNotesValue(value: string): string {
  if (!value) return "";

  return value
    .split(/\r?\n/)
    .map((line) => stripLeadingLabelArtifacts(line))
    .map((line) => cleanBlbOcrArtifacts(line))
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .filter((line) => !/£\s*\d/i.test(line))
    .filter((line) => !/^\d+(?:\.\d+)?$/.test(line))
    .join("\n");
}

function isLikelyHeaderLine(line: string): boolean {
  return /\b(?:qty|quantity|price|amount|subtotal|total|vat|net|gross|code|\/?each)\b/i.test(line);
}

function isPhoneLine(line: string): boolean {
  return /\b(?:telephone|phone|tel|mobile)\b/i.test(line);
}

function isEmailLine(line: string): boolean {
  return /@/.test(line) || /\bemail\b/i.test(line);
}

function splitNormalizedLines(text: string): string[] {
  return normalizeOcrWhitespace(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function getBlbRowValue(
  text: string,
  labels: string[]
): string {
  const lines = splitNormalizedLines(text);
  const labelPattern = labels.map((label) => label.replace(/\s+/g, "\\s*")).join("|");
  const rowRegex = new RegExp(`^(?:${labelPattern})\\s*[:\\-]?\\s*(.*)$`, "i");
  const nextLabelRegex = /^(order\s*no\.?|reference|order\s*date|rtc\s*date|rtcdate|delivery\s*date|deliverydate|collection|delivery|del\s*notes?|notes?|nett?|vat|total|email|telephone|phone|description|manufacture\s+as\s+below)\b/i;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    const match = line.match(rowRegex);
    if (!match) continue;

    const inline = formatCompressedValue((match[1] ?? "").trim());
    if (inline) return inline;

    for (let j = i + 1; j < lines.length; j += 1) {
      const next = (lines[j] ?? "").trim();
      if (!next) continue;
      if (nextLabelRegex.test(next)) break;
      return formatCompressedValue(next);
    }
  }

  return "";
}

function findBoundaryIndex(lines: string[], patterns: RegExp[]): number {
  return lines.findIndex((line) => patterns.some((pattern) => pattern.test(line)));
}

function extractSectionBetweenBoundaries(
  text: string,
  startPatterns: RegExp[],
  stopPatterns: RegExp[],
  includeStartLine = false
): string {
  const lines = splitNormalizedLines(text);
  const startIndex = findBoundaryIndex(lines, startPatterns);
  if (startIndex < 0) return "";

  let stopIndex = lines.length;
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index] ?? "";
    if (stopPatterns.some((pattern) => pattern.test(line))) {
      stopIndex = index;
      break;
    }
  }

  const fromIndex = includeStartLine ? startIndex : startIndex + 1;
  if (stopIndex <= fromIndex) return "";
  return lines.slice(fromIndex, stopIndex).join("\n");
}

function extractBlbSegmentedSections(text: string): {
  goodsSection: string;
  collectionSection: string;
  deliverySection: string;
  notesSection: string;
  commercialSection: string;
} {
  const goodsSection = extractSectionBetweenBoundaries(
    text,
    [/^manufacture\s+as\s+below\s*:?$/i, /^manufacture\b/i],
    [/^collection\b/i]
  );

  const collectionSection = extractSectionBetweenBoundaries(
    text,
    [/^collection\b/i],
    [/^delivery\b/i],
    true
  );

  const deliverySection = extractSectionBetweenBoundaries(
    text,
    [/^delivery\b/i],
    [/^del\s*notes?\b/i, /^delivery\s*notes?\b/i, /^notes?\b/i, /^nett?\b/i, /^net\b/i],
    true
  );

  const notesSection = extractSectionBetweenBoundaries(
    text,
    [/^del\s*notes?\b/i, /^delivery\s*notes?\b/i],
    [/^nett?\b/i, /^net\b/i],
    true
  );

  const commercialSection = extractSectionBetweenBoundaries(
    text,
    [/^nett?\b/i, /^net\b/i],
    [/^vat\s*rate\b/i, /^order\s*date\b/i, /^reference\b/i, /^$|^\s*$/i],
    true
  );

  return {
    goodsSection,
    collectionSection,
    deliverySection,
    notesSection,
    commercialSection,
  };
}

function extractNameAddressFromSectionBlock(sectionText: string): {
  name: string;
  address: string;
} {
  if (!sectionText) return { name: "", address: "" };

  const sanitizeSectionLine = (line: string): string =>
    cleanBlbOcrArtifacts(
      line
      .replace(/^collection\s*:?$/i, "")
      .replace(/^delivery\s*:?$/i, "")
      .replace(/^collection\s*name\s*[:\-]?\s*/i, "")
      .replace(/^collection\s*address\s*[:\-]?\s*/i, "")
      .replace(/^delivery\s*name\s*[:\-]?\s*/i, "")
      .replace(/^delivery\s*address\s*[:\-]?\s*/i, "")
      .trim()
    );

  const isNonAddressFieldLine = (line: string): boolean =>
    /^(collection|delivery|contact\s*name|telephone|phone|email|rtc\s*date|delivery\s*date|order\s*date|goods\s*description|description|del\s*notes?|notes?|nett?|vat|gross|total)\b/i.test(line);

  const lines = splitNormalizedLines(sectionText)
    .map((line) => sanitizeSectionLine(stripLeadingLabelArtifacts(line)))
    .filter((line) => !isLikelyHeaderLine(line))
    .filter((line) => !/£\s*\d/i.test(line))
    .filter((line) => !isPhoneLine(line))
    .filter((line) => !isEmailLine(line))
    .filter((line) => !isNonAddressFieldLine(line));

  if (lines.length === 0) return { name: "", address: "" };

  return {
    name: lines[0] ?? "",
    address: cleanAddressValue(lines.slice(1).join("\n")),
  };
}

function extractPhoneEmailFromSectionBlock(sectionText: string): {
  phone: string;
  email: string;
} {
  if (!sectionText) return { phone: "", email: "" };

  const lines = splitNormalizedLines(sectionText);
  const phoneLine = lines.find((line) => isPhoneLine(line) || /(^|\D)\d{10,11}(\D|$)/.test(line)) ?? "";
  const emailLine = lines.find((line) => isEmailLine(line)) ?? "";

  return {
    phone: normalizeUkMobile(pickFirst(phoneLine, [/([+()0-9\s-]{10,})/])),
    email:
      pickFirst(emailLine, [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i]) || "",
  };
}

function extractCommercialTotals(sectionText: string): {
  netAmount: string;
  vatAmount: string;
  grossTotal: string;
} {
  if (!sectionText) {
    return { netAmount: "", vatAmount: "", grossTotal: "" };
  }

  const netAmount = normalizeCurrency(
    pickFirst(sectionText, [/(?:nett?|net(?:\s*amount)?)\D*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );
  const vatAmount = normalizeCurrency(
    pickFirst(sectionText, [/(?:vat(?:\s*amount)?)\D*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );
  const grossTotal = normalizeCurrency(
    pickFirst(sectionText, [/(?:total|gross(?:\s*total)?)\D*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );

  return { netAmount, vatAmount, grossTotal };
}

function extractValueAfterLabel(text: string, labels: string[]): string {
  const normalized = normalizeOcrWhitespace(text);
  const labelPattern = labels.join("|");
  const stopPattern =
    "(?:Order\\s*(?:No\\.?|Reference|Date)|Reference|Customer|Merchant\\s*\\/\\s*Shipper|Collection(?:\\s*(?:Name|Address|Phone|Email))?|Delivery(?:\\s*(?:Name|Address|Date|Phone|Email))?|RTC\\s*Date|RTCDate|Order\\s*Date|OrderDate|Telephone|Phone|Email|Contact\\s*Name|Description|Goods(?:\\s*Description)?|Del\\s*notes?|Notes|Net(?:t|\\s*Amount)?|VAT(?:\\s*Amount)?|Gross(?:\\s*Total)?|Total|Qty|Quantity|Price)";
  const pattern = new RegExp(
    `(?:^|\\n)\\s*(?:${labelPattern})\\s*[:\\-]?\\s*([\\s\\S]*?)(?=\\n\\s*(?:${stopPattern})\\s*[:\\-]?|\\n\\s*£\\s*\\d|$)`,
    "i"
  );

  const match = normalized.match(pattern);
  return formatCompressedValue(match?.[1]?.trim() ?? "");
}

function extractGoodsSection(text: string): string {
  const lines = normalizeOcrWhitespace(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const startIndex = lines.findIndex((line) => /^(description|goods\s*description|goods|items?)\b/i.test(line));
  if (startIndex < 0) {
    return cleanGoodsValue(
      extractValueAfterLabel(text, ["Description", "Goods\\s*Description", "Goods", "Items?"])
    );
  }

  const goodsLines: string[] = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i] ?? "";
    if (/^(notes?|net|vat|gross|total|delivery\s*notes|special\s*instructions)\b/i.test(line)) {
      break;
    }
    goodsLines.push(line);
  }

  return cleanGoodsValue(goodsLines.join("\n"));
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
  const text = normalizeOcrWhitespace(context.rawText);
  const segmented = extractBlbSegmentedSections(text);

  const orderNo =
    getBlbRowValue(text, ["Order No", "Order Number", "PO Number", "PO #"]) ||
    pickFirst(text, [
      /(?:^|\n)\s*order\s*no\.?\s*[:\-]?\s*(\d{3,})\b/i,
    ]);

  const orderDateRaw =
    getBlbRowValue(text, ["Order Date", "OrderDate"]) ||
    pickFirst(text, [/(?:order\s*date|orderdate)\s*[:\-]?\s*([^\n]+)/i]);

  const rtcDate =
    getBlbRowValue(text, ["RTC date", "RTC Date", "RTCDate", "Ready To Collect Date"]) ||
    pickFirst(text, [
      /(?:rtc\s*date|rtcdate|ready\s*to\s*collect\s*date)\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const reference =
    getBlbRowValue(text, ["Reference", "Customer Reference"]) ||
    pickFirst(text, [/(?:^|\n)\s*(?:customer\s*reference|reference)\s*[:\-]?\s*([^\n]+)/i]);

  const deliveryDate =
    getBlbRowValue(text, ["Delivery date", "Delivery Date", "DeliveryDate"]) ||
    pickFirst(text, [/(?:delivery\s*date|deliverydate)\s*[:\-]?\s*([^\n]+)/i]) ||
    defaultData.deliveryDate;

  const collectionSection = extractNameAddressFromSectionBlock(segmented.collectionSection);
  const deliverySection = extractNameAddressFromSectionBlock(segmented.deliverySection);

  const collectionName =
    collectionSection.name ||
    extractValueAfterLabel(text, ["Collection\\s*Name", "Collect\\s*From\\s*Name", "Collect\\s*From"]) ||
    defaultData.collectionName;

  const collectionAddress =
    collectionSection.address ||
    extractValueAfterLabel(text, ["Collection\\s*Address", "Collect\\s*From\\s*Address"]) ||
    defaultData.collectionAddress;

  const deliveryName =
    deliverySection.name ||
    extractValueAfterLabel(text, ["Delivery\\s*Name", "Delivery\\s*To", "Deliver\\s*To"]) ||
    reference ||
    defaultData.customer;

  const deliveryAddress =
    deliverySection.address ||
    extractValueAfterLabel(text, ["Delivery\\s*Address", "Deliver\\s*To\\s*Address"]) ||
    defaultData.deliveryAddress;

  const contactDetails =
    extractValueAfterLabel(text, ["Contact\\s*Details", "Contact\\s*Name", "Contact"]);
  const deliveryContactFromSection = extractPhoneEmailFromSectionBlock(segmented.deliverySection);
  const explicitPhone = normalizeUkMobile(
    deliveryContactFromSection.phone ||
      extractValueAfterLabel(text, ["Delivery\\s*Phone", "Telephone", "Phone", "Tel", "Mobile"]) ||
      pickFirst(text, [/(?:telephone|phone|tel|mobile)\s*[:\-]?\s*([+()0-9\s-]{6,})/i])
  );
  const explicitEmail =
    deliveryContactFromSection.email ||
    extractValueAfterLabel(text, ["Delivery\\s*Email", "Email"]) ||
    pickFirst(text, [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i,
    ]);

  const goodsFromSection = cleanGoodsValue(segmented.goodsSection);
  const notesAsGoods = cleanBlbNotesValue(segmented.notesSection)
    .replace(/^del\s*notes?\s*[:\-]?\s*/i, "")
    .trim();
  const goods = [goodsFromSection, notesAsGoods]
    .filter((part) => part.length > 0)
    .join("\n") || extractGoodsSection(text) || defaultData.goodsDescription;

  const commercialFromSegment = extractCommercialTotals(segmented.commercialSection || text);
  const pricing = parsePricingAmounts(text);

  const deliveryNotes =
    cleanBlbNotesValue(segmented.notesSection) ||
    extractValueAfterLabel(text, ["Delivery\\s*Notes", "Notes", "Special\\s*Instructions"]) ||
    defaultData.notes;

  const normalizedOrderDate = normalizeDate(orderDateRaw);
  const normalizedRtcDate = normalizeDate(rtcDate || defaultData.collectionDate);
  const normalizedDeliveryDate = normalizeDate(deliveryDate);
  const modelCustomer = stripLeadingLabelArtifacts(reference)
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\s{2,}/g, " ")
    .replace(/([A-Za-z])([0-9])/g, "$1 $2")
    .replace(/([0-9])([A-Za-z])/g, "$1 $2")
    .split(/\n/)[0]
    .trim();
  const modelDeliveryName = stripLeadingLabelArtifacts(
    deliveryName || modelCustomer || defaultData.deliveryName
  );

  const modelCollectionAddress = cleanAddressValue(cleanBlbOcrArtifacts(collectionAddress));
  const modelDeliveryAddress = cleanAddressValue(cleanBlbOcrArtifacts(deliveryAddress));
  const modelDeliveryEmail = stripLeadingLabelArtifacts(explicitEmail || defaultData.deliveryEmail);
  const modelDeliveryPhone = normalizeUkMobile(explicitPhone || defaultData.deliveryPhone);

  return {
    ...defaultData,
    documentType: "purchase_order",
    tradingName: "Nook Home",
    merchantShipper: "BLB Home Group",
    orderReference: orderNo ? `Nook ${normalizeOrderReference(orderNo)}` : "",
    collectionDate: normalizedRtcDate || normalizedOrderDate,
    collectionDateConfidence: (normalizedRtcDate || normalizedOrderDate)
      ? "high"
      : defaultData.collectionDateConfidence,
    deliveryDate: normalizedDeliveryDate,
    deliveryDateConfidence: normalizedDeliveryDate
      ? "high"
      : defaultData.deliveryDateConfidence,
    customer: modelCustomer,
    collectionName: stripLeadingLabelArtifacts(collectionName),
    collectionAddress: modelCollectionAddress,
    deliveryName: modelDeliveryName,
    deliveryAddress: modelDeliveryAddress,
    contactName: contactDetails || defaultData.contactName,
    deliveryPhone: modelDeliveryPhone,
    telephone: modelDeliveryPhone,
    deliveryEmail: modelDeliveryEmail,
    email: "millie@nookhome.co.uk",
    goodsDescription: goods,
    netAmount: commercialFromSegment.netAmount || pricing.netAmount || defaultData.netAmount,
    vatAmount: commercialFromSegment.vatAmount || pricing.vatAmount || defaultData.vatAmount,
    grossTotal: commercialFromSegment.grossTotal || pricing.grossTotal || defaultData.grossTotal,
    vatRate:
      defaultData.vatRate ||
      inferVatRate(
        pricing.netAmount || defaultData.netAmount,
        pricing.vatAmount || defaultData.vatAmount
      ),
    notes: stripLeadingLabelArtifacts(deliveryNotes)
      .replace(/^del\s*notes?\s*[:\-]?\s*/i, "")
      .replace(/£\s*\d+(?:[.,]\d{1,2})?/gi, "")
      .trim(),
  };
}

function buildDoorwayDeliveryNoteData(context: OcrModelContext): OcrReviewData {
  const text = context.rawText;

  const deliveryNoteReference =
    findLabelValue(text, [
      "Delivery\\s*Note\\s*(?:No\\.?|Number)",
      "DN\\s*No\\.?",
      "Order\\s*Reference",
      "Order\\s*No\\.?",
    ]) ||
    pickFirst(text, [
      /(?:delivery\s*note\s*(?:no\.?|number)|dn\s*no\.?|order\s*reference|order\s*no\.?)\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const collectionDate = normalizeDate(
    findLabelValue(text, ["Collection\\s*Date", "Collected\\s*On", "Pickup\\s*Date"]) ||
      pickFirst(text, [
        /(?:collection\s*date|collected\s*on|pickup\s*date)\s*[:\-]?\s*([^\n]+)/i,
      ])
  );

  const deliveryDate = normalizeDate(
    findLabelValue(text, ["Delivery\\s*Date", "Delivered\\s*On", "Delivery\\s*By"]) ||
      pickFirst(text, [
        /(?:delivery\s*date|delivered\s*on|delivery\s*by)\s*[:\-]?\s*([^\n]+)/i,
      ])
  );

  const customer =
    findLabelValue(text, ["Consignee", "Customer", "Deliver\\s*To", "Delivery\\s*Name"]) ||
    pickFirst(text, [
      /(?:consignee|customer|deliver\s*to|delivery\s*name)\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const collectionName =
    findLabelValue(text, ["Collection\\s*Name", "Collect\\s*From", "Shipper"]) || "";

  const collectionAddress =
    findMultilineValue(text, ["Collection\\s*Address", "Collect\\s*From\\s*Address"]) ||
    pickFirst(text, [/(?:collection\s*address|collect\s*from\s*address)\s*[:\-]?\s*([^\n]+)/i]);

  const deliveryName =
    findLabelValue(text, ["Delivery\\s*Name", "Deliver\\s*To", "Consignee"]) || customer;

  const deliveryAddress =
    findMultilineValue(text, ["Delivery\\s*Address", "Deliver\\s*To\\s*Address", "Ship\\s*To\\s*Address"]) ||
    pickFirst(text, [
      /(?:delivery\s*address|deliver\s*to\s*address|ship\s*to\s*address)\s*[:\-]?\s*([^\n]+)/i,
    ]);

  const phone = normalizePhone(
    pickFirst(text, [/(?:telephone|phone|tel|mobile)\s*[:\-]?\s*([+()0-9\s-]{6,})/i])
  );
  const email = pickFirst(text, [/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i]);

  const goodsDescription =
    findMultilineValue(text, ["Goods\\s*Description", "Description", "Items"]) ||
    pickFirst(text, [/(?:goods\s*description|description|items?)\s*[:\-]?\s*([^\n]+)/i]);

  const netAmount = normalizeCurrency(
    pickFirst(text, [/(?:net\s*amount|subtotal|net)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );
  const vatAmount = normalizeCurrency(
    pickFirst(text, [/(?:vat\s*amount|vat|tax)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );
  const grossTotal = normalizeCurrency(
    pickFirst(text, [/(?:gross\s*total|total\s*amount|total)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
  );

  const notes =
    findLabelValue(text, ["Delivery\\s*Notes", "Special\\s*Instructions", "Notes"]) ||
    pickFirst(text, [/(?:delivery\s*notes?|special\s*instructions?|notes?)\s*[:\-]?\s*([^\n]+)/i]);

  return {
    documentType: "delivery_note",
    orderReference: normalizeOrderReference(deliveryNoteReference),
    tradingName: "",
    orderType: "Delivery",
    collectionDate,
    collectionDateConfidence: collectionDate ? "high" : "low",
    deliveryDate,
    deliveryDateConfidence: deliveryDate ? "high" : "low",
    merchantShipper:
      findLabelValue(text, ["Merchant\\s*\/\\s*Shipper", "Merchant", "Shipper"]) || "",
    customer,
    collectionName,
    collectionAddress: stripLeadingLabelArtifacts(collectionAddress),
    deliveryName: stripLeadingLabelArtifacts(deliveryName),
    deliveryAddress: stripLeadingLabelArtifacts(deliveryAddress),
    contactName: findLabelValue(text, ["Contact\\s*Name", "Contact", "Attn"]) || "",
    deliveryPhone: phone,
    telephone: phone,
    deliveryEmail: email,
    email,
    goodsDescription: stripLeadingLabelArtifacts(goodsDescription),
    packages: pickFirst(text, [/(?:packages?|pallets?|pkgs?)\s*[:\-]?\s*(\d+)/i]),
    quantity: pickFirst(text, [/(?:qty|quantity)\s*[:\-]?\s*(\d+)/i]),
    weight: pickFirst(text, [
      /weight\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:kg|kgs|t|tonnes?)?)/i,
    ]),
    volume: pickFirst(text, [
      /(?:volume|cbm|m3)\s*[:\-]?\s*([0-9]+(?:[.,][0-9]+)?\s*(?:cbm|m3)?)/i,
    ]),
    priority: parsePriority(text),
    cashOnDelivery: normalizeCurrency(
      pickFirst(text, [/(?:cash\s*on\s*delivery|cod)\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i])
    ),
    netAmount,
    vatAmount,
    grossTotal,
    vatRate: inferVatRate(netAmount, vatAmount),
    notes,
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