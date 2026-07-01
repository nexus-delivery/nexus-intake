import {
  requestMerchantDocumentSignedUrl,
  type UploadedDocumentMetadata,
} from "@/lib/supabaseClient";
import {
  applyOcrModel,
  identifyOcrModel,
} from "@/lib/modelIt/ocrModelRegistry";
import type {
  OcrReviewData,
  OrderType,
  PriorityLevel,
  SupportedDocumentType,
  TrackPodMappedPayload,
} from "@/lib/modelIt/ocrSchema";

export type OcrExtractionResult =
  | {
      success: true;
      data: OcrReviewData;
      source: "signed-url";
    }
  | {
      success: false;
      error: string;
    };

export type OcrDebugPayload = {
  draft_job_id: string;
  document_id: string;
  filename: string;
  model_key: string;
  model_version: number;
  model_workspace: string;
  model_status: "active" | "awaiting_sample";
  model_confidence: "high" | "medium" | "low";
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

export type {
  OcrReviewData,
  OrderType,
  PriorityLevel,
  SupportedDocumentType,
  TrackPodMappedPayload,
};

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

export function formatDocumentTypeLabel(documentType: SupportedDocumentType): string {
  if (documentType === "purchase_order") return "Purchase Order";
  if (documentType === "delivery_note") return "Delivery Note";
  return "Order Form";
}

export function mapToTrackPodPayload(data: OcrReviewData): TrackPodMappedPayload {
  return {
    order_reference: data.orderReference,
    trading_name: data.tradingName,
    order_type: data.orderType,
    collection_date: data.collectionDate,
    collection_date_confidence: data.collectionDateConfidence,
    delivery_date: data.deliveryDate,
    delivery_date_confidence: data.deliveryDateConfidence,
    merchant_shipper: data.merchantShipper,
    customer: data.customer,
    collection_name: data.collectionName,
    collection_address: data.collectionAddress,
    delivery_name: data.deliveryName,
    delivery_address: data.deliveryAddress,
    contact_name: data.contactName,
    delivery_phone: data.deliveryPhone,
    telephone: data.telephone,
    delivery_email: data.deliveryEmail,
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
    model_key: "unresolved",
    model_version: 0,
    model_workspace: "unresolved",
    model_status: "active",
    model_confidence: "low",
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

  const signedUrlResult = await requestMerchantDocumentSignedUrl(metadata.documentId);
  if (!signedUrlResult.success) {
    debugPayload.extraction_method = "signed-url-unavailable";
    debugPayload.parser_errors.push(`signed-url-request-failed: ${signedUrlResult.error}`);
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] extraction-failure", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      failure_point: "signed-url-request-failed",
      signed_url_error: signedUrlResult.error,
    });
    return {
      success: false,
      error: "Unable to access uploaded document for OCR extraction.",
    };
  }

  try {
    const response = await fetch(signedUrlResult.signedUrl);
    if (!response.ok) {
      debugPayload.extraction_method = "signed-url-fetch-failed";
      debugPayload.parser_errors.push(`signed-url-fetch-non-200: ${response.status}`);
      publishOcrDebugPayload(debugPayload);
      console.info("[upload-ocr] extraction-failure", {
        draft_job_id: metadata.jobId,
        document_id: metadata.documentId,
        failure_point: "signed-url-fetch-non-200",
        status: response.status,
      });
      return {
        success: false,
        error: "Unable to download uploaded document for OCR extraction.",
      };
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

    const docType = detectSupportedDocumentType(metadata.fileName, text);
    if (!docType) {
      debugPayload.extraction_method = "unsupported-document-type";
      debugPayload.parser_errors.push("unsupported-document-type");
      publishOcrDebugPayload(debugPayload);
      return {
        success: false,
        error:
          "Unsupported document type. Upload it supports only Purchase Order, Delivery Note, or Order Form.",
      };
    }

    const selection = identifyOcrModel({
      metadata,
      rawText: text,
      documentType: docType,
    });
    debugPayload.model_key = selection.model.modelKey;
    debugPayload.model_version = selection.model.version;
    debugPayload.model_workspace = selection.model.workspaceKey;
    debugPayload.model_status = selection.model.readinessStatus;
    debugPayload.model_confidence = selection.confidence;
    let data: OcrReviewData;
    try {
      data = applyOcrModel(selection, {
        metadata,
        rawText: text,
        documentType: docType,
      });
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
    debugPayload.extraction_method =
      debugPayload.extraction_method === "unresolved"
        ? "signed-url-fetch-exception"
        : debugPayload.extraction_method;
    debugPayload.parser_errors.push(
      error instanceof Error ? error.message : String(error)
    );
    publishOcrDebugPayload(debugPayload);
    console.info("[upload-ocr] extraction-failure", {
      draft_job_id: metadata.jobId,
      document_id: metadata.documentId,
      failure_point: "signed-url-fetch-exception",
    });
    return {
      success: false,
      error: "OCR extraction failed for the uploaded document.",
    };
  }
}