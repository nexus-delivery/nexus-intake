import type { SupabaseClient } from "@supabase/supabase-js";

type NotifyOrderCreatedArgs = {
  client: SupabaseClient;
  draftJobId: string;
  companyId: string;
  orderReference: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
};

type NotificationOutcome = {
  skipped: boolean;
  emailSent: boolean;
  smsSent: boolean;
  emailError?: string;
  smsError?: string;
};

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@nexus.delivery";
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID ?? "";
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN ?? "";
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER ?? "";

function trim(value: string | null | undefined): string {
  return (value ?? "").trim();
}

function asObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function normalizePhone(raw: string): string {
  const cleaned = raw.replace(/[^+\d]/g, "").trim();
  if (!cleaned) return "";
  if (cleaned.startsWith("+")) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0")) return `+44${cleaned.slice(1)}`;
  return `+${cleaned}`;
}

function buildEmailHtml(args: {
  customerName: string;
  orderReference: string;
}): { subject: string; html: string } {
  const safeName = args.customerName || "Customer";
  return {
    subject: `Order received - ${args.orderReference}`,
    html: [
      `<p>Hello ${safeName},</p>`,
      `<p>We have successfully received your order in NEXUS.</p>`,
      `<p><strong>Order reference:</strong> ${args.orderReference}</p>`,
      `<p>Further operational updates will follow from Track-POD.</p>`,
      `<p>Thank you.</p>`,
    ].join(""),
  };
}

async function sendEmail(args: {
  to: string;
  customerName: string;
  orderReference: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!resendApiKey) {
    return { ok: false, error: "RESEND_API_KEY is not configured" };
  }

  const { subject, html } = buildEmailHtml(args);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: resendFromEmail,
      to: [args.to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    return { ok: false, error: `Resend request failed (${response.status}): ${payload}` };
  }

  return { ok: true };
}

async function sendSms(args: {
  to: string;
  orderReference: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!twilioAccountSid || !twilioAuthToken || !twilioFromNumber) {
    return { ok: false, error: "Twilio credentials are not fully configured" };
  }

  const to = normalizePhone(args.to);
  if (!to) {
    return { ok: false, error: "No valid phone number available" };
  }

  const endpoint = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
  const body = new URLSearchParams({
    From: twilioFromNumber,
    To: to,
    Body: `NEXUS order received. Ref: ${args.orderReference}. Further operational updates will follow from Track-POD.`,
  });

  const auth = Buffer.from(`${twilioAccountSid}:${twilioAuthToken}`).toString("base64");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!response.ok) {
    const payload = await response.text().catch(() => "");
    return { ok: false, error: `Twilio request failed (${response.status}): ${payload}` };
  }

  return { ok: true };
}

export async function notifyOrderCreated(args: NotifyOrderCreatedArgs): Promise<NotificationOutcome> {
  const { client, draftJobId } = args;

  const { data: existing, error: readError } = await client
    .from("draft_jobs")
    .select("integration_metadata")
    .eq("id", draftJobId)
    .maybeSingle();

  if (readError) {
    return {
      skipped: false,
      emailSent: false,
      smsSent: false,
      emailError: `Failed to read integration metadata: ${readError.message}`,
    };
  }

  const metadata = asObject(existing?.integration_metadata);
  const notificationMeta = asObject(metadata.nexusNotifications);
  const orderCreatedMeta = asObject(notificationMeta.orderCreated);
  const alreadySent = Boolean(orderCreatedMeta.sentAt);

  if (alreadySent) {
    return {
      skipped: true,
      emailSent: Boolean(orderCreatedMeta.emailSent),
      smsSent: Boolean(orderCreatedMeta.smsSent),
    };
  }

  const customerEmail = trim(args.customerEmail);
  const customerPhone = trim(args.customerPhone);
  const customerName = trim(args.customerName) || "Customer";

  let emailSent = false;
  let smsSent = false;
  let emailError: string | undefined;
  let smsError: string | undefined;

  if (customerEmail) {
    const email = await sendEmail({
      to: customerEmail,
      customerName,
      orderReference: args.orderReference,
    });
    emailSent = email.ok;
    if (!email.ok) emailError = email.error;
  } else {
    emailError = "Customer email is missing";
  }

  if (customerPhone) {
    const sms = await sendSms({
      to: customerPhone,
      orderReference: args.orderReference,
    });
    smsSent = sms.ok;
    if (!sms.ok) smsError = sms.error;
  } else {
    smsError = "Customer phone is missing";
  }

  const updatedMetadata = {
    ...metadata,
    nexusNotifications: {
      ...notificationMeta,
      orderCreated: {
        sentAt: new Date().toISOString(),
        orderReference: args.orderReference,
        customerEmail,
        customerPhone,
        emailSent,
        smsSent,
        emailError: emailError ?? null,
        smsError: smsError ?? null,
      },
    },
  };

  await client
    .from("draft_jobs")
    .update({ integration_metadata: updatedMetadata })
    .eq("id", draftJobId)
    .eq("company_id", args.companyId);

  return {
    skipped: false,
    emailSent,
    smsSent,
    emailError,
    smsError,
  };
}
