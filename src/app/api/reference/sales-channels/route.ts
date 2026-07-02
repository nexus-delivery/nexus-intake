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

function normalizeCode(value: string): string {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
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

  let dbQuery = client
    .from("sales_channels")
    .select("id, company_id, name, code, active, created_at")
    .eq("company_id", companyId)
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(12);

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
    name?: string;
    code?: string | null;
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

  const code = normalizeCode(body.code ?? name) || "SALES_CHANNEL";

  const existingQuery = client
    .from("sales_channels")
    .select("id, company_id, name, code, active, created_at")
    .eq("company_id", companyId)
    .ilike("name", name);

  const { data: existing, error: existingError } = await existingQuery.maybeSingle();

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 });
  }

  if (existing?.id) {
    const { data, error } = await client
      .from("sales_channels")
      .update({
        code: code || existing.code,
        active: body.active ?? existing.active,
        name,
      })
      .eq("id", existing.id)
      .select("id, company_id, name, code, active, created_at")
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
      name,
      code,
      active: body.active ?? true,
    })
    .select("id, company_id, name, code, active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data }, { status: 201 });
}
