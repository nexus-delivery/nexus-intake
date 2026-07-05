/**
 * NEXUS Unified Intake Service
 *
 * ONE intake process. MANY entry points. ONE operational workflow.
 *
 * Every order source (Merchant Portal, Public Booking Form, WooCommerce,
 * API, CSV Import, Admin Entry, Mobile App) maps its input to IntakeOrderInput
 * and calls processIntake(). The result is always the same operational object
 * stored in draft_jobs, ready for Route Planning, Warehouse, Driver App,
 * Track-POD, Xero, POD, and Notifications.
 *
 * Usage:
 *   import { processIntake, type IntakeOrderInput } from "@/lib/intake/intakeService";
 *   const result = await processIntake(input, supabasePrivilegedClient);
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { IntakeSourceSystem } from "./standardOrder";
import { evaluateFutureDeliveryHold } from "@/lib/orderLifecycle";

export type { IntakeSourceSystem };

// ---------------------------------------------------------------------------
// Canonical intake types
// ---------------------------------------------------------------------------

export type IntakeStop = {
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
  latitude?: string;
  longitude?: string;
};

export type IntakeGoodsItem = {
  description: string;
  productCode?: string;
  quantity: number;
  packages: number;
  palletCount: number;
  weightKg: number;
  dimensions?: string;
  unitPrice?: number;
  vatRate?: number;
  lineTotal?: number;
  // Service options
  fragile?: boolean;
  twoMan?: boolean;
  roomOfChoice?: boolean;
  assembly?: boolean;
  tailLiftRequired?: boolean;
  dedicatedVehicle?: boolean;
  northernIrelandDelivery?: boolean;
  sameDay?: boolean;
  // Catalogue linkage
  catalogueItemId?: string;
  itemType?: string;
};

export type IntakeCommercial = {
  purchaseOrder?: string;
  net?: string;
  vat?: string;
  total?: string;
  cod?: string;
  invoiceRequired?: boolean;
};

export type IntakeOperations = {
  depot?: string;
  warehouse?: string;
  route?: string;
  shipper?: string;
  serviceType?: string;
  readyForTrackPod?: boolean;
  adminReleaseOverride?: boolean;
  distanceKm?: string;
  journeyMinutes?: string;
};

export type IntakeOrderInput = {
  // Source context
  sourceSystem: IntakeSourceSystem;
  collectionMode?: "depot" | "new_address";
  companyId: string;
  createdByUserId?: string | null;
  customerId?: string | null;
  bookingProfileId?: string | null;
  bookingProfileName?: string | null;
  salesChannelId?: string | null;
  salesChannelName?: string | null;
  externalOrderId?: string | null;
  orderReference?: string | null;
  orderNumber?: string | null;

  // Customer / order identity
  customer?: string;
  merchant?: string;
  priority?: "High" | "Normal" | "Low";
  notes?: string;

  // Logistics — required for operational readiness
  collection: IntakeStop;
  delivery: IntakeStop;

  // Goods — at least one item required
  goods: IntakeGoodsItem[];

  // Optional commercial data (for Xero invoicing)
  commercial?: IntakeCommercial;

  // Optional ops data (admin / internal only)
  operations?: IntakeOperations;
};

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type IntakeValidationError = {
  field: string;
  message: string;
};

export type IntakeResult =
  | {
      success: true;
      jobId: string;
      jobReference: string;
  lifecycleStatus: "READY_FOR_TRACKPOD" | "REVIEW_REQUIRED" | "HELD_FUTURE_DATE";
    }
  | {
      success: false;
      error: string;
      validationErrors?: IntakeValidationError[];
    };

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

export function validateIntakeOrder(input: IntakeOrderInput): IntakeValidationError[] {
  const errors: IntakeValidationError[] = [];

  if (!input.companyId?.trim()) {
    errors.push({ field: "companyId", message: "Company ID is required" });
  }
  if (!input.collection.addressLine1?.trim()) {
    errors.push({ field: "collection.addressLine1", message: "Collection address is required" });
  }
  if (!input.delivery.addressLine1?.trim()) {
    errors.push({ field: "delivery.addressLine1", message: "Delivery address is required" });
  }
  if (!input.goods.some((g) => g.description?.trim())) {
    errors.push({ field: "goods", message: "At least one goods description is required" });
  }

  return errors;
}

export function isTrackPodReady(input: IntakeOrderInput): boolean {
  const releaseApproved = input.operations?.readyForTrackPod !== false;
  return Boolean(
    releaseApproved &&
    input.collection.addressLine1?.trim() &&
    input.delivery.addressLine1?.trim() &&
    input.goods.some((g) => g.description?.trim())
  );
}

function toIsoDate(value: Date | null): string | null {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Sales channel resolution (company-scoped, upsert by name)
// ---------------------------------------------------------------------------

async function resolveSalesChannel(args: {
  client: SupabaseClient;
  companyId: string;
  channelId?: string | null;
  channelName?: string | null;
}): Promise<{ id: string | null; name: string | null }> {
  const { client, companyId, channelId, channelName } = args;
  const normalizedName = channelName?.trim() ?? "";

  // If we have both id and name, trust them
  if (channelId && normalizedName) {
    return { id: channelId, name: normalizedName };
  }

  // No name → no channel
  if (!normalizedName) {
    return { id: channelId ?? null, name: null };
  }

  // Look up by company + name
  const { data: existing, error: lookupError } = await client
    .from("sales_channels")
    .select("id, name")
    .eq("company_id", companyId)
    .ilike("name", normalizedName)
    .maybeSingle();

  if (lookupError) {
    throw new Error(`Sales channel lookup failed: ${lookupError.message}`);
  }

  if (existing?.id) {
    return { id: existing.id as string, name: (existing.name as string) ?? normalizedName };
  }

  // Create new channel
  const { data: created, error: createError } = await client
    .from("sales_channels")
    .insert({ company_id: companyId, name: normalizedName })
    .select("id, name")
    .single();

  if (createError) {
    throw new Error(`Sales channel create failed: ${createError.message}`);
  }

  return { id: created.id as string, name: (created.name as string) ?? normalizedName };
}

// ---------------------------------------------------------------------------
// Reference generation
// ---------------------------------------------------------------------------

function generateJobReference(jobId: string): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = jobId.replace(/-/g, "").slice(-5).toUpperCase();
  return `NEX-${date}-${suffix}`;
}

// ---------------------------------------------------------------------------
// Build the TrackPOD-ready mapping (stored in integration_metadata)
// ---------------------------------------------------------------------------

function buildTrackPodMapping(input: IntakeOrderInput, ref: string): Record<string, unknown> {
  const primary = input.goods[0];
  const goodsDescription = input.goods
    .map((g) => g.description?.trim())
    .filter(Boolean)
    .join(" | ");

  const joinAddress = (stop: IntakeStop): string =>
    [stop.addressLine1, stop.addressLine2, stop.addressLine3, stop.postcode, stop.country]
      .map((p) => p?.trim())
      .filter(Boolean)
      .join("\n");

  return {
    order_reference: ref,
    order_number: input.orderNumber ?? "",
    external_order_id: input.externalOrderId ?? "",
    booking_profile_id: input.bookingProfileId ?? "",
    booking_profile_name: input.bookingProfileName ?? "",
    source_system: input.sourceSystem,
    collection_mode: input.collectionMode ?? "new_address",
    sales_channel_name: input.salesChannelName ?? "",
    customer: input.customer ?? "",
    merchant_name: input.merchant ?? "",
    workspace_name: input.merchant ?? "",
    priority: input.priority ?? "Normal",
    notes: input.notes ?? "",
    collection_name: input.collection.company,
    collection_contact: input.collection.contact,
    collection_address: joinAddress(input.collection),
    collection_phone: input.collection.phone,
    collection_email: input.collection.email,
    collection_date: input.collection.date,
    collection_time: input.collection.time,
    collection_instructions: input.collection.instructions,
    collection_latitude: input.collection.latitude ?? "",
    collection_longitude: input.collection.longitude ?? "",
    delivery_name: input.delivery.company,
    delivery_contact: input.delivery.contact,
    delivery_address: joinAddress(input.delivery),
    delivery_phone: input.delivery.phone,
    delivery_email: input.delivery.email,
    delivery_date: input.delivery.date,
    delivery_time: input.delivery.time,
    delivery_instructions: input.delivery.instructions,
    delivery_latitude: input.delivery.latitude ?? "",
    delivery_longitude: input.delivery.longitude ?? "",
    goods_description: goodsDescription || "General goods",
    quantity: String(primary?.quantity ?? 0),
    packages: String(primary?.packages ?? 0),
    pallet_count: String(primary?.palletCount ?? 0),
    weight_kg: String(primary?.weightKg ?? 0),
    dimensions: primary?.dimensions ?? "",
    fragile: String(Boolean(primary?.fragile)),
    two_man: String(Boolean(primary?.twoMan)),
    room_of_choice: String(Boolean(primary?.roomOfChoice)),
    assembly: String(Boolean(primary?.assembly)),
    tail_lift_required: String(Boolean(primary?.tailLiftRequired)),
    dedicated_vehicle: String(Boolean(primary?.dedicatedVehicle)),
    northern_ireland_delivery: String(Boolean(primary?.northernIrelandDelivery)),
    same_day: String(Boolean(primary?.sameDay)),
    purchase_order: input.commercial?.purchaseOrder ?? "",
    net_amount: input.commercial?.net ?? "",
    vat_amount: input.commercial?.vat ?? "",
    total_amount: input.commercial?.total ?? "",
    cod: input.commercial?.cod ?? "",
    invoice_required: String(Boolean(input.commercial?.invoiceRequired)),
    depot: input.operations?.depot ?? "",
    warehouse: input.operations?.warehouse ?? "",
    route: input.operations?.route ?? "",
    shipper: input.operations?.shipper ?? input.collection.company,
    service_type: input.operations?.serviceType ?? "",
    route_distance_km: input.operations?.distanceKm ?? "",
    journey_time_minutes: input.operations?.journeyMinutes ?? "",
  };
}

// ---------------------------------------------------------------------------
// Build service_options JSONB for storage
// ---------------------------------------------------------------------------

function buildServiceOptions(goods: IntakeGoodsItem[]): Record<string, boolean> {
  const primary = goods[0] ?? {};
  return {
    fragile: Boolean(primary.fragile),
    two_man: Boolean(primary.twoMan),
    room_of_choice: Boolean(primary.roomOfChoice),
    assembly: Boolean(primary.assembly),
    tail_lift_required: Boolean(primary.tailLiftRequired),
    dedicated_vehicle: Boolean(primary.dedicatedVehicle),
    northern_ireland_delivery: Boolean(primary.northernIrelandDelivery),
    same_day: Boolean(primary.sameDay),
  };
}

// ---------------------------------------------------------------------------
// Main processIntake function
// ---------------------------------------------------------------------------

export async function processIntake(
  input: IntakeOrderInput,
  privilegedClient: SupabaseClient
): Promise<IntakeResult> {
  // 1. Validate
  const validationErrors = validateIntakeOrder(input);
  if (validationErrors.length > 0) {
    return {
      success: false,
      error: validationErrors.map((e) => e.message).join("; "),
      validationErrors,
    };
  }

  try {
    // 2. Resolve sales channel
    const salesChannel = await resolveSalesChannel({
      client: privilegedClient,
      companyId: input.companyId,
      channelId: input.salesChannelId,
      channelName: input.salesChannelName,
    });

    // 3. Determine lifecycle status
    const futureDateHold = evaluateFutureDeliveryHold(input.delivery.date);
    const lifecycleStatus: "READY_FOR_TRACKPOD" | "REVIEW_REQUIRED" | "HELD_FUTURE_DATE" =
      futureDateHold.shouldHoldDelivery
        ? "HELD_FUTURE_DATE"
        : isTrackPodReady(input)
          ? "READY_FOR_TRACKPOD"
          : "REVIEW_REQUIRED";

    // 4. Aggregate goods totals
    const totalQuantity = input.goods.reduce((s, g) => s + (g.quantity ?? 0), 0);
    const totalPackages = input.goods.reduce((s, g) => s + (g.packages ?? 0), 0);
    const totalPalletCount = input.goods.reduce((s, g) => s + (g.palletCount ?? 0), 0);
    const totalWeightKg = input.goods.reduce((s, g) => s + (g.weightKg ?? 0), 0);
    const goodsDescription = input.goods
      .map((g) => g.description?.trim())
      .filter(Boolean)
      .join(" | ") || "General goods";

    // 5. Insert draft_job
    // NOTE: Columns below require migration 20260702090000_intake_operational_columns.sql
    // to be applied on the live DB before this code is deployed.
    const { data: inserted, error: insertError } = await privilegedClient
      .from("draft_jobs")
      .insert({
        company_id: input.companyId,
        created_by_user_id: input.createdByUserId ?? null,
        status: "job_created",
        lifecycle_status: lifecycleStatus,
        customer_id: input.customerId ?? null,
        booking_profile_id: input.bookingProfileId ?? null,
        customer_email: input.delivery.email || null,
        sales_channel_id: salesChannel.id,
        sales_channel_name: salesChannel.name,
        // Source
        source_system: input.sourceSystem,
        external_order_id: input.externalOrderId ?? null,
        customer: input.customer ?? null,
        priority: input.priority ?? "Normal",
        notes: input.notes ?? null,
        // Collection
        collection_company: input.collection.company || null,
        collection_contact: input.collection.contact || null,
        collection_address_line1: input.collection.addressLine1 || null,
        collection_address_line2: input.collection.addressLine2 || null,
        collection_address_line3: input.collection.addressLine3 || null,
        collection_postcode: input.collection.postcode || null,
        collection_country: input.collection.country || "UK",
        collection_phone: input.collection.phone || null,
        collection_email: input.collection.email || null,
        collection_instructions: input.collection.instructions || null,
        collection_latitude: input.collection.latitude || null,
        collection_longitude: input.collection.longitude || null,
        // Delivery
        delivery_company: input.delivery.company || null,
        delivery_contact: input.delivery.contact || null,
        delivery_address_line1: input.delivery.addressLine1 || null,
        delivery_address_line2: input.delivery.addressLine2 || null,
        delivery_address_line3: input.delivery.addressLine3 || null,
        delivery_postcode: input.delivery.postcode || null,
        delivery_country: input.delivery.country || "UK",
        delivery_phone: input.delivery.phone || null,
        delivery_email: input.delivery.email || null,
        delivery_instructions: input.delivery.instructions || null,
        delivery_latitude: input.delivery.latitude || null,
        delivery_longitude: input.delivery.longitude || null,
        // Requested dates (existing columns)
        requested_collection_date: input.collection.date || null,
        requested_collection_time: input.collection.time || null,
        requested_delivery_date: input.delivery.date || null,
        requested_delivery_time: input.delivery.time || null,
        // Goods summary
        goods_description: goodsDescription,
        total_quantity: totalQuantity || null,
        total_packages: totalPackages || null,
        total_pallet_count: totalPalletCount || null,
        total_weight_kg: totalWeightKg || null,
        service_options: buildServiceOptions(input.goods),
        // Commercial
        purchase_order: input.commercial?.purchaseOrder || null,
        commercial_net: input.commercial?.net || null,
        commercial_vat: input.commercial?.vat || null,
        commercial_total: input.commercial?.total || null,
        commercial_cod: input.commercial?.cod || null,
        invoice_required: input.commercial?.invoiceRequired ?? false,
        pricing_profile: input.commercial?.purchaseOrder || null,
        default_service: input.operations?.serviceType || null,
        // Operations
        depot: input.operations?.depot || null,
        warehouse: input.operations?.warehouse || null,
        route_name: input.operations?.route || null,
        shipper: input.operations?.shipper || null,
        service_type: input.operations?.serviceType || null,
        route_distance_km: input.operations?.distanceKm || null,
        journey_time_minutes: input.operations?.journeyMinutes || null,
      })
      .select("id")
      .single();

    if (insertError || !inserted?.id) {
      console.error("[intakeService] draft_jobs insert failed", {
        companyId: input.companyId,
        sourceSystem: input.sourceSystem,
        error: insertError,
      });
      return {
        success: false,
        error: insertError?.message ?? "Failed to create job record",
      };
    }

    const jobId = inserted.id as string;
    const jobReference = input.orderReference?.trim() || generateJobReference(jobId);
    const trackPodMapping = buildTrackPodMapping(
      { ...input, salesChannelName: salesChannel.name ?? input.salesChannelName },
      jobReference
    );

    // 6. Update with reference + integration_metadata (full snapshot for TrackPOD push)
    // Includes a standardOrder-compatible key for backward compatibility with
    // jobs/confirm (which reads integration_metadata.standardOrder for Xero lines).
    const { error: updateError } = await privilegedClient
      .from("draft_jobs")
      .update({
        job_reference: jobReference,
        integration_metadata: {
          source: "nexus_intake_v2",
          sourceSystem: input.sourceSystem,
          collectionMode: input.collectionMode ?? "new_address",
          bookingProfileId: input.bookingProfileId ?? null,
          bookingProfileName: input.bookingProfileName ?? null,
          orderNumber: input.orderNumber ?? null,
          trackPodMapping,
          goods: input.goods,
          commercial: input.commercial ?? {},
          operations: input.operations ?? {},
          // Backward-compatible key read by jobs/confirm for Xero commercial lines
          standardOrder: {
            goods: input.goods.map((g) => ({
              description: g.description,
              quantity: g.quantity ?? 0,
              unitPrice: g.unitPrice ?? 0,
              lineTotal: g.lineTotal ?? 0,
              vatRate: g.vatRate ?? 0,
              productCode: g.productCode ?? "",
              packages: g.packages ?? 0,
              palletCount: g.palletCount ?? 0,
              weightKg: g.weightKg ?? 0,
              dimensions: g.dimensions ?? "",
              fragile: g.fragile ?? false,
              twoMan: g.twoMan ?? false,
              roomOfChoice: g.roomOfChoice ?? false,
              assembly: g.assembly ?? false,
              tailLiftRequired: g.tailLiftRequired ?? false,
              dedicatedVehicle: g.dedicatedVehicle ?? false,
              northernIrelandDelivery: g.northernIrelandDelivery ?? false,
              sameDay: g.sameDay ?? false,
              catalogueItemId: g.catalogueItemId ?? "",
              itemType: g.itemType ?? "product",
              photosRequired: false,
            })),
          },
          releasePolicy: {
            status: futureDateHold.shouldHoldDelivery ? "held_future_date" : "ready",
            requestedDeliveryDate: input.delivery.date || null,
            workingDaysUntilDelivery: futureDateHold.workingDaysUntilDelivery,
            autoReleaseDate: toIsoDate(futureDateHold.autoReleaseDate),
          },
          lifecycle: {
            collectionReleasedAt: null,
            collectionConfirmedAt: null,
            deliveryReleasedAt: null,
            adminOverrideUsed: false,
          },
        },
      })
      .eq("id", jobId);

    if (updateError) {
      console.error("[intakeService] metadata update failed", { jobId, error: updateError });
      // Non-fatal: the job was created, reference can be patched later
    }

    return {
      success: true,
      jobId,
      jobReference,
      lifecycleStatus,
    };
  } catch (error) {
    console.error("[intakeService] unhandled error", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Internal intake error",
    };
  }
}
