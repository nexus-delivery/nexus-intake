import {
  requestMerchantDocumentSignedUrl,
  type UploadedDocumentMetadata,
} from "@/lib/supabaseClient";

export type SupportedDocumentType =
  | "purchase_order"
  | "delivery_note"
  | "order_form";

export type OrderType = "Collection" | "Delivery" | "";

export type PriorityLevel = "Not Set" | "High" | "Normal" | "Low";

export type OcrReviewData = {
  documentType: SupportedDocumentType;
  orderReference: string;
  orderType: OrderType;
  collectionDate: string;
  collectionDateConfidence: "high" | "low";
  deliveryDate: string;
  deliveryDateConfidence: "high" | "low";
  merchantShipper: string;
  customer: string;
  collectionName: string;
  collectionAddress: string;
  deliveryAddress: string;
  contactName: string;
  telephone: string;
  email: string;
  goodsDescription: string;
  packages: string;
  quantity: string;
  weight: string;
  volume: string;
  priority: PriorityLevel;
  cashOnDelivery: string;
  netAmount: string;
  vatAmount: string;
  grossTotal: string;
  vatRate: string;
  notes: string;
};

export type OcrExtractionResult =
  | {
      success: true;
      data: OcrReviewData;
      source: "signed-url" | "filename-fallback";
    }
  | {
      success: false;
      error: string;
    };

export type TrackPodMappedPayload = {
  order_reference: string;
  order_type: OrderType;
  collection_date: string;
  collection_date_confidence: "high" | "low";
  delivery_date: string;
  delivery_date_confidence: "high" | "low";
  merchant_shipper: string;
  customer: string;
  collection_name: string;
  collection_address: string;
  delivery_address: string;
  contact_name: string;
  telephone: string;
  email: string;
  goods_description: string;
  plt_pkg: string;
  quantity: string;
  weight: string;
  volume: string;
  priority: PriorityLevel;
  cod: string;
  net_amount: string;
  vat_amount: string;
  gross_total: string;
  vat_rate: string;
  delivery_notes: string;
};

export type OcrDebugPayload = {
  draft_job_id: string;
  document_id: string;
  filename: string;
  extraction_method: string;
  raw_text_length: number;
  raw_text_preview_500: string;
  parsed_fields: OcrReviewData | null;
  mapped_fields: TrackPodMappedPayload | null;
  parser_errors: string[];
};

let lastOcrDebugPayload: OcrDebugPayload | null = null;

function cloneDebugPayload(payload: OcrDebugPayload): OcrDebugPayload {
  return {
    ...payload,
    parser_errors: [...payload.parser_errors],
    parsed_fields: payload.parsed_fields ? { ...payload.parsed_fields } : null,
    mapped_fields: payload.mapped_fields ? { ...payload.mapped_fields } : null,
  };
}

function publishOcrDebugPayload(payload: OcrDebugPayload): void {
  const snapshot = cloneDebugPayload(payload);
  lastOcrDebugPayload = snapshot;
  console.info("NEXUS_OCR_DEBUG", snapshot);
}

export function getLastOcrDebugPayload(): OcrDebugPayload | null {
  return lastOcrDebugPayload ? cloneDebugPayload(lastOcrDebugPayload) : null;
}

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

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

function detectSupportedDocumentType(
  fileName: string,
  text: string
): SupportedDocumentType | null {
  const source = `${fileName} ${text}`.toLowerCase();
  if (source.includes("purchase order") || source.includes("po ") || source.includes("po#")) {
    return "purchase_order";
  }
  if (source.includes("delivery note") || source.includes("deliverynote")) {
    return "delivery_note";
  }
  if (source.includes("order form") || source.includes("orderform")) {
    return "order_form";
  }
  return null;
}

const PDFJS_MODULE_URL = "https://esm.sh/pdfjs-dist@4.5.136/build/pdf.mjs";

async function extractPdfTextWithPdfJs(buffer: ArrayBuffer): Promise<string> {
  try {
    const pdfjs = (await import(
      /* webpackIgnore: true */ PDFJS_MODULE_URL
    )) as {
      getDocument: (source: {
        data: Uint8Array;
        disableWorker?: boolean;
        useWorkerFetch?: boolean;
        isEvalSupported?: boolean;
      }) => {
        promise: Promise<{
          numPages: number;
          getPage: (pageNumber: number) => Promise<{
            getTextContent: () => Promise<{
              items: Array<{ str?: string; hasEOL?: boolean }>;
            }>;
          }>;
        }>;
      };
    };

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(buffer),
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
    });

    const pdf = await loadingTask.promise;
    const pageTexts: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const lineParts: string[] = [];

      for (const item of textContent.items) {
        const value = item.str?.trim();
        if (value) {
          lineParts.push(value);
        }
        if (item.hasEOL) {
          lineParts.push("\n");
        }
      }

      pageTexts.push(lineParts.join(" "));
    }

    return normalizeExtractedText(pageTexts.join("\n"));
  } catch {
    return "";
  }
}

function uint8ToLatin1(bytes: Uint8Array): string {
  let output = "";
  const chunk = 0x8000;
  for (let index = 0; index < bytes.length; index += chunk) {
    const slice = bytes.subarray(index, Math.min(index + chunk, bytes.length));
    output += String.fromCharCode(...slice);
  }
  return output;
}

function normalizeExtractedText(raw: string): string {
  return raw
    .replace(/\\[rn]/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

async function inflateStream(streamBytes: Uint8Array): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    return "";
  }

  try {
    const inputBuffer = streamBytes.buffer.slice(
      streamBytes.byteOffset,
      streamBytes.byteOffset + streamBytes.byteLength
    ) as ArrayBuffer;
    const stream = new Response(inputBuffer).body;
    if (!stream) return "";

    const decompressed = stream.pipeThrough(new DecompressionStream("deflate"));
    const buffer = await new Response(decompressed).arrayBuffer();
    return uint8ToLatin1(new Uint8Array(buffer));
  } catch {
    return "";
  }
}

async function decodePdfStreams(buffer: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buffer);
  const rawPdf = uint8ToLatin1(bytes);
  const extractedChunks: string[] = [];

  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(rawPdf)) !== null) {
    const rawChunk = match[1] ?? "";
    if (!rawChunk) continue;

    const encodedBytes = Uint8Array.from(rawChunk, (char) => char.charCodeAt(0));
    const inflated = await inflateStream(encodedBytes);
    if (inflated) {
      extractedChunks.push(inflated);
      continue;
    }

    extractedChunks.push(rawChunk);
  }

  return extractedChunks.join("\n");
}

function decodePdfStringLiteral(value: string): string {
  return value
    .replace(/\\([\\()])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\b/g, "\b")
    .replace(/\\f/g, "\f")
    .replace(/\\([0-7]{1,3})/g, (_, octal: string) =>
      String.fromCharCode(Number.parseInt(octal, 8))
    );
}

function extractPdfTextOperators(streamText: string): string {
  const lines: string[] = [];

  const textArrayRegex = /\[((?:[^\]\\]|\\.|\[[^\]]*\])*)\]\s*TJ/g;
  const textShowRegex = /\(((?:[^\\()]|\\.)*)\)\s*Tj/g;

  let arrayMatch: RegExpExecArray | null;
  while ((arrayMatch = textArrayRegex.exec(streamText)) !== null) {
    const segment = arrayMatch[1] ?? "";
    const parts = Array.from(segment.matchAll(/\(((?:[^\\()]|\\.)*)\)/g))
      .map((match) => decodePdfStringLiteral(match[1] ?? "").trim())
      .filter(Boolean);
    if (parts.length > 0) {
      lines.push(parts.join(""));
    }
  }

  let textMatch: RegExpExecArray | null;
  while ((textMatch = textShowRegex.exec(streamText)) !== null) {
    const value = decodePdfStringLiteral(textMatch[1] ?? "").trim();
    if (value) {
      lines.push(value);
    }
  }

  return normalizeExtractedText(lines.join("\n"));
}

async function decodeVisibleText(buffer: ArrayBuffer): Promise<string> {
  const pdfJsText = await extractPdfTextWithPdfJs(buffer);
  if (pdfJsText) {
    return pdfJsText.slice(0, 12000);
  }

  const directRaw = uint8ToLatin1(new Uint8Array(buffer));
  const streamRaw = await decodePdfStreams(buffer);
  const operatorText = extractPdfTextOperators(streamRaw);
  if (operatorText) {
    return operatorText.slice(0, 12000);
  }

  const merged = `${directRaw}\n${streamRaw}`;
  return normalizeExtractedText(merged).slice(0, 12000);
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
  const numberMatch = rawValue.match(/\b(\d{3,})\b/);
  if (numberMatch?.[1]) {
    return numberMatch[1];
  }
  return rawValue.trim();
}

function buildReviewData(
  metadata: UploadedDocumentMetadata,
  text: string,
  docType: SupportedDocumentType
): OcrReviewData {
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

  const priorityText = pickFirst(text, [
    /priority\s*[:\-]\s*(high|normal|low)/i,
  ]).toLowerCase();

  const priority: PriorityLevel =
    priorityText === "high"
      ? "High"
      : priorityText === "normal"
        ? "Normal"
        : priorityText === "low"
          ? "Low"
          : "Not Set";

  const codRaw = pickFirst(text, [
    /cash\s*on\s*delivery\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
    /\bcod\b\s*[:\-]?\s*£?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i,
  ]);

  const collectionDateRaw = pickFirst(text, [
    /collection\s*date\s*[:\-]?\s*([^\n]+)/i,
    /collect\s*on\s*[:\-]\s*([^\n]+)/i,
    /rtc\s*date\s*[:\-]\s*([^\n]+)/i,
  ]) || findLabelValue(text, ["Collection\s*Date", "Collect\s*On", "RTC\s*Date"]);

  const deliveryDateRaw = pickFirst(text, [
    /delivery\s*date\s*[:\-]?\s*([^\n]+)/i,
    /delivery\s*(?:by|on)\s*[:\-]?\s*([^\n]+)/i,
  ]) || findLabelValue(text, ["Delivery\s*Date", "Delivery\s*By", "Delivery\s*On"]);

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
    findMultilineValue(text, ["Collection\s*Address", "Collect\s*From\s*Address", "Collect\s*From", "Collection\b"]) ||
    pickFirst(text, [
      /collection\s*address\s*[:\-]\s*([^\n]+)/i,
      /collect\s*from\s*[:\-]\s*([^\n]+)/i,
    ]);

  const deliveryAddressValue =
    findMultilineValue(text, ["Delivery\s*Address", "Deliver\s*To\s*Address", "Deliver\s*To", "Delivery\b"]) ||
    pickFirst(text, [
      /delivery\s*address\s*[:\-]\s*([^\n]+)/i,
      /deliver\s*to\s*[:\-]\s*([^\n]+)/i,
    ]);

  return {
    documentType: docType,
    orderReference: normalizeOrderReference(orderReferenceRaw),
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
        "Collection\s*Name",
        "Collect\s*From\s*Name",
        "Pickup\s*Name",
        "Collection\b",
        "Collect\s*From",
      ]) ||
      pickFirst(text, [
        /(?:collection\s*name|collect\s*from\s*name|pickup\s*name)\s*[:\-]?\s*([^\n]+)/i,
        /(?:collection\s*from)\s*[:\-]?\s*([^\n]+)/i,
      ]),
    collectionAddress: collectionAddressValue,
    deliveryAddress: deliveryAddressValue,
    contactName: pickFirst(text, [
      /contact\s*(?:name)?\s*[:\-]\s*([^\n]+)/i,
    ]),
    telephone: normalizePhone(pickFirst(text, [
      /(?:telephone|phone|tel|mobile)\s*[:\-]\s*([+()0-9\s-]{6,})/i,
    ])),
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
    priority,
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

export function formatDocumentTypeLabel(documentType: SupportedDocumentType): string {
  if (documentType === "purchase_order") return "Purchase Order";
  if (documentType === "delivery_note") return "Delivery Note";
  return "Order Form";
}

export function mapToTrackPodPayload(data: OcrReviewData): TrackPodMappedPayload {
  return {
    order_reference: data.orderReference,
    order_type: data.orderType,
    collection_date: data.collectionDate,
    collection_date_confidence: data.collectionDateConfidence,
    delivery_date: data.deliveryDate,
    delivery_date_confidence: data.deliveryDateConfidence,
    merchant_shipper: data.merchantShipper,
    customer: data.customer,
    collection_name: data.collectionName,
    collection_address: data.collectionAddress,
    delivery_address: data.deliveryAddress,
    contact_name: data.contactName,
    telephone: data.telephone,
    email: data.email,
    goods_description: data.goodsDescription,
    plt_pkg: data.packages,
    quantity: data.quantity,
    weight: data.weight,
    volume: data.volume,
    priority: data.priority,
    cod: data.cashOnDelivery,
    net_amount: data.netAmount,
    vat_amount: data.vatAmount,
    gross_total: data.grossTotal,
    vat_rate: data.vatRate,
    delivery_notes: data.notes,
  };
}

export async function extractUploadToOcrReviewData(
  metadata: UploadedDocumentMetadata
): Promise<OcrExtractionResult> {
  const debugPayload: OcrDebugPayload = {
    draft_job_id: metadata.jobId,
    document_id: metadata.documentId,
    filename: metadata.fileName,
    extraction_method: "unresolved",
    raw_text_length: 0,
    raw_text_preview_500: "",
    parsed_fields: null,
    mapped_fields: null,
    parser_errors: [],
  };

  console.info("[upload-ocr] extraction-start", {
    draft_job_id: metadata.jobId,
    document_id: metadata.documentId,
    file_name: metadata.fileName,
    file_type: metadata.fileType,
  });

  const fallbackDocType = detectSupportedDocumentType(metadata.fileName, "");
  if (!fallbackDocType) {
    debugPayload.extraction_method = "unsupported-document-type-from-filename";
    debugPayload.parser_errors.push("unsupported-document-type-from-filename");
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] extraction-failure", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      failure_point: "unsupported-document-type-from-filename",
    });
    return {
      success: false,
      error:
        "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
    };
  }

  const signedUrlResult = await requestMerchantDocumentSignedUrl(metadata.documentId);
  if (!signedUrlResult.success) {
    debugPayload.extraction_method = "filename-fallback";
    debugPayload.parser_errors.push(`signed-url-request-failed: ${signedUrlResult.error}`);
    console.info("[upload-ocr] extraction-fallback", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      failure_point: "signed-url-request-failed",
      signed_url_error: signedUrlResult.error,
    });
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    debugPayload.parsed_fields = fallbackData;
    debugPayload.mapped_fields = mapToTrackPodPayload(fallbackData);
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] mapped-trackpod-fields", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      mapped_fields: mapToTrackPodPayload(fallbackData),
      source: "filename-fallback",
    });
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }

  try {
    const response = await fetch(signedUrlResult.signedUrl);
    if (!response.ok) {
      debugPayload.extraction_method = "filename-fallback";
      debugPayload.parser_errors.push(`signed-url-fetch-non-200: ${response.status}`);
      console.info("[upload-ocr] extraction-fallback", {
        draft_job_id: metadata.jobId,
        document_id: metadata.documentId,
        failure_point: "signed-url-fetch-non-200",
        status: response.status,
      });
      const fallbackData = buildReviewData(metadata, "", fallbackDocType);
      debugPayload.parsed_fields = fallbackData;
      debugPayload.mapped_fields = mapToTrackPodPayload(fallbackData);
      publishOcrDebugPayload(debugPayload);
      console.info("[upload-ocr] mapped-trackpod-fields", {
        draft_job_id: metadata.jobId,
        document_id: metadata.documentId,
        mapped_fields: mapToTrackPodPayload(fallbackData),
        source: "filename-fallback",
      });
      return { success: true, data: fallbackData, source: "filename-fallback" };
    }

    const buffer = await response.arrayBuffer();
    const text = await decodeVisibleText(buffer);
    debugPayload.extraction_method = "signed-url";
    debugPayload.raw_text_length = text.length;
    debugPayload.raw_text_preview_500 = text.slice(0, 500);
    console.info("[upload-ocr] raw-ocr-text", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      text_length: text.length,
      text_preview: text.slice(0, 500),
    });

    const docType = detectSupportedDocumentType(metadata.fileName, text) ?? fallbackDocType;
    let data: OcrReviewData;
    try {
      data = buildReviewData(metadata, text, docType);
    } catch (error) {
      debugPayload.parser_errors.push(
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
    const mapped = mapToTrackPodPayload(data);
    debugPayload.parsed_fields = data;
    debugPayload.mapped_fields = mapped;
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] parsed-review-data", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      parsed_fields: data,
      source: "signed-url",
    });
    console.info("[upload-ocr] mapped-trackpod-fields", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      mapped_fields: mapped,
      source: "signed-url",
    });

    return {
      success: true,
      data,
      source: "signed-url",
    };
  } catch (error) {
    debugPayload.extraction_method = debugPayload.extraction_method === "unresolved" ? "filename-fallback" : debugPayload.extraction_method;
    debugPayload.parser_errors.push(
      error instanceof Error ? error.message : String(error)
    );
    console.info("[upload-ocr] extraction-fallback", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      failure_point: "signed-url-fetch-exception",
    });
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    debugPayload.parsed_fields = fallbackData;
    debugPayload.mapped_fields = mapToTrackPodPayload(fallbackData);
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] mapped-trackpod-fields", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      mapped_fields: mapToTrackPodPayload(fallbackData),
      source: "filename-fallback",
    });
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }
}