import { NextRequest, NextResponse } from "next/server";

type SendTrackingEmailRequest = {
  to?: string;
  kind?: "order_created";
  jobReference?: string;
  customerName?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@nexus.delivery";

function buildEmailBody(payload: SendTrackingEmailRequest): { subject: string; html: string } {
  const ref = payload.jobReference ?? "NEXUS job";
  const name = payload.customerName?.trim() || "Customer";

  return {
    subject: `Order received - ${ref}`,
    html: `<p>Hello ${name},</p><p>We have successfully received your order in NEXUS.</p><p><strong>Order reference:</strong> ${ref}</p><p>Further operational updates will follow from Track-POD.</p>`,
  };
}

export async function POST(request: NextRequest) {
  try {
    if (!resendApiKey) {
      return NextResponse.json({ error: "Resend API key is not configured" }, { status: 500 });
    }

    const payload = (await request.json()) as SendTrackingEmailRequest;
    if (!payload.to) {
      return NextResponse.json({ error: "Recipient email is required" }, { status: 400 });
    }
    if (payload.kind && payload.kind !== "order_created") {
      return NextResponse.json(
        { error: "NEXUS does not send operational notifications. Only order_created is supported." },
        { status: 400 }
      );
    }

    const { subject, html } = buildEmailBody(payload);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: resendFromEmail,
        to: [payload.to],
        subject,
        html,
      }),
    });

    const resendResponse = (await response.json().catch(() => ({}))) as unknown;

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Resend request failed (${response.status})`,
          response: resendResponse,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, response: resendResponse });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send email" },
      { status: 500 }
    );
  }
}
