import {
  requestMerchantDocumentSignedUrl,
  type UploadedDocumentMetadata,
} from "@/lib/supabaseClient";

export type SupportedDocumentType =
  | "purchase_order"
  | "delivery_note"
  | "order_form";

export type OrderType = "Collection" | "Delivery";

export type PriorityLevel = "Not Set" | "High" | "Normal" | "Low";

export type OcrReviewData = {
  documentType: SupportedDocumentType;
  orderReference: string;
  orderType: OrderType;
  collectionDate: string;
  deliveryDate: string;
  merchantShipper: string;
  customer: string;
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
  delivery_date: string;
  merchant_shipper: string;
  customer: string;
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
  delivery_notes: string;
};

function toTitleCase(input: string): string {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function normalizeCurrency(value: string | null | undefined): string {
  if (!value) return "£0.00";
  const cleaned = value.replace(/[^0-9.,-]/g, "").replace(/,/g, "");
  const amount = Number.parseFloat(cleaned);
  if (!Number.isFinite(amount)) return "£0.00";
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

function pickFirst(text: string, patterns: RegExp[]): string {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return "";
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

function decodeVisibleText(buffer: ArrayBuffer): string {
  const raw = new TextDecoder("latin1").decode(new Uint8Array(buffer));
  return raw
    .replace(/\\[rn]/g, "\n")
    .replace(/[^\x20-\x7E\n\r]/g, " ")
    .replace(/[ \t]{2,}/g, " ")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 2)
    .slice(0, 1200)
    .join("\n");
}

function inferFromFileName(fileName: string): Pick<OcrReviewData, "orderReference" | "customer"> {
  const base = fileName.replace(/\.[a-z0-9]+$/i, "");
  const tokens = base.split(/[-_\s]+/).filter(Boolean);
  const orderToken = tokens.find((token) => /^[A-Za-z0-9]{4,}$/.test(token));

  return {
    orderReference: orderToken ? orderToken.toUpperCase() : "",
    customer: tokens.length > 1 ? toTitleCase(tokens.slice(0, 2).join(" ")) : "",
  };
}

function buildReviewData(
  metadata: UploadedDocumentMetadata,
  text: string,
  docType: SupportedDocumentType
): OcrReviewData {
  const fileInference = inferFromFileName(metadata.fileName);

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

  return {
    documentType: docType,
    orderReference:
      pickFirst(text, [
        /order\s*(?:reference|ref|number|no\.?|#)\s*[:\-]\s*([A-Za-z0-9\-\/]+)/i,
        /po\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
      ]) || fileInference.orderReference,
    orderType: orderTypeText.toLowerCase() === "collection" ? "Collection" : "Delivery",
    collectionDate: normalizeDate(
      pickFirst(text, [
        /collection\s*date\s*[:\-]\s*([^\n]+)/i,
        /collect\s*on\s*[:\-]\s*([^\n]+)/i,
      ])
    ),
    deliveryDate: normalizeDate(
      pickFirst(text, [
        /delivery\s*date\s*[:\-]\s*([^\n]+)/i,
        /delivery\s*(?:by|on)\s*[:\-]?\s*([^\n]+)/i,
      ])
    ),
    merchantShipper: pickFirst(text, [
      /(?:merchant|shipper|sender|from)\s*[:\-]\s*([^\n]+)/i,
    ]),
    customer:
      pickFirst(text, [
        /(?:customer|consignee|deliver\s*to|ship\s*to)\s*[:\-]\s*([^\n]+)/i,
      ]) || fileInference.customer,
    collectionAddress: pickFirst(text, [
      /collection\s*address\s*[:\-]\s*([^\n]+)/i,
      /collect\s*from\s*[:\-]\s*([^\n]+)/i,
    ]),
    deliveryAddress: pickFirst(text, [
      /delivery\s*address\s*[:\-]\s*([^\n]+)/i,
      /deliver\s*to\s*[:\-]\s*([^\n]+)/i,
    ]),
    contactName: pickFirst(text, [
      /contact\s*(?:name)?\s*[:\-]\s*([^\n]+)/i,
    ]),
    telephone: pickFirst(text, [
      /(?:telephone|phone|tel|mobile)\s*[:\-]\s*([+()0-9\s-]{6,})/i,
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
    priority,
    cashOnDelivery: normalizeCurrency(codRaw),
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
    delivery_date: data.deliveryDate,
    merchant_shipper: data.merchantShipper,
    customer: data.customer,
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
    delivery_notes: data.notes,
  };
}

export async function extractUploadToOcrReviewData(
  metadata: UploadedDocumentMetadata
): Promise<OcrExtractionResult> {
  const fallbackDocType = detectSupportedDocumentType(metadata.fileName, "");
  if (!fallbackDocType) {
    return {
      success: false,
      error:
        "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
    };
  }

  const signedUrlResult = await requestMerchantDocumentSignedUrl(metadata.documentId);
  if (!signedUrlResult.success) {
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }

  try {
    const response = await fetch(signedUrlResult.signedUrl);
    if (!response.ok) {
      const fallbackData = buildReviewData(metadata, "", fallbackDocType);
      return { success: true, data: fallbackData, source: "filename-fallback" };
    }

    const buffer = await response.arrayBuffer();
    const text = decodeVisibleText(buffer);
    const docType = detectSupportedDocumentType(metadata.fileName, text) ?? fallbackDocType;
    const data = buildReviewData(metadata, text, docType);

    return {
      success: true,
      data,
      source: "signed-url",
    };
  } catch {
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }
}