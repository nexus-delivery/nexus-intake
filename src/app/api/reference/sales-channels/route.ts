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

function normalizeName(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export async function GET(request: NextRequest) {
  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const companyId = request.nextUrl.searchParams.get("company_id")?.trim() ?? "";
  if (!companyId) {
    return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
  }

  const query = normalizeName(request.nextUrl.searchParams.get("query") ?? "");
  const merchantId = request.nextUrl.searchParams.get("merchant_id")?.trim() || null;

  let dbQuery = client
    .from("sales_channels")
    .select("id, company_id, merchant_id, name, source_type, active, created_at, updated_at")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(12);

  if (merchantId) {
    dbQuery = dbQuery.or(`merchant_id.is.null,merchant_id.eq.${merchantId}`);
  }

  if (query) {
    dbQuery = dbQuery.ilike("name", `%${query}%`);
  }

  const { data, error } = await dbQuery;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: NextRequest) {
  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    company_id?: string;
    merchant_id?: string | null;
    name?: string;
    source_type?: string | null;
    active?: boolean;
  };

  const companyId = body.company_id?.trim() ?? "";
  const name = normalizeName(body.name ?? "");
  if (!companyId) {
    return NextResponse.json({ error: "Missing company ID" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Sales channel name is required" }, { status: 400 });
  }

  const merchantId = body.merchant_id?.trim() || null;

  let existingQuery = client
    .from("sales_channels")
    .select("id, company_id, merchant_id, name, source_type, active, created_at, updated_at")
    .eq("company_id", companyId)
    .ilike("name", name);

  existingQuery = merchantId
    ? existingQuery.eq("merchant_id", merchantId)
    : existingQuery.is("merchant_id", null);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing?.id) {
    const { data, error } = await client
      .from("sales_channels")
      .update({
        source_type: body.source_type ?? existing.source_type,
        active: body.active ?? existing.active,
        name,
      })
      .eq("id", existing.id)
      .select("id, company_id, merchant_id, name, source_type, active, created_at, updated_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ item: data });
  }

  const { data, error } = await client
    .from("sales_channels")
    .insert({
      company_id: companyId,
      merchant_id: merchantId,
      name,
      source_type: body.source_type ?? null,
      active: body.active ?? true,
    })
    .select("id, company_id, merchant_id, name, source_type, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
