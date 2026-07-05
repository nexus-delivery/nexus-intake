export type DashboardLifecycleStatus =
  | "Created"
  | "Ready for Operations"
  | "Needs Review"
  | "Ready for Route"
  | "Sent to Track-POD"
  | "Failed to send to Track-POD"
  | "Collected"
  | "Delivered"
  | "Failed / issue";

export type DashboardTrackPodStatus =
  | "Pending"
  | "Sent"
  | "Partial"
  | "Failed"
  | "Not required";

export type DashboardRouteStatus =
  | "Not Planned"
  | "Route in Planning"
  | "Route Confirmed";

export type DashboardRow = {
  id: string;
  companyId: string;
  merchantName: string;
  createdByUserId: string | null;
  internalOrderNumber: string;
  externalOrderReference: string;
  customerMerchant: string;
  collectionName: string;
  collectionAddress: string;
  collectionPostcode: string;
  deliveryName: string;
  deliveryAddress: string;
  deliveryPostcode: string;
  serviceOptions: string[];
  lifecycleStatus: DashboardLifecycleStatus;
  trackPodPushStatus: DashboardTrackPodStatus;
  trackPodDeliveryOrderId: string | null;
  trackPodCollectionOrderId: string | null;
  trackPodDeliveryTrackingUrl: string | null;
  trackPodCollectionTrackingUrl: string | null;
  salesChannelName: string;
  currentStatus: string;
  errorState: string;
  createdAt: string;
  updatedAt: string;
  rawStatus: string;
  rawLifecycleStatus: string;
  requestedCollectionDate: string;
  requestedDeliveryDate: string;
  routeStatus: DashboardRouteStatus;
  routeDate: string;
  etaWindow: string;
  driverName: string;
  vehicleName: string;
  collectionStatus: string;
  deliveryStatus: string;
  podAvailable: boolean;
};

export type DashboardDetail = {
  job: DashboardRow;
  collection: {
    company: string;
    contact: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    postcode: string;
    country: string;
    instructions: string;
    date: string;
    time: string;
  };
  delivery: {
    company: string;
    contact: string;
    phone: string;
    email: string;
    addressLine1: string;
    addressLine2: string;
    addressLine3: string;
    postcode: string;
    country: string;
    instructions: string;
    date: string;
    time: string;
  };
  goods: {
    description: string;
    quantity: string;
    packages: string;
    palletCount: string;
    weightKg: string;
  };
  commercial: {
    purchaseOrder: string;
    net: string;
    vat: string;
    total: string;
    cod: string;
    invoiceRequired: boolean;
  };
  operations: {
    depot: string;
    warehouse: string;
    routeName: string;
    routeStatus: DashboardRouteStatus;
    routeDate: string;
    etaWindow: string;
    driverName: string;
    vehicleName: string;
    shipper: string;
    serviceType: string;
    notes: string;
  };
  documents: {
    url: string;
    filename: string;
    fileType: string;
    storagePath: string;
  };
  timeline: Array<{
    timestamp: string;
    label: string;
    detail: string;
    kind: "event" | "error" | "system";
  }>;
  raw: Record<string, unknown>;
};

export type DraftJobRow = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNullableString(value: unknown): string | null {
  const val = asString(value).trim();
  return val.length > 0 ? val : null;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function pickValue(map: Record<string, string>, ...keys: string[]): string {
  for (const key of keys) {
    const candidate = map[key];
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate.trim();
    }
  }
  return "";
}

function normaliseAddress(parts: string[]): string {
  return parts
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(", ");
}

function parseServiceOptions(serviceOptions: unknown, fields: Record<string, string>): string[] {
  const parsed = asRecord(serviceOptions);
  const optionMap: Array<{ key: string; label: string }> = [
    { key: "fragile", label: "Fragile" },
    { key: "two_man", label: "Two-man" },
    { key: "room_of_choice", label: "Room of choice" },
    { key: "assembly", label: "Assembly" },
    { key: "tail_lift_required", label: "Tail-lift" },
    { key: "dedicated_vehicle", label: "Dedicated vehicle" },
    { key: "northern_ireland_delivery", label: "Northern Ireland" },
    { key: "same_day", label: "Same day" },
  ];

  const active: string[] = [];
  for (const option of optionMap) {
    const inJson = parsed[option.key] === true;
    const inMapping = ["true", "yes", "1"].includes(
      asString(fields[option.key]).trim().toLowerCase()
    );
    if (inJson || inMapping) {
      active.push(option.label);
    }
  }

  return active;
}

function deriveLifecycleStatus(params: {
  status: string;
  lifecycleStatus: string;
  currentStatus: string;
  hasTrackPodDelivery: boolean;
  hasTrackPodCollection: boolean;
  hasTrackPodError: boolean;
}): DashboardLifecycleStatus {
  const rawStatus = params.status.toLowerCase();
  const rawLifecycle = params.lifecycleStatus.toLowerCase();
  const current = params.currentStatus.toLowerCase();

  if (current.includes("delivered")) {
    return "Delivered";
  }

  if (current.includes("collect")) {
    return "Collected";
  }

  if (
    current.includes("failed") ||
    current.includes("exception") ||
    current.includes("issue") ||
    rawLifecycle.includes("failed")
  ) {
    return "Failed / issue";
  }

  if (params.hasTrackPodError || rawLifecycle === "trackpod_error") {
    return "Failed to send to Track-POD";
  }

  if (rawLifecycle === "review_required") {
    return "Needs Review";
  }

  if (params.hasTrackPodDelivery && params.hasTrackPodCollection) {
    return "Sent to Track-POD";
  }

  if (rawLifecycle === "ready_for_route") {
    return "Ready for Route";
  }

  if (
    rawLifecycle === "ready_for_trackpod" ||
    rawStatus === "job_created"
  ) {
    return "Ready for Operations";
  }

  return "Created";
}

function deriveTrackPodPushStatus(params: {
  hasTrackPodDelivery: boolean;
  hasTrackPodCollection: boolean;
  hasTrackPodError: boolean;
}): DashboardTrackPodStatus {
  if (params.hasTrackPodError) {
    return "Failed";
  }
  if (params.hasTrackPodDelivery && params.hasTrackPodCollection) {
    return "Sent";
  }
  if (params.hasTrackPodDelivery || params.hasTrackPodCollection) {
    return "Partial";
  }
  return "Pending";
}

function deriveRouteStatus(job: DraftJobRow): DashboardRouteStatus {
  const explicit = asString(job.route_status).trim().toLowerCase();
  if (explicit === "route_confirmed") return "Route Confirmed";
  if (explicit === "route_in_planning") return "Route in Planning";

  if (asString(job.route_date).trim() || asString(job.eta_window).trim()) {
    return "Route in Planning";
  }

  return "Not Planned";
}

export function buildFieldMap(job: DraftJobRow): Record<string, string> {
  const metadata = asRecord(job.integration_metadata);
  const mapping = asRecord(metadata.trackPodMapping);
  const map: Record<string, string> = {};
  for (const [key, value] of Object.entries(mapping)) {
    if (typeof value === "string") {
      map[key] = value;
    }
  }
  return map;
}

export function toDashboardRow(job: DraftJobRow): DashboardRow {
  const fields = buildFieldMap(job);

  const id = asString(job.id);
  const status = asString(job.status);
  const lifecycleStatus = asString(job.lifecycle_status);
  const currentStatus = asString(job.current_status);
  const trackPodDeliveryOrderId = asNullableString(job.trackpod_delivery_order_id);
  const trackPodCollectionOrderId = asNullableString(job.trackpod_collection_order_id);
  const hasTrackPodError = Boolean(job.trackpod_error_detail) || Boolean(job.trackpod_error_at);

  const collectionName =
    asString(job.collection_company) || pickValue(fields, "collection_name", "shipper");
  const deliveryName =
    asString(job.delivery_company) || pickValue(fields, "delivery_name", "customer");

  const collectionAddress = normaliseAddress([
    asString(job.collection_address_line1) || pickValue(fields, "collection_address"),
    asString(job.collection_address_line2),
    asString(job.collection_address_line3),
  ]);

  const deliveryAddress = normaliseAddress([
    asString(job.delivery_address_line1) || pickValue(fields, "delivery_address"),
    asString(job.delivery_address_line2),
    asString(job.delivery_address_line3),
  ]);

  const internalOrderNumber =
    asString(job.job_reference) || pickValue(fields, "order_reference") || id.slice(0, 8).toUpperCase();

  const externalOrderReference =
    asString(job.external_order_id) || pickValue(fields, "external_order_id");

  const customerMerchant =
    asString(job.customer) ||
    pickValue(fields, "merchant_name", "merchant_shipper", "customer") ||
    collectionName ||
    "-";

  const serviceOptions = parseServiceOptions(job.service_options, fields);

  const lifecycle = deriveLifecycleStatus({
    status,
    lifecycleStatus,
    currentStatus,
    hasTrackPodDelivery: Boolean(trackPodDeliveryOrderId),
    hasTrackPodCollection: Boolean(trackPodCollectionOrderId),
    hasTrackPodError,
  });

  const trackPodPushStatus = deriveTrackPodPushStatus({
    hasTrackPodDelivery: Boolean(trackPodDeliveryOrderId),
    hasTrackPodCollection: Boolean(trackPodCollectionOrderId),
    hasTrackPodError,
  });

  const routeStatus = deriveRouteStatus(job);

  return {
    id,
    companyId: asString(job.company_id),
    merchantName: "",
    createdByUserId: asNullableString(job.created_by_user_id),
    internalOrderNumber,
    externalOrderReference,
    customerMerchant,
    collectionName,
    collectionAddress,
    collectionPostcode: asString(job.collection_postcode),
    deliveryName,
    deliveryAddress,
    deliveryPostcode: asString(job.delivery_postcode),
    serviceOptions,
    lifecycleStatus: lifecycle,
    trackPodPushStatus,
    trackPodDeliveryOrderId,
    trackPodCollectionOrderId,
    trackPodDeliveryTrackingUrl: asNullableString(job.trackpod_delivery_tracking_url),
    trackPodCollectionTrackingUrl: asNullableString(job.trackpod_collection_tracking_url),
    salesChannelName: asString(job.sales_channel_name),
    currentStatus,
    errorState:
      asString(job.trackpod_error_detail && JSON.stringify(job.trackpod_error_detail)) ||
      asString(job.trackpod_error_at),
    createdAt: asString(job.created_at),
    updatedAt: asString(job.updated_at),
    rawStatus: status,
    rawLifecycleStatus: lifecycleStatus,
    requestedCollectionDate: asString(job.requested_collection_date),
    requestedDeliveryDate: asString(job.requested_delivery_date),
    routeStatus,
    routeDate: asString(job.route_date),
    etaWindow: asString(job.eta_window),
    driverName: asString(job.driver_name),
    vehicleName: asString(job.vehicle_name),
    collectionStatus: asString(job.collection_status),
    deliveryStatus: asString(job.delivery_status) || currentStatus,
    podAvailable: job.pod_available === true,
  };
}

export function toDashboardDetail(job: DraftJobRow): DashboardDetail {
  const row = toDashboardRow(job);
  const fields = buildFieldMap(job);
  const timeline: DashboardDetail["timeline"] = [];

  const createdAt = asString(job.created_at);
  if (createdAt) {
    timeline.push({
      timestamp: createdAt,
      label: "Created",
      detail: "Order captured in NEXUS intake",
      kind: "system",
    });
  }

  const attemptedAt = asString(job.trackpod_push_attempted_at);
  if (attemptedAt) {
    timeline.push({
      timestamp: attemptedAt,
      label: "Track-POD push attempted",
      detail: "NEXUS attempted to create Track-POD records",
      kind: "event",
    });
  }

  const completedAt = asString(job.trackpod_push_completed_at);
  if (completedAt) {
    timeline.push({
      timestamp: completedAt,
      label: "Sent to Track-POD",
      detail: "Collection and delivery orders were created",
      kind: "event",
    });
  }

  const errorAt = asString(job.trackpod_error_at);
  if (errorAt) {
    timeline.push({
      timestamp: errorAt,
      label: "Track-POD failure",
      detail:
        asString(job.trackpod_error_detail && JSON.stringify(job.trackpod_error_detail)) ||
        "Track-POD push failed",
      kind: "error",
    });
  }

  return {
    job: row,
    collection: {
      company: asString(job.collection_company) || pickValue(fields, "collection_name"),
      contact: asString(job.collection_contact) || pickValue(fields, "collection_contact"),
      phone: asString(job.collection_phone) || pickValue(fields, "collection_phone"),
      email:
        asString(job.collection_email) ||
        pickValue(fields, "collection_email", "colllection_email"),
      addressLine1:
        asString(job.collection_address_line1) || pickValue(fields, "collection_address"),
      addressLine2: asString(job.collection_address_line2),
      addressLine3: asString(job.collection_address_line3),
      postcode: asString(job.collection_postcode),
      country: asString(job.collection_country),
      instructions:
        asString(job.collection_instructions) || pickValue(fields, "collection_instructions"),
      date: asString(job.requested_collection_date) || pickValue(fields, "collection_date"),
      time: asString(job.requested_collection_time) || pickValue(fields, "collection_time"),
    },
    delivery: {
      company: asString(job.delivery_company) || pickValue(fields, "delivery_name", "customer"),
      contact: asString(job.delivery_contact) || pickValue(fields, "delivery_contact"),
      phone: asString(job.delivery_phone) || pickValue(fields, "delivery_phone"),
      email: asString(job.delivery_email) || pickValue(fields, "delivery_email"),
      addressLine1:
        asString(job.delivery_address_line1) || pickValue(fields, "delivery_address"),
      addressLine2: asString(job.delivery_address_line2),
      addressLine3: asString(job.delivery_address_line3),
      postcode: asString(job.delivery_postcode),
      country: asString(job.delivery_country),
      instructions:
        asString(job.delivery_instructions) || pickValue(fields, "delivery_instructions"),
      date: asString(job.requested_delivery_date) || pickValue(fields, "delivery_date"),
      time: asString(job.requested_delivery_time) || pickValue(fields, "delivery_time"),
    },
    goods: {
      description: asString(job.goods_description) || pickValue(fields, "goods_description"),
      quantity: asString(job.total_quantity) || pickValue(fields, "quantity"),
      packages: asString(job.total_packages) || pickValue(fields, "packages"),
      palletCount: asString(job.total_pallet_count) || pickValue(fields, "pallet_count"),
      weightKg: asString(job.total_weight_kg) || pickValue(fields, "weight_kg"),
    },
    commercial: {
      purchaseOrder: asString(job.purchase_order) || pickValue(fields, "purchase_order"),
      net: asString(job.commercial_net) || pickValue(fields, "net_amount"),
      vat: asString(job.commercial_vat) || pickValue(fields, "vat_amount"),
      total: asString(job.commercial_total) || pickValue(fields, "total_amount"),
      cod: asString(job.commercial_cod) || pickValue(fields, "cod"),
      invoiceRequired: Boolean(job.invoice_required),
    },
    operations: {
      depot: asString(job.depot) || pickValue(fields, "depot"),
      warehouse: asString(job.warehouse) || pickValue(fields, "warehouse"),
      routeName: asString(job.route_name) || pickValue(fields, "route"),
      routeStatus: row.routeStatus,
      routeDate: row.routeDate,
      etaWindow: row.etaWindow,
      driverName: row.driverName,
      vehicleName: row.vehicleName,
      shipper: asString(job.shipper) || pickValue(fields, "shipper", "merchant_shipper"),
      serviceType: asString(job.service_type) || pickValue(fields, "service_type"),
      notes: asString(job.notes) || pickValue(fields, "notes"),
    },
    documents: {
      url: asString(job.document_url),
      filename: asString(job.document_filename),
      fileType: asString(job.document_file_type),
      storagePath: asString(job.document_storage_path),
    },
    timeline,
    raw: job,
  };
}
