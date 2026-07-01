import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  normalizeCatalogueKey,
  normalizeCatalogueQuery,
  type CatalogueItemInput,
} from "@/lib/catalogue";

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

async function resolveMerchantId(request: NextRequest, privilegedClient: ReturnType<typeof createPrivilegedClient>) {
  const searchParams = request.nextUrl.searchParams;
  const merchantId = searchParams.get("merchant_id")?.trim() ?? "";
  if (merchantId) return merchantId;

  const token = parseBearerToken(request);
  if (!token || !privilegedClient) return "";

  const authClient = createAuthClient();
  if (!authClient) return "";

  const {
    data: { user },
  } = await authClient.auth.getUser(token);

  if (!user) return "";

  const { data: profile } = await privilegedClient
    .from("profiles")
    .select("company_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return profile?.company_id ?? "";
}

export async function GET(request: NextRequest) {
  const privilegedClient = createPrivilegedClient();
  if (!privilegedClient) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const merchantId = await resolveMerchantId(request, privilegedClient);
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant scope" }, { status: 400 });
  }

  const query = normalizeCatalogueQuery(request.nextUrl.searchParams.get("query") ?? "");
  const itemType = request.nextUrl.searchParams.get("item_type")?.trim() || "";

  let dbQuery = privilegedClient
    .from("merchant_catalogue_items")
    .select("id, merchant_id, item_type, sku, name, description, default_price, vat_rate, xero_account_code, xero_tax_code, active, created_at, updated_at")
    .eq("merchant_id", merchantId)
    .order("name", { ascending: true })
    .limit(20);

  if (itemType) {
    dbQuery = dbQuery.eq("item_type", itemType);
  }

  if (query) {
    dbQuery = dbQuery.or(`name.ilike.%${query}%,description.ilike.%${query}%,sku.ilike.%${query}%`);
  }

  const { data, error } = await dbQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const privilegedClient = createPrivilegedClient();
  if (!privilegedClient) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const merchantId = await resolveMerchantId(request, privilegedClient);
  if (!merchantId) {
    return NextResponse.json({ error: "Missing merchant scope" }, { status: 400 });
  }

  const body = (await request.json().catch(() => ({}))) as Partial<CatalogueItemInput>;
  const name = normalizeCatalogueQuery(body.name ?? "");
  const description = normalizeCatalogueQuery(body.description ?? body.name ?? "");
  const itemType = body.item_type ?? "product";

  if (!name) {
    return NextResponse.json({ error: "Catalogue item name is required" }, { status: 400 });
  }

  const payload = {
    merchant_id: merchantId,
    item_type: itemType,
    sku: body.sku?.trim() ? body.sku.trim() : null,
    name,
    description,
    default_price: Number.isFinite(body.default_price as number) ? (body.default_price as number) : 0,
    vat_rate: Number.isFinite(body.vat_rate as number) ? (body.vat_rate as number) : 0,
    xero_account_code: body.xero_account_code?.trim() ? body.xero_account_code.trim() : null,
    xero_tax_code: body.xero_tax_code?.trim() ? body.xero_tax_code.trim() : null,
    active: body.active ?? true,
  };

  const { data: existingBySku } = payload.sku
    ? await privilegedClient
        .from("merchant_catalogue_items")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("sku", payload.sku)
        .maybeSingle()
    : { data: null };

  const { data: existingByName } = !existingBySku && !payload.sku
    ? await privilegedClient
        .from("merchant_catalogue_items")
        .select("id")
        .eq("merchant_id", merchantId)
        .eq("item_type", payload.item_type)
        .eq("name", payload.name)
        .maybeSingle()
    : { data: null };

  const existingId = existingBySku?.id ?? existingByName?.id ?? null;

  if (existingId) {
    const { data, error } = await privilegedClient
      .from("merchant_catalogue_items")
      .update(payload)
      .eq("id", existingId)
      .select("id, merchant_id, item_type, sku, name, description, default_price, vat_rate, xero_account_code, xero_tax_code, active, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  }

  const { data, error } = await privilegedClient
    .from("merchant_catalogue_items")
    .insert(payload)
    .select("id, merchant_id, item_type, sku, name, description, default_price, vat_rate, xero_account_code, xero_tax_code, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
