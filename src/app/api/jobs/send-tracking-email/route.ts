import { NextRequest, NextResponse } from "next/server";

type SendTrackingEmailRequest = {
  to?: string;
  kind?: "collection" | "delivery" | "documents" | "pod";
  jobReference?: string;
  collectionTrackingUrl?: string | null;
  deliveryTrackingUrl?: string | null;
  documentUrl?: string | null;
  podUrl?: string | null;
};

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "noreply@nexus.delivery";

function buildEmailBody(payload: SendTrackingEmailRequest): { subject: string; html: string } {
  const ref = payload.jobReference ?? "NEXUS job";

  const commonHeader = `<p>Hello,</p><p>Tracking update for <strong>${ref}</strong>.</p>`;

  if (payload.kind === "collection") {
    return {
      subject: `Collection Tracking - ${ref}`,
      html: `${commonHeader}<p>Collection tracking link:</p><p><a href="${payload.collectionTrackingUrl ?? "#"}">${payload.collectionTrackingUrl ?? ""}</a></p>`,
    };
  }

  if (payload.kind === "delivery") {
    return {
      subject: `Delivery Tracking - ${ref}`,
      html: `${commonHeader}<p>Delivery tracking link:</p><p><a href="${payload.deliveryTrackingUrl ?? "#"}">${payload.deliveryTrackingUrl ?? ""}</a></p>`,
    };
  }

  if (payload.kind === "pod") {
    return {
      subject: `Proof Of Delivery - ${ref}`,
      html: `${commonHeader}<p>Proof of Delivery link:</p><p><a href="${payload.podUrl ?? payload.deliveryTrackingUrl ?? "#"}">${payload.podUrl ?? payload.deliveryTrackingUrl ?? ""}</a></p>`,
    };
  }

  return {
    subject: `Document Links - ${ref}`,
    html: `${commonHeader}<p>Document link:</p><p><a href="${payload.documentUrl ?? "#"}">${payload.documentUrl ?? ""}</a></p>`,
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
