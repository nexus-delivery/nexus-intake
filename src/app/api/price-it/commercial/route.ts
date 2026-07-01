import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function toAmount(value: number, decimals = 2): number {
  return Number(value.toFixed(decimals));
}

export async function GET(request: NextRequest) {
  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const merchantId = request.nextUrl.searchParams.get("merchant_id")?.trim() ?? "";
  const catalogueItemId = request.nextUrl.searchParams.get("catalogue_item_id")?.trim() ?? "";

  if (!merchantId || !catalogueItemId) {
    return NextResponse.json({ error: "Missing merchant_id or catalogue_item_id" }, { status: 400 });
  }

  const { data: rate, error: rateError } = await client
    .from("merchant_price_it_commercial")
    .select("net_price, vat_rate, handling_fee_percent, active")
    .eq("merchant_id", merchantId)
    .eq("catalogue_item_id", catalogueItemId)
    .eq("active", true)
    .maybeSingle();

  if (rateError) {
    return NextResponse.json({ error: rateError.message }, { status: 500 });
  }

  if (!rate) {
    const { data: catalogueItem, error: catalogueError } = await client
      .from("merchant_catalogue_items")
      .select("default_price, vat_rate")
      .eq("merchant_id", merchantId)
      .eq("id", catalogueItemId)
      .eq("active", true)
      .maybeSingle();

    if (catalogueError) {
      return NextResponse.json({ error: catalogueError.message }, { status: 500 });
    }

    if (!catalogueItem) {
      return NextResponse.json({ error: "No commercial pricing found" }, { status: 404 });
    }

    const net = Number(catalogueItem.default_price ?? 0);
    const vatRate = Number(catalogueItem.vat_rate ?? 0);
    const total = net + (net * vatRate) / 100;

    return NextResponse.json({
      item: {
        net: toAmount(net),
        vatRate: toAmount(vatRate),
        total: toAmount(total),
      },
    });
  }

  const net = Number(rate.net_price ?? 0);
  const vatRate = Number(rate.vat_rate ?? 0);
  const total = net + (net * vatRate) / 100;

  return NextResponse.json({
    item: {
      net: toAmount(net),
      vatRate: toAmount(vatRate),
      total: toAmount(total),
    },
  });
}

export async function POST(request: NextRequest) {
  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    merchant_id?: string;
    catalogue_item_id?: string;
    net_price?: number;
    vat_rate?: number;
    handling_fee_percent?: number;
    active?: boolean;
  };

  const merchantId = body.merchant_id?.trim() ?? "";
  const catalogueItemId = body.catalogue_item_id?.trim() ?? "";

  if (!merchantId || !catalogueItemId) {
    return NextResponse.json({ error: "Missing merchant_id or catalogue_item_id" }, { status: 400 });
  }

  const payload = {
    merchant_id: merchantId,
    catalogue_item_id: catalogueItemId,
    net_price: Number.isFinite(body.net_price as number) ? body.net_price : 0,
    vat_rate: Number.isFinite(body.vat_rate as number) ? body.vat_rate : 0,
    handling_fee_percent: Number.isFinite(body.handling_fee_percent as number)
      ? body.handling_fee_percent
      : 5,
    active: body.active ?? true,
  };

  const { data, error } = await client
    .from("merchant_price_it_commercial")
    .upsert(payload, { onConflict: "merchant_id,catalogue_item_id" })
    .select("id, merchant_id, catalogue_item_id, net_price, vat_rate, handling_fee_percent, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
