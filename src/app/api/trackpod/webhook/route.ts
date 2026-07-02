import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const webhookSecret = process.env.TRACKPOD_WEBHOOK_SECRET ?? "";

type TrackPodEvent = {
  rawType: string;
  normalizedType: string;
  orderReference: string;
  orderId: string;
  podUrl: string;
  timestamp: string;
  note: string;
  payload: Record<string, unknown>;
};

type StatusMapping = {
  currentStatus: string;
  lifecycleStatus: string;
  label: string;
  kind: "event" | "error";
};

type RouteSyncPayload = {
  routeStatus: string;
  routeDate: string;
  etaWindow: string;
  etaFrom: string;
  etaTo: string;
  driverName: string;
  vehicleName: string;
  collectionStatus: string;
  deliveryStatus: string;
  podAvailable: boolean;
};

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toIso(value: string): string {
  if (!value) return new Date().toISOString();
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function normalizeStatus(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function firstText(payload: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = text(payload[key]);
    if (value) return value;
  }
  return "";
}

function toRouteStatus(value: string, normalizedType: string): string {
  const normalizedValue = normalizeStatus(value);

  if (
    normalizedValue.includes("confirmed") ||
    normalizedType.includes("route_confirmed") ||
    normalizedType.includes("driver_assigned")
  ) {
    return "Route Confirmed";
  }

  if (
    normalizedValue.includes("planning") ||
    normalizedValue.includes("provisional") ||
    normalizedType.includes("route_in_planning") ||
    normalizedType.includes("collection_booked") ||
    normalizedType.includes("collection_created") ||
    normalizedType.includes("out_for_delivery")
  ) {
    return "Route in Planning";
  }

  return "";
}

function parseRouteSync(event: TrackPodEvent): RouteSyncPayload {
  const payload = event.payload;

  const routeDate = firstText(payload, [
    "routeDate",
    "route_date",
    "RouteDate",
    "plannedDate",
    "PlannedDate",
    "date",
    "Date",
  ]);

  const etaWindow = firstText(payload, [
    "etaWindow",
    "eta_window",
    "ETAWindow",
    "eta",
    "ETA",
    "timeWindow",
    "TimeWindow",
  ]);

  const etaFrom = firstText(payload, [
    "etaFrom",
    "eta_from",
    "ETAFrom",
    "windowStart",
    "WindowStart",
  ]);

  const etaTo = firstText(payload, [
    "etaTo",
    "eta_to",
    "ETATo",
    "windowEnd",
    "WindowEnd",
  ]);

  const driverName = firstText(payload, [
    "driverName",
    "driver_name",
    "DriverName",
    "driver",
    "Driver",
  ]);

  const vehicleName = firstText(payload, [
    "vehicleName",
    "vehicle_name",
    "VehicleName",
    "vehicle",
    "Vehicle",
  ]);

  const explicitRouteStatus = firstText(payload, [
    "routeStatus",
    "route_status",
    "RouteStatus",
    "planningStatus",
    "PlanningStatus",
  ]);

  const collectionStatus = firstText(payload, [
    "collectionStatus",
    "collection_status",
    "CollectionStatus",
  ]);

  const deliveryStatus = firstText(payload, [
    "deliveryStatus",
    "delivery_status",
    "DeliveryStatus",
    "status",
    "Status",
  ]);

  const podAvailable = Boolean(
    event.podUrl ||
      normalizeStatus(deliveryStatus).includes("pod") ||
      event.normalizedType.includes("pod") ||
      event.normalizedType.includes("proof_of_delivery")
  );

  return {
    routeStatus: toRouteStatus(explicitRouteStatus || deliveryStatus, event.normalizedType),
    routeDate,
    etaWindow,
    etaFrom,
    etaTo,
    driverName,
    vehicleName,
    collectionStatus,
    deliveryStatus,
    podAvailable,
  };
}

function parseOrderReference(payload: Record<string, unknown>): string {
  const raw =
    text(payload.orderReference) ||
    text(payload.order_reference) ||
    text(payload.Number) ||
    text(payload.number) ||
    text(payload.Reference) ||
    text(payload.reference) ||
    text(payload.Id) ||
    text(payload.id) ||
    text(payload.orderId) ||
    text(payload.order_id);

  if (!raw) return "";
  if (!raw.includes("/")) return raw;
  const segments = raw.split("/").map((item) => item.trim()).filter(Boolean);
  return segments[segments.length - 1] ?? raw;
}

function parseTrackPodEvent(rawPayload: unknown): TrackPodEvent {
  const payload = asRecord(rawPayload);
  const rawType =
    text(payload.status) ||
    text(payload.Status) ||
    text(payload.event) ||
    text(payload.Event) ||
    text(payload.eventType) ||
    text(payload.EventType);

  const normalizedType = normalizeStatus(rawType);
  const orderReference = parseOrderReference(payload);
  const orderId =
    text(payload.orderId) ||
    text(payload.OrderId) ||
    text(payload.trackPodOrderId) ||
    text(payload.trackpod_order_id) ||
    orderReference;

  const podUrl =
    text(payload.podUrl) ||
    text(payload.pod_url) ||
    text(payload.PODUrl) ||
    text(payload.podLink) ||
    text(payload.pod_link) ||
    text(payload.TrackLink);

  const timestamp = toIso(
    text(payload.timestamp) ||
      text(payload.Timestamp) ||
      text(payload.eventTime) ||
      text(payload.EventTime) ||
      text(payload.updatedAt) ||
      text(payload.UpdatedAt)
  );

  const note =
    text(payload.note) ||
    text(payload.notes) ||
    text(payload.message) ||
    text(payload.Message) ||
    text(payload.detail);

  return {
    rawType,
    normalizedType,
    orderReference,
    orderId,
    podUrl,
    timestamp,
    note,
    payload,
  };
}

function mapStatus(event: TrackPodEvent): StatusMapping {
  const t = event.normalizedType;

  if (t.includes("collection_booked") || t.includes("collection_created")) {
    return {
      currentStatus: "COLLECTION_BOOKED",
      lifecycleStatus: "READY_FOR_ROUTE",
      label: "Collection booked",
      kind: "event",
    };
  }

  if (t.includes("driver_assigned")) {
    return {
      currentStatus: "DRIVER_ASSIGNED",
      lifecycleStatus: "READY_FOR_ROUTE",
      label: "Driver assigned",
      kind: "event",
    };
  }

  if (t.includes("collected")) {
    return {
      currentStatus: "COLLECTED",
      lifecycleStatus: "COLLECTED",
      label: "Collected",
      kind: "event",
    };
  }

  if (t.includes("out_for_delivery")) {
    return {
      currentStatus: "OUT_FOR_DELIVERY",
      lifecycleStatus: "READY_FOR_ROUTE",
      label: "Out for delivery",
      kind: "event",
    };
  }

  if (t.includes("delivered")) {
    return {
      currentStatus: "DELIVERED",
      lifecycleStatus: "DELIVERED",
      label: "Delivered",
      kind: "event",
    };
  }

  if (t.includes("failed_delivery") || t.includes("delivery_failed") || t.includes("failed")) {
    return {
      currentStatus: "FAILED_DELIVERY",
      lifecycleStatus: "ISSUE",
      label: "Failed delivery",
      kind: "error",
    };
  }

  if (t.includes("pod") || t.includes("proof_of_delivery")) {
    return {
      currentStatus: "POD_AVAILABLE",
      lifecycleStatus: "DELIVERED",
      label: "POD available",
      kind: "event",
    };
  }

  return {
    currentStatus: "TRACKPOD_UPDATE",
    lifecycleStatus: "READY_FOR_ROUTE",
    label: event.rawType || "Track-POD update",
    kind: "event",
  };
}

function withMergedMetadata(
  current: unknown,
  event: TrackPodEvent,
  status: StatusMapping
): Record<string, unknown> {
  const metadata = asRecord(current);
  const trackpod = asRecord(metadata.trackpod);
  const history = Array.isArray(trackpod.history) ? [...trackpod.history] : [];

  history.push({
    at: event.timestamp,
    type: event.rawType || event.normalizedType,
    currentStatus: status.currentStatus,
    lifecycleStatus: status.lifecycleStatus,
    podUrl: event.podUrl || null,
    note: event.note || null,
  });

  return {
    ...metadata,
    trackpod: {
      ...trackpod,
      lastEventType: event.rawType || event.normalizedType,
      lastEventAt: event.timestamp,
      lastCurrentStatus: status.currentStatus,
      lastLifecycleStatus: status.lifecycleStatus,
      podUrl: event.podUrl || trackpod.podUrl || null,
      history: history.slice(-150),
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    if (webhookSecret) {
      const incoming = request.headers.get("x-trackpod-webhook-secret")?.trim() ?? "";
      if (!incoming || incoming !== webhookSecret) {
        return NextResponse.json({ error: "Unauthorised webhook" }, { status: 401 });
      }
    }

    const client = createPrivilegedClient();
    if (!client) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const payload = (await request.json().catch(() => ({}))) as unknown;
    const event = parseTrackPodEvent(payload);

    if (!event.orderReference && !event.orderId) {
      return NextResponse.json({ error: "Missing Track-POD order reference" }, { status: 400 });
    }

    const ref = event.orderReference || event.orderId;

    const { data: job, error: jobError } = await client
      .from("draft_jobs")
      .select("id, company_id, integration_metadata, trackpod_delivery_order_id, trackpod_collection_order_id, document_url, route_status, route_date, eta_window, eta_from, eta_to, driver_name, vehicle_name, collection_status, delivery_status, pod_available")
      .or(
        [
          `job_reference.eq.${ref}`,
          `external_order_id.eq.${ref}`,
          `trackpod_delivery_order_id.eq.${ref}`,
          `trackpod_collection_order_id.eq.${ref}`,
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
    if (!job) {
      return NextResponse.json({ accepted: true, ignored: true, reason: "job_not_found" });
    }

    const status = mapStatus(event);
    const routeSync = parseRouteSync(event);
    const mergedMetadata = withMergedMetadata(job.integration_metadata, event, status);

    const updatePayload: Record<string, unknown> = {
      current_status: status.currentStatus,
      lifecycle_status: status.lifecycleStatus,
      route_status:
        routeSync.routeStatus ||
        text(job.route_status) ||
        (routeSync.routeDate || routeSync.etaWindow ? "Route in Planning" : "Not Planned"),
      route_date: routeSync.routeDate || text(job.route_date) || null,
      eta_window: routeSync.etaWindow || text(job.eta_window) || null,
      eta_from: routeSync.etaFrom || text(job.eta_from) || null,
      eta_to: routeSync.etaTo || text(job.eta_to) || null,
      driver_name: routeSync.driverName || text(job.driver_name) || null,
      vehicle_name: routeSync.vehicleName || text(job.vehicle_name) || null,
      collection_status: routeSync.collectionStatus || text(job.collection_status) || null,
      delivery_status: routeSync.deliveryStatus || text(job.delivery_status) || status.currentStatus,
      pod_available: routeSync.podAvailable || job.pod_available === true,
      last_sync: event.timestamp,
      integration_metadata: mergedMetadata,
      updated_at: event.timestamp,
    };

    if (event.podUrl && !text(job.document_url)) {
      updatePayload.document_url = event.podUrl;
      updatePayload.document_filename = "Proof of Delivery";
      updatePayload.document_file_type = "pod";
    }

    const { error: updateError } = await client
      .from("draft_jobs")
      .update(updatePayload)
      .eq("id", job.id)
      .eq("company_id", job.company_id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    try {
      await client.from("discuss_it_timeline").insert({
        company_id: job.company_id,
        draft_job_id: job.id,
        event_type: status.currentStatus,
        event_source: "trackpod_webhook",
        event_summary: event.podUrl
          ? `${status.label} - POD: ${event.podUrl}`
          : status.label,
        payload: {
          rawType: event.rawType,
          normalizedType: event.normalizedType,
          orderReference: event.orderReference,
          orderId: event.orderId,
          podUrl: event.podUrl || null,
          note: event.note || null,
          receivedAt: event.timestamp,
          rawPayload: event.payload,
        },
      });
    } catch {
      // keep webhook non-blocking where timeline table is not available
    }

    return NextResponse.json({
      accepted: true,
      jobId: job.id,
      currentStatus: status.currentStatus,
      lifecycleStatus: status.lifecycleStatus,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
