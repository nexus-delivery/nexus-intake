import type { ModelItArtifactKind } from "@/lib/modelIt/types";

export const MODEL_IT_ARTIFACTS: Array<{
  kind: ModelItArtifactKind;
  label: string;
  description: string;
}> = [
  {
    kind: "document_template",
    label: "Document Templates",
    description: "Define merchant-specific document layouts and extraction zones.",
  },
  {
    kind: "ocr_mapping_rule",
    label: "OCR Mapping Rules",
    description: "Map extracted text to canonical NEXUS fields.",
  },
  {
    kind: "booking_form",
    label: "Booking Forms",
    description: "Build merchant-controlled booking forms and field requirements.",
  },
  {
    kind: "public_web_form",
    label: "Public Web Forms",
    description: "Configure external form capture for public bookings.",
  },
  {
    kind: "workflow_rule",
    label: "Workflow Rules",
    description: "Set collection, delivery and exception flows by merchant.",
  },
  {
    kind: "validation_rule",
    label: "Validation Rules",
    description: "Configure field-level and process validation constraints.",
  },
  {
    kind: "pricing_rule",
    label: "Pricing Rules",
    description: "Define default pricing, charge logic and overrides.",
  },
  {
    kind: "collection_rule",
    label: "Collection Rules",
    description: "Merchant-specific collection windows, handling and requirements.",
  },
  {
    kind: "delivery_rule",
    label: "Delivery Rules",
    description: "Delivery SLA, scheduling and operational policies.",
  },
  {
    kind: "warehouse_rule",
    label: "Warehouse Rules",
    description: "Default warehouse routing and handling logic.",
  },
  {
    kind: "notification_rule",
    label: "Notification Rules",
    description: "Configure recipient channels and event-driven messages.",
  },
  {
    kind: "api_mapping_rule",
    label: "API Mapping Rules",
    description: "Map NEXUS fields to partner API payloads.",
  },
  {
    kind: "trackpod_mapping",
    label: "Track-POD Mapping",
    description: "Merchant-specific Track-POD field mapping and transformations.",
  },
  {
    kind: "xero_mapping",
    label: "Xero / Accounts Mapping",
    description: "Map transport and billing outputs into accounting fields.",
  },
  {
    kind: "status_mapping",
    label: "Status Mapping",
    description: "Normalize merchant lifecycle states to NEXUS statuses.",
  },
  {
    kind: "business_rule",
    label: "Business Rules",
    description: "Capture merchant operational logic without code changes.",
  },
];

export const MODEL_IT_PHASE_ONE_STARTERS = [
  {
    merchantKey: "blb-home-group",
    modelKey: "merchant.blb_home_group.purchase_order.v1",
    documentType: "purchase_order",
    focus: [
      "Order No",
      "Reference",
      "Collection",
      "Delivery",
      "RTC Date",
      "Delivery Date",
      "Goods",
      "Contact Details",
      "Pricing",
    ],
  },
  {
    merchantKey: "doorway",
    modelKey: "merchant.doorway.delivery_note.v1",
    documentType: "delivery_note",
    focus: [
      "Independent layout learning",
      "Delivery Note field mapping",
      "Awaiting Doorway sample document",
    ],
  },
] as const;
