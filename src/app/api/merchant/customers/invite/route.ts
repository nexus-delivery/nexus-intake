import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@nexus.delivery";
const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const body = (await request.json().catch(() => ({}))) as {
    customerId?: string;
    email?: string;
    customerName?: string;
  };

  const customerId = (body.customerId ?? "").trim();
  const email = (body.email ?? "").trim();
  const customerName = (body.customerName ?? "").trim() || "Customer";

  if (!customerId || !email) {
    return NextResponse.json({ error: "customerId and email are required" }, { status: 400 });
  }

  const token = randomUUID().replaceAll("-", "") + randomUUID().replaceAll("-", "");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { error: inviteError } = await context.value.privilegedClient
    .from("merchant_customer_invitations")
    .insert({
      company_id: context.value.companyId,
      merchant_customer_id: customerId,
      email,
      invite_token: token,
      invited_by_user_id: context.value.user.id,
      expires_at: expiresAt,
    });

  if (inviteError) {
    return NextResponse.json({ error: inviteError.message }, { status: 500 });
  }

  const inviteUrlBase = appBaseUrl || request.nextUrl.origin;
  const inviteUrl = `${inviteUrlBase}/signup?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

  if (resendApiKey) {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [email],
        subject: "You are invited to the NEXUS Customer Portal",
        html: `<p>Hello ${customerName},</p><p>You have been invited to the NEXUS Customer Portal.</p><p><a href=\"${inviteUrl}\">Create your password and log in</a></p><p>This link expires in 7 days.</p>`,
      }),
    }).catch(() => undefined);
  }

  return NextResponse.json({ success: true, inviteUrl });
}
