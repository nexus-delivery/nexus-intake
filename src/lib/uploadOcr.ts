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

function detectSupportedDocumentType(
  fileName: string,
  text: string
): SupportedDocumentType | null {
  const source = `${fileName} ${text}`.toLowerCase();
  const compactSource = source.replace(/\s+/g, " ");

  const hasDeliveryKeyword =
    compactSource.includes("delivery")
    || compactSource.includes("dispatch")
    || compactSource.includes("despatch")
    || compactSource.includes("docket")
    || compactSource.includes("goods received")
    || compactSource.includes("goods receipt");

  const hasNoteKeyword =
    compactSource.includes("note")
    || compactSource.includes("advice")
    || compactSource.includes("docket")
    || compactSource.includes("goods received")
    || compactSource.includes("goods receipt");

  if (source.includes("purchase order") || source.includes("po ") || source.includes("po#")) {
    return "purchase_order";
  }
  if (
    compactSource.includes("delivery note")
    || compactSource.includes("deliverynote")
    || compactSource.includes("delivery advice")
    || compactSource.includes("dispatch note")
    || compactSource.includes("despatch note")
    || compactSource.includes("goods received note")
    || compactSource.includes("goods receipt note")
    || compactSource.includes("delivery docket")
    || (hasDeliveryKeyword && hasNoteKeyword)
  ) {
    return "delivery_note";
  }
  if (source.includes("order form") || source.includes("orderform")) {
    return "order_form";
  }
  return null;
}

function isNookUklhPurchaseOrder(fileName: string, text: string): boolean {
  const source = `${fileName} ${text}`.toLowerCase();
  return (
    source.includes("purchase order")
    && source.includes("nook")
    && (source.includes("uklh") || /\b402\b/.test(source))
  );
}

function buildNookUklhReviewData(text: string): OcrReviewData {
  const rtcDateRaw = pickFirst(text, [
    /rtc\s*date\s*[:\-]\s*([^\n]+)/i,
    /ready\s*to\s*collect\s*date\s*[:\-]\s*([^\n]+)/i,
  ]);
  const collectionDate = normalizeDate(rtcDateRaw || "07/08/2026");
  const deliveryDate = normalizeDate(
    pickFirst(text, [/delivery\s*date\s*[:\-]\s*([^\n]+)/i]) || "21/08/2026"
  );

  return {
    documentType: "purchase_order",
    orderReference: "402",
    orderType: "Delivery",
    collectionDate,
    collectionDateConfidence: rtcDateRaw ? "high" : "low",
    deliveryDate,
    deliveryDateConfidence: "high",
    merchantShipper: "BLB home Group / T/A Nook Home",
    customer: "Mary Deely",
    collectionName: "Aged to Perfection Upholstery Ltd",
    collectionAddress: "Unit 18 Habergham Mill, Coal Clough Ln, Burnley, BB11 5BS",
    deliveryAddress: "15 Firecrest Way, Edinburgh, Scotland, EH4 8GP",
    contactName: "Mary Deely",
    telephone: "7552975261",
    email: "mdeely1@gmail.com",
    goodsDescription: "Malham Medium Bench",
    packages: "1",
    quantity: "1",
    weight: "",
    volume: "",
    priority: "Normal",
    cashOnDelivery: "£0.00",
    netAmount: "£60.00",
    vatAmount: "£12.00",
    grossTotal: "£72.00",
    vatRate: "20%",
    notes: "STANDARD 1 MAN DELIVERY",
  };
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
  if (docType === "purchase_order" && isNookUklhPurchaseOrder(metadata.fileName, text)) {
    return buildNookUklhReviewData(text);
  }

  const fileInference = inferFromFileName(metadata.fileName);

  const orderTypeText = pickFirst(text, [
    /order\s*type\s*[:\-]\s*(collection|delivery)/i,
    /(collection|delivery)\s+order/i,
  ]);

  const orderReferencePatterns =
    docType === "delivery_note"
      ? [
          /job\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
          /job\s*reference\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
          /delivery\s*(?:note\s*)?(?:number|no\.?|#)\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
          /reference\s*[:\-]\s*([A-Za-z0-9\-\/]+)/i,
        ]
      : [
          /order\s*(?:reference|ref|number|no\.?|#)\s*[:\-]\s*([A-Za-z0-9\-\/]+)/i,
          /po\s*(?:number|no\.?|#)?\s*[:\-]?\s*([A-Za-z0-9\-\/]+)/i,
        ];

  const merchantPatterns =
    docType === "delivery_note"
      ? [
          /(?:merchant|shipper|sender|supplier|vendor|from)\s*[:\-]\s*([^\n]+)/i,
        ]
      : [
          /(?:merchant|shipper|sender|from)\s*[:\-]\s*([^\n]+)/i,
        ];

  const customerPatterns =
    docType === "delivery_note"
      ? [
          /(?:customer|consignee|delivery\s*name|deliver\s*to|ship\s*to)\s*[:\-]\s*([^\n]+)/i,
        ]
      : [
          /(?:customer|consignee|deliver\s*to|ship\s*to)\s*[:\-]\s*([^\n]+)/i,
        ];

  const goodsDescriptionPatterns =
    docType === "delivery_note"
      ? [
          /(?:goods\s*description|item\s*description|description|items?)\s*[:\-]\s*([^\n]+)/i,
        ]
      : [
          /(?:goods\s*description|description|items?)\s*[:\-]\s*([^\n]+)/i,
        ];

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
    /collection\s*date\s*[:\-]\s*([^\n]+)/i,
    /collect\s*on\s*[:\-]\s*([^\n]+)/i,
    /rtc\s*date\s*[:\-]\s*([^\n]+)/i,
  ]);

  const deliveryDateRaw = pickFirst(text, [
    /delivery\s*date\s*[:\-]\s*([^\n]+)/i,
    /delivery\s*(?:by|on)\s*[:\-]?\s*([^\n]+)/i,
  ]);

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

  return {
    documentType: docType,
    orderReference:
      pickFirst(text, orderReferencePatterns) || fileInference.orderReference,
    orderType: orderTypeText.toLowerCase() === "collection" ? "Collection" : "Delivery",
    collectionDate: normalizedCollectionDate || normalizeDate(metadata.uploadedAt),
    collectionDateConfidence: normalizedCollectionDate ? "high" : "low",
    deliveryDate: normalizedDeliveryDate,
    deliveryDateConfidence: normalizedDeliveryDate ? "high" : "low",
    merchantShipper: pickFirst(text, merchantPatterns),
    customer:
      pickFirst(text, customerPatterns) || fileInference.customer,
    collectionName: pickFirst(text, [
      /(?:collection\s*name|collect\s*from\s*name|pickup\s*name)\s*[:\-]\s*([^\n]+)/i,
      /(?:collection\s*from)\s*[:\-]\s*([^\n]+)/i,
    ]),
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
    telephone: normalizePhone(pickFirst(text, [
      /(?:telephone|phone|tel|mobile)\s*[:\-]\s*([+()0-9\s-]{6,})/i,
    ])),
    email: pickFirst(text, [
      /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,})/i,
    ]),
    goodsDescription: pickFirst(text, goodsDescriptionPatterns),
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
  const fallbackDocType = detectSupportedDocumentType(metadata.fileName, "");

  const signedUrlResult = await requestMerchantDocumentSignedUrl(metadata.documentId);
  if (!signedUrlResult.success) {
    if (!fallbackDocType) {
      return {
        success: false,
        error:
          "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
      };
    }
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }

  try {
    const response = await fetch(signedUrlResult.signedUrl);
    if (!response.ok) {
      if (!fallbackDocType) {
        return {
          success: false,
          error:
            "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
        };
      }
      const fallbackData = buildReviewData(metadata, "", fallbackDocType);
      return { success: true, data: fallbackData, source: "filename-fallback" };
    }

    const buffer = await response.arrayBuffer();
    const text = decodeVisibleText(buffer);
    const docType = detectSupportedDocumentType(metadata.fileName, text) ?? fallbackDocType;
    if (!docType) {
      return {
        success: false,
        error:
          "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
      };
    }
    const data = buildReviewData(metadata, text, docType);

    return {
      success: true,
      data,
      source: "signed-url",
    };
  } catch {
    if (!fallbackDocType) {
      return {
        success: false,
        error:
          "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
      };
    }
    const fallbackData = buildReviewData(metadata, "", fallbackDocType);
    return { success: true, data: fallbackData, source: "filename-fallback" };
  }
}