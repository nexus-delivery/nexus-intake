export type IntakeSourceSystem =
  | "merchant_portal"
  | "public_webform"
  | "embedded_webform"
  | "internal_order_entry"
  | "telephone_order"
  | "email_order"
  | "woocommerce"
  | "shopify"
  | "ocr_future";

export type StandardGoodsItem = {
  description: string;
  quantity: number;
  packages: number;
  palletCount: number;
  weightKg: number;
  dimensions: string;
  fragile: boolean;
  twoMan: boolean;
  roomOfChoice: boolean;
  assembly: boolean;
  photosRequired: boolean;
};

export type StandardStop = {
  company: string;
  contact: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  country: string;
  phone: string;
  email: string;
  date: string;
  time: string;
  instructions: string;
};

export type StandardCommercial = {
  purchaseOrder: string;
  net: string;
  vat: string;
  total: string;
  cod: string;
  invoiceRequired: boolean;
};

export type StandardOperations = {
  depot: string;
  warehouse: string;
  route: string;
  shipper: string;
  serviceType: string;
  readyForTrackPod: boolean;
};

export type StandardOrder = {
  orderReference: string;
  externalOrderId: string;
  sourceSystem: IntakeSourceSystem;
  salesChannel: string;
  merchant: string;
  customer: string;
  status: string;
  priority: "Low" | "Normal" | "High";
  notes: string;
  collection: StandardStop;
  delivery: StandardStop;
  goods: StandardGoodsItem[];
  commercial: StandardCommercial;
  operations: StandardOperations;
};

function toNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toBool(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "true" || normalized === "1" || normalized === "yes";
  }
  return false;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function createEmptyStandardOrder(sourceSystem: IntakeSourceSystem): StandardOrder {
  return {
    orderReference: "",
    externalOrderId: "",
    sourceSystem,
    salesChannel: "",
    merchant: "",
    customer: "",
    status: "pending_review",
    priority: "Normal",
    notes: "",
    collection: {
      company: "",
      contact: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      postcode: "",
      country: "UK",
      phone: "",
      email: "",
      date: "",
      time: "",
      instructions: "",
    },
    delivery: {
      company: "",
      contact: "",
      addressLine1: "",
      addressLine2: "",
      addressLine3: "",
      postcode: "",
      country: "UK",
      phone: "",
      email: "",
      date: "",
      time: "",
      instructions: "",
    },
    goods: [
      {
        description: "",
        quantity: 1,
        packages: 0,
        palletCount: 0,
        weightKg: 0,
        dimensions: "",
        fragile: false,
        twoMan: false,
        roomOfChoice: false,
        assembly: false,
        photosRequired: false,
      },
    ],
    commercial: {
      purchaseOrder: "",
      net: "",
      vat: "",
      total: "",
      cod: "",
      invoiceRequired: false,
    },
    operations: {
      depot: "",
      warehouse: "",
      route: "",
      shipper: "",
      serviceType: "",
      readyForTrackPod: false,
    },
  };
}

export function sanitizeStandardOrder(input: unknown): StandardOrder {
  const source = (input ?? {}) as Partial<StandardOrder>;
  const empty = createEmptyStandardOrder(
    (typeof source.sourceSystem === "string" ? source.sourceSystem : "merchant_portal") as IntakeSourceSystem
  );

  return {
    ...empty,
    orderReference: toText(source.orderReference),
    externalOrderId: toText(source.externalOrderId),
    sourceSystem: empty.sourceSystem,
    salesChannel: toText(source.salesChannel),
    merchant: toText(source.merchant),
    customer: toText(source.customer),
    status: toText(source.status) || "pending_review",
    priority:
      toText(source.priority) === "High"
        ? "High"
        : toText(source.priority) === "Low"
          ? "Low"
          : "Normal",
    notes: toText(source.notes),
    collection: {
      ...empty.collection,
      ...(source.collection ?? {}),
      company: toText(source.collection?.company),
      contact: toText(source.collection?.contact),
      addressLine1: toText(source.collection?.addressLine1),
      addressLine2: toText(source.collection?.addressLine2),
      addressLine3: toText(source.collection?.addressLine3),
      postcode: toText(source.collection?.postcode),
      country: toText(source.collection?.country) || "UK",
      phone: toText(source.collection?.phone),
      email: toText(source.collection?.email),
      date: toText(source.collection?.date),
      time: toText(source.collection?.time),
      instructions: toText(source.collection?.instructions),
    },
    delivery: {
      ...empty.delivery,
      ...(source.delivery ?? {}),
      company: toText(source.delivery?.company),
      contact: toText(source.delivery?.contact),
      addressLine1: toText(source.delivery?.addressLine1),
      addressLine2: toText(source.delivery?.addressLine2),
      addressLine3: toText(source.delivery?.addressLine3),
      postcode: toText(source.delivery?.postcode),
      country: toText(source.delivery?.country) || "UK",
      phone: toText(source.delivery?.phone),
      email: toText(source.delivery?.email),
      date: toText(source.delivery?.date),
      time: toText(source.delivery?.time),
      instructions: toText(source.delivery?.instructions),
    },
    goods: Array.isArray(source.goods) && source.goods.length > 0
      ? source.goods.map((item) => ({
          description: toText(item.description),
          quantity: toNumber(item.quantity),
          packages: toNumber(item.packages),
          palletCount: toNumber(item.palletCount),
          weightKg: toNumber(item.weightKg),
          dimensions: toText(item.dimensions),
          fragile: toBool(item.fragile),
          twoMan: toBool(item.twoMan),
          roomOfChoice: toBool(item.roomOfChoice),
          assembly: toBool(item.assembly),
          photosRequired: toBool(item.photosRequired),
        }))
      : empty.goods,
    commercial: {
      ...empty.commercial,
      ...(source.commercial ?? {}),
      purchaseOrder: toText(source.commercial?.purchaseOrder),
      net: toText(source.commercial?.net),
      vat: toText(source.commercial?.vat),
      total: toText(source.commercial?.total),
      cod: toText(source.commercial?.cod),
      invoiceRequired: toBool(source.commercial?.invoiceRequired),
    },
    operations: {
      ...empty.operations,
      ...(source.operations ?? {}),
      depot: toText(source.operations?.depot),
      warehouse: toText(source.operations?.warehouse),
      route: toText(source.operations?.route),
      shipper: toText(source.operations?.shipper),
      serviceType: toText(source.operations?.serviceType),
      readyForTrackPod: toBool(source.operations?.readyForTrackPod),
    },
  };
}

function joinAddress(stop: StandardStop): string {
  return [
    stop.addressLine1,
    stop.addressLine2,
    stop.addressLine3,
    stop.postcode,
    stop.country,
  ]
    .map((part) => part.trim())
    .filter((part) => part.length > 0)
    .join("\n");
}

export function toTrackPodMapping(order: StandardOrder): Record<string, string> {
  const primaryItem = order.goods[0];
  const goodsDescription = order.goods
    .map((item) => item.description.trim())
    .filter((item) => item.length > 0)
    .join(" | ");

  return {
    order_reference: order.orderReference,
    external_order_id: order.externalOrderId,
    source_system: order.sourceSystem,
    sales_channel: order.salesChannel,
    merchant_name: order.merchant,
    customer: order.customer,
    status: order.status,
    priority: order.priority,
    notes: order.notes,
    collection_name: order.collection.company,
    collection_address: joinAddress(order.collection),
    collection_phone: order.collection.phone,
    collection_email: order.collection.email,
    colllection_email: order.collection.email,
    collection_date: order.collection.date,
    collection_time: order.collection.time,
    collection_instructions: order.collection.instructions,
    delivery_name: order.delivery.company,
    delivery_address: joinAddress(order.delivery),
    delivery_phone: order.delivery.phone,
    delivery_email: order.delivery.email,
    delivery_date: order.delivery.date,
    delivery_time: order.delivery.time,
    delivery_instructions: order.delivery.instructions,
    goods_description: goodsDescription || primaryItem?.description || "General goods",
    trackpod_goods: goodsDescription || primaryItem?.description || "General goods",
    quantity: String(primaryItem?.quantity ?? 0),
    packages: String(primaryItem?.packages ?? 0),
    pallet_count: String(primaryItem?.palletCount ?? 0),
    weight_kg: String(primaryItem?.weightKg ?? 0),
    dimensions: primaryItem?.dimensions ?? "",
    fragile: String(Boolean(primaryItem?.fragile)),
    two_man: String(Boolean(primaryItem?.twoMan)),
    room_of_choice: String(Boolean(primaryItem?.roomOfChoice)),
    assembly: String(Boolean(primaryItem?.assembly)),
    photos_required: String(Boolean(primaryItem?.photosRequired)),
    purchase_order: order.commercial.purchaseOrder,
    net_amount: order.commercial.net,
    vat_amount: order.commercial.vat,
    total_amount: order.commercial.total,
    cod: order.commercial.cod,
    invoice_required: String(order.commercial.invoiceRequired),
    depot: order.operations.depot,
    warehouse: order.operations.warehouse,
    route: order.operations.route,
    merchant_shipper: order.operations.shipper || order.collection.company,
    shipper_name: order.operations.shipper || order.collection.company,
    service_type: order.operations.serviceType,
    ready_for_trackpod: String(order.operations.readyForTrackPod),
  };
}
