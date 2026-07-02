import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: NextRequest) {
  const token = (request.nextUrl.searchParams.get("token") ?? "").trim();
  if (!token) {
    return NextResponse.json({ error: "Invite token is required" }, { status: 400 });
  }

  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: invite, error: inviteError } = await client
    .from("merchant_customer_invitations")
    .select("id, company_id, merchant_customer_id, email, expires_at, accepted_at")
    .eq("invite_token", token)
    .maybeSingle<{
      id: string;
      company_id: string;
      merchant_customer_id: string;
      email: string;
      expires_at: string;
      accepted_at: string | null;
    }>();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.accepted_at) {
    return NextResponse.json({ error: "Invite has already been accepted" }, { status: 409 });
  }

  const expiresAt = Date.parse(invite.expires_at);
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  const { data: customer } = await client
    .from("merchant_customers")
    .select("customer_name, contact_name")
    .eq("id", invite.merchant_customer_id)
    .eq("company_id", invite.company_id)
    .maybeSingle<{ customer_name: string; contact_name: string | null }>();

  return NextResponse.json({
    invite: {
      email: invite.email,
      customerName: customer?.customer_name ?? "Customer",
      contactName: customer?.contact_name ?? null,
      expiresAt: invite.expires_at,
      companyId: invite.company_id,
    },
  });
}
