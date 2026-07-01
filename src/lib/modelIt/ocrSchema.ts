export type SupportedDocumentType =
  | "purchase_order"
  | "delivery_note"
  | "order_form";

export type OrderType = "Collection" | "Delivery" | "";

export type PriorityLevel = "Not Set" | "High" | "Normal" | "Low";

export type OcrReviewData = {
  documentType: SupportedDocumentType;
  orderReference: string;
  tradingName: string;
  orderType: OrderType;
  collectionDate: string;
  collectionDateConfidence: "high" | "low";
  deliveryDate: string;
  deliveryDateConfidence: "high" | "low";
  merchantShipper: string;
  customer: string;
  collectionName: string;
  collectionAddress: string;
  deliveryName: string;
  deliveryAddress: string;
  contactName: string;
  deliveryPhone: string;
  telephone: string;
  deliveryEmail: string;
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

export type TrackPodMappedPayload = {
  order_reference: string;
  trading_name: string;
  order_type: OrderType;
  collection_date: string;
  collection_date_confidence: "high" | "low";
  delivery_date: string;
  delivery_date_confidence: "high" | "low";
  merchant_shipper: string;
  customer: string;
  collection_name: string;
  collection_address: string;
  delivery_name: string;
  delivery_address: string;
  contact_name: string;
  delivery_phone: string;
  telephone: string;
  delivery_email: string;
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