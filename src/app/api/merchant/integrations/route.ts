import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";
import { listMerchantIntegrations } from "@/lib/integrations/service";

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const integrations = await listMerchantIntegrations(
      context.value.privilegedClient,
      context.value.companyId
    );

    return NextResponse.json({
      integrations,
      model: {
        systemOfRecord: "nexus",
        accountingRole: "financial_system_of_record",
        operationsRole: "trackpod_operational_execution",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to load integrations",
      },
      { status: 500 }
    );
  }
}
