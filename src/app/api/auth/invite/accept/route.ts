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

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    token?: string;
    userId?: string;
    email?: string;
    fullName?: string;
  };

  const token = (body.token ?? "").trim();
  const userId = (body.userId ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const fullName = (body.fullName ?? "").trim();

  if (!token || !userId || !email) {
    return NextResponse.json(
      { error: "token, userId, and email are required" },
      { status: 400 }
    );
  }

  const client = createPrivilegedClient();
  if (!client) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  const { data: invite, error: inviteError } = await client
    .from("merchant_customer_invitations")
    .select("id, company_id, merchant_customer_id, email, expires_at, accepted_at, accepted_by_user_id")
    .eq("invite_token", token)
    .maybeSingle<{
      id: string;
      company_id: string;
      merchant_customer_id: string;
      email: string;
      expires_at: string;
      accepted_at: string | null;
      accepted_by_user_id: string | null;
    }>();

  if (inviteError || !invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  if (invite.accepted_at) {
    if (invite.accepted_by_user_id === userId) {
      return NextResponse.json({ success: true, destination: "/customer" });
    }
    return NextResponse.json({ error: "Invite has already been accepted" }, { status: 409 });
  }

  const inviteEmail = invite.email.trim().toLowerCase();
  if (inviteEmail !== email) {
    return NextResponse.json(
      { error: "Signup email does not match invite email" },
      { status: 400 }
    );
  }

  const expiresAt = Date.parse(invite.expires_at);
  if (Number.isFinite(expiresAt) && expiresAt < Date.now()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  const { data: merchantCustomer } = await client
    .from("merchant_customers")
    .select("id, customer_name, contact_name, email")
    .eq("id", invite.merchant_customer_id)
    .eq("company_id", invite.company_id)
    .maybeSingle<{
      id: string;
      customer_name: string;
      contact_name: string | null;
      email: string | null;
    }>();

  if (!merchantCustomer?.id) {
    return NextResponse.json({ error: "Merchant customer not found" }, { status: 404 });
  }

  const nowIso = new Date().toISOString();

  const { error: portalUserError } = await client
    .from("customer_portal_users")
    .upsert(
      {
        auth_user_id: userId,
        company_id: invite.company_id,
        merchant_customer_id: invite.merchant_customer_id,
        email,
        full_name: fullName || merchantCustomer.contact_name || merchantCustomer.customer_name,
        invited_at: nowIso,
        accepted_at: nowIso,
        last_sign_in_at: nowIso,
      },
      { onConflict: "auth_user_id" }
    );

  if (portalUserError) {
    return NextResponse.json({ error: portalUserError.message }, { status: 500 });
  }

  const { error: profileError } = await client
    .from("profiles")
    .upsert(
      {
        auth_user_id: userId,
        company_id: invite.company_id,
        role: "customer",
        full_name: fullName || merchantCustomer.contact_name || merchantCustomer.customer_name,
        email,
      },
      { onConflict: "auth_user_id" }
    );

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { error: markAcceptedError } = await client
    .from("merchant_customer_invitations")
    .update({ accepted_at: nowIso, accepted_by_user_id: userId })
    .eq("id", invite.id)
    .is("accepted_at", null);

  if (markAcceptedError) {
    return NextResponse.json({ error: markAcceptedError.message }, { status: 500 });
  }

  if (!merchantCustomer.email || !merchantCustomer.email.trim()) {
    await client
      .from("merchant_customers")
      .update({ email })
      .eq("id", merchantCustomer.id)
      .eq("company_id", invite.company_id);
  }

  return NextResponse.json({ success: true, destination: "/customer" });
}
