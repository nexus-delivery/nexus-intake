/**
 * POST /api/intake/orders
 *
 * Unified intake endpoint — accepts orders from any source system.
 * Delegates all business logic to intakeService.processIntake().
 *
 * Body shape:
 *   {
 *     order: StandardOrder  (from form/adapter)
 *     company_id?: string   (resolved from auth token if not provided)
 *     sales_channel_id?: string
 *     sales_channel_name?: string
 *     merchant_id?: string  (used for goods catalogue linkage only)
 *   }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  sanitizeStandardOrder,
  toIntakeOrderInput,
} from "@/lib/intake/standardOrder";
import { processIntake } from "@/lib/intake/intakeService";
import { notifyOrderCreated } from "@/lib/notify/orderCreated";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function createAuthClient() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseBearerToken(req: NextRequest): string {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
}

export async function POST(request: NextRequest) {
  try {
    const authClient = createAuthClient();
    const privilegedClient = createPrivilegedClient();

    if (!authClient || !privilegedClient) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      order?: unknown;
      company_id?: string;
      customer_id?: string;
      booking_profile_id?: string;
      booking_profile_name?: string;
      merchant_id?: string;
      sales_channel_id?: string;
      sales_channel_name?: string;
    };

    // Resolve company + user from auth token if not explicitly provided
    let companyId = body.company_id?.trim() || "";
    let userId: string | null = null;
    const token = parseBearerToken(request);

    if (token) {
      const {
        data: { user },
      } = await authClient.auth.getUser(token);
      userId = user?.id ?? null;

      if (userId && !companyId) {
        const { data: profile } = await privilegedClient
          .from("profiles")
          .select("company_id")
          .eq("auth_user_id", userId)
          .maybeSingle();
        companyId = profile?.company_id ?? "";
      }
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "No company linked to this intake request. Sign in or provide company_id." },
        { status: 403 }
      );
    }

    // Sanitize and adapt to canonical intake input
    const order = sanitizeStandardOrder(body.order);
    const intakeInput = toIntakeOrderInput(order, {
      companyId,
      createdByUserId: userId,
      customerId: body.customer_id?.trim() || null,
      bookingProfileId: body.booking_profile_id?.trim() || null,
      bookingProfileName: body.booking_profile_name?.trim() || null,
      salesChannelId: body.sales_channel_id?.trim() || null,
      salesChannelName: body.sales_channel_name?.trim() || order.salesChannel.trim() || null,
    });

    // Delegate to the unified intake service
    const result = await processIntake(intakeInput, privilegedClient);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // One NEXUS customer confirmation only: order successfully created.
    // Operational updates are delegated to Track-POD.
    await notifyOrderCreated({
      client: privilegedClient,
      draftJobId: result.jobId,
      companyId,
      orderReference: result.jobReference,
      customerName: order.delivery.contact || order.delivery.company || order.customer,
      customerEmail: order.delivery.email || order.collection.email,
      customerPhone: order.delivery.phone || order.collection.phone,
    });

    return NextResponse.json({
      success: true,
      jobId: result.jobId,
      jobReference: result.jobReference,
      lifecycleStatus: result.lifecycleStatus,
    });
  } catch (error) {
    console.error("[intake/orders] unhandled error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
