import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";

type SeedCustomer = {
  customerName: string;
  company: string;
  contactName: string;
  email: string;
  phone: string;
};

const doorwayCustomers: SeedCustomer[] = [
  {
    customerName: "EE Glazing Romford",
    company: "EE Glazing Romford",
    contactName: "Ops Romford",
    email: "ops.romford@eeglazing.example",
    phone: "+44 1708 100100",
  },
  {
    customerName: "EE Glazing Harrow",
    company: "EE Glazing Harrow",
    contactName: "Ops Harrow",
    email: "ops.harrow@eeglazing.example",
    phone: "+44 208 800100",
  },
  {
    customerName: "Trade UPVC Swadlincote",
    company: "Trade UPVC Swadlincote",
    contactName: "Trade Desk",
    email: "dispatch@tradeupvc.example",
    phone: "+44 1283 700100",
  },
  {
    customerName: "Hainault Trade Windows",
    company: "Hainault Trade Windows",
    contactName: "Warehouse Team",
    email: "ops@hainaultwindows.example",
    phone: "+44 208 500100",
  },
  {
    customerName: "Pro-Trade UPVC Swadlincote",
    company: "Pro-Trade UPVC Swadlincote",
    contactName: "Pro Trade Ops",
    email: "ops@protradeupvc.example",
    phone: "+44 1283 700200",
  },
];

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  try {
    const { data: existing } = await context.value.privilegedClient
      .from("merchant_customers")
      .select("id, customer_name")
      .eq("company_id", context.value.companyId)
      .in("customer_name", doorwayCustomers.map((entry) => entry.customerName));

    const byName = new Map((existing ?? []).map((row: any) => [String(row.customer_name), String(row.id)]));

    for (const customer of doorwayCustomers) {
      if (!byName.has(customer.customerName)) {
        const { data: inserted } = await context.value.privilegedClient
          .from("merchant_customers")
          .insert({
            company_id: context.value.companyId,
            customer_name: customer.customerName,
            company: customer.company,
            contact_name: customer.contactName,
            email: customer.email,
            phone: customer.phone,
            default_service: "Doorway Standard Service",
            pricing_profile: "Doorway default rate card",
            created_by_user_id: context.value.user.id,
            updated_by_user_id: context.value.user.id,
          })
          .select("id, customer_name")
          .single<{ id: string; customer_name: string }>();

        if (inserted?.id) {
          byName.set(inserted.customer_name, inserted.id);
        }
      }
    }

    const { data: defaultCollection } = await context.value.privilegedClient
      .from("merchant_collection_profiles")
      .select("id")
      .eq("company_id", context.value.companyId)
      .eq("profile_name", "Doorway North Hub")
      .is("archived_at", null)
      .maybeSingle<{ id: string }>();

    if (!defaultCollection?.id) {
      await context.value.privilegedClient
        .from("merchant_collection_profiles")
        .insert({
          company_id: context.value.companyId,
          profile_name: "Doorway North Hub",
          company_name: "Doorway Group LTD",
          contact_name: "Doorway Operations",
          address_line1: "Doorway North Hub",
          address_line2: "12 Distribution Way",
          address_line3: "Tamworth",
          postcode: "B77 5AA",
          country: "UK",
          phone: "+44 1827 100100",
          email: "ops@doorwaygroup.co.uk",
          instructions: "Primary Doorway collection hub",
          is_default: true,
          created_by_user_id: context.value.user.id,
          updated_by_user_id: context.value.user.id,
        });
    }

    for (const [customerName, customerId] of byName) {
      const baseAddress = `${customerName}, Trade Estate, UK`;

      const { data: existingAddresses } = await context.value.privilegedClient
        .from("merchant_customer_addresses")
        .select("id")
        .eq("company_id", context.value.companyId)
        .eq("merchant_customer_id", customerId)
        .is("archived_at", null)
        .returns<Array<{ id: string }>>();

      if ((existingAddresses ?? []).length === 0) {
        await context.value.privilegedClient.from("merchant_customer_addresses").insert([
          {
            company_id: context.value.companyId,
            merchant_customer_id: customerId,
            address_type: "collection",
            label: "Default collection",
            address_line1: `${customerName} Collection Gate`,
            address_line2: "Industrial Park",
            postcode: "B77 5AA",
            country: "UK",
            contact_name: "Goods In",
            phone: "+44 161 100200",
            email: `collection+${customerId.slice(0, 6)}@doorwaygroup.co.uk`,
            instructions: "Load from rear access lane",
            is_default: true,
            created_by_user_id: context.value.user.id,
            updated_by_user_id: context.value.user.id,
          },
          {
            company_id: context.value.companyId,
            merchant_customer_id: customerId,
            address_type: "delivery",
            label: "Default delivery",
            address_line1: baseAddress,
            address_line2: "Unit 4",
            postcode: "RM1 1AA",
            country: "UK",
            contact_name: "Delivery Team",
            phone: "+44 161 100300",
            email: `delivery+${customerId.slice(0, 6)}@doorwaygroup.co.uk`,
            instructions: "Call 30 minutes before arrival",
            is_default: true,
            created_by_user_id: context.value.user.id,
            updated_by_user_id: context.value.user.id,
          },
        ]);
      }
    }

    const existingJobs = await context.value.privilegedClient
      .from("draft_jobs")
      .select("id")
      .eq("company_id", context.value.companyId)
      .or("job_reference.ilike.NEX-DOORWAY-%")
      .limit(1);

    if (!existingJobs.data || existingJobs.data.length === 0) {
      await context.value.privilegedClient.from("draft_jobs").insert([
        {
          company_id: context.value.companyId,
          created_by_user_id: context.value.user.id,
          status: "job_created",
          lifecycle_status: "HELD_FUTURE_DATE",
          current_status: "HELD - FUTURE DATE",
          job_reference: "NEX-DOORWAY-2001",
          source_system: "merchant_portal",
          customer: "EE Glazing Romford",
          goods_description: "Window frame set",
          invoice_required: true,
          requested_collection_date: dateOffset(1),
          requested_delivery_date: dateOffset(18),
          integration_metadata: {
            releasePolicy: {
              status: "held_future_date",
              requestedDeliveryDate: dateOffset(18),
            },
            lifecycle: {
              collectionReleasedAt: null,
              collectionConfirmedAt: null,
              deliveryReleasedAt: null,
            },
          },
        },
        {
          company_id: context.value.companyId,
          created_by_user_id: context.value.user.id,
          status: "job_created",
          lifecycle_status: "COLLECTION_RELEASED_DELIVERY_HELD",
          current_status: "COLLECTION_RELEASED_DELIVERY_HELD",
          job_reference: "NEX-DOORWAY-2002",
          source_system: "merchant_portal",
          customer: "Trade UPVC Swadlincote",
          goods_description: "Door panel pallets",
          invoice_required: true,
          requested_collection_date: dateOffset(0),
          requested_delivery_date: dateOffset(2),
          trackpod_collection_order_id: "DOORWAY-COLL-2002",
          integration_metadata: {
            lifecycle: {
              collectionReleasedAt: new Date().toISOString(),
              collectionConfirmedAt: null,
              deliveryReleasedAt: null,
            },
          },
        },
      ]);
    }

    return NextResponse.json({
      success: true,
      seededCustomers: doorwayCustomers.length,
      message: "Doorway operational workspace data is ready.",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Doorway seed failed" },
      { status: 500 }
    );
  }
}
