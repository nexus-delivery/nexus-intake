import { NextRequest, NextResponse } from "next/server";
import {
  resolveProviderForCapability,
} from "@/lib/integrations/service";
import type { IntegrationCapability } from "@/lib/integrations/types";
import { getMerchantContext } from "@/lib/serverAuth";

const allowedCapabilities: IntegrationCapability[] = [
  "invoice_export",
  "order_ingest",
  "operational_execution",
  "customer_notifications",
  "payment_collection",
];

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const capability = (request.nextUrl.searchParams.get("capability") ?? "").trim() as IntegrationCapability;
  if (!allowedCapabilities.includes(capability)) {
    return NextResponse.json(
      {
        error: "Invalid capability",
        allowedCapabilities,
      },
      { status: 400 }
    );
  }

  try {
    const provider = await resolveProviderForCapability(
      context.value.privilegedClient,
      context.value.companyId,
      capability
    );

    return NextResponse.json({ provider });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to resolve provider",
      },
      { status: 500 }
    );
  }
}
