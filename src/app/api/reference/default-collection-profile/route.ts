import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { supportsDepotFirstByCompanyName } from "@/lib/defaultCollectionProfiles";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

type CompanyRow = {
  id: string;
  name: string | null;
  trading_name: string | null;
};

type MerchantCollectionProfileRow = {
  id: string;
  company_id: string;
  profile_name: string | null;
  company_name: string | null;
  contact_name: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_line3: string | null;
  postcode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  instructions: string | null;
  updated_at: string | null;
};

function createAuthClient() {
  if (!supabaseUrl || !supabasePublicKey) return null;
  return createClient(supabaseUrl, supabasePublicKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function parseBearerToken(request: NextRequest): string {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function clean(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

async function resolveUserContext(request: NextRequest) {
  const token = parseBearerToken(request);
  if (!token) {
    return { error: "Unauthorised", status: 401 as const };
  }

  const authClient = createAuthClient();
  const privilegedClient = createPrivilegedClient();
  if (!authClient || !privilegedClient) {
    return { error: "Supabase not configured", status: 500 as const };
  }

  const {
    data: { user },
    error: userError,
  } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return { error: "Unauthorised", status: 401 as const };
  }

  const { data: profile, error: profileError } = await privilegedClient
    .from("profiles")
    .select("company_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (profileError || !profile?.company_id) {
    return { error: "No company linked to user", status: 403 as const };
  }

  return {
    user,
    profile: {
      companyId: clean(profile.company_id),
      role: clean(profile.role),
    },
    privilegedClient,
  };
}

export async function GET(request: NextRequest) {
  try {
    const context = await resolveUserContext(request);
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const companyId = context.profile.companyId;

    const [{ data: company }, { data: profile }] = await Promise.all([
      context.privilegedClient
        .from("companies")
        .select("id, name, trading_name")
        .eq("id", companyId)
        .maybeSingle<CompanyRow>(),
      context.privilegedClient
        .from("merchant_collection_profiles")
        .select(
          [
            "id",
            "company_id",
            "profile_name",
            "company_name",
            "contact_name",
            "address_line1",
            "address_line2",
            "address_line3",
            "postcode",
            "country",
            "phone",
            "email",
            "instructions",
            "updated_at",
          ].join(", ")
        )
        .eq("company_id", companyId)
        .maybeSingle<MerchantCollectionProfileRow>(),
    ]);

    const companyName = clean(company?.trading_name) || clean(company?.name);

    return NextResponse.json({
      companyName,
      suggestedDepotMode: supportsDepotFirstByCompanyName(companyName),
      profile: profile
        ? {
            id: clean(profile.id),
            companyId: clean(profile.company_id),
            profileName: clean(profile.profile_name),
            companyName: clean(profile.company_name),
            contactName: clean(profile.contact_name),
            addressLine1: clean(profile.address_line1),
            addressLine2: clean(profile.address_line2),
            addressLine3: clean(profile.address_line3),
            postcode: clean(profile.postcode),
            country: clean(profile.country) || "UK",
            phone: clean(profile.phone),
            email: clean(profile.email),
            instructions: clean(profile.instructions),
            updatedAt: clean(profile.updated_at),
          }
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const context = await resolveUserContext(request);
    if ("error" in context) {
      return NextResponse.json({ error: context.error }, { status: context.status });
    }

    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

    const payload = {
      company_id: context.profile.companyId,
      profile_name: clean(body.profileName) || "Default depot",
      company_name: clean(body.companyName),
      contact_name: clean(body.contactName),
      address_line1: clean(body.addressLine1),
      address_line2: clean(body.addressLine2),
      address_line3: clean(body.addressLine3),
      postcode: clean(body.postcode),
      country: clean(body.country) || "UK",
      phone: clean(body.phone),
      email: clean(body.email),
      instructions: clean(body.instructions),
      updated_by_user_id: context.user.id,
    };

    if (!payload.address_line1 || !payload.postcode) {
      return NextResponse.json(
        { error: "Address line 1 and postcode are required" },
        { status: 400 }
      );
    }

    const { data, error } = await context.privilegedClient
      .from("merchant_collection_profiles")
      .upsert(payload, { onConflict: "company_id" })
      .select(
        [
          "id",
          "company_id",
          "profile_name",
          "company_name",
          "contact_name",
          "address_line1",
          "address_line2",
          "address_line3",
          "postcode",
          "country",
          "phone",
          "email",
          "instructions",
          "updated_at",
        ].join(", ")
      )
      .single<MerchantCollectionProfileRow>();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Save failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile: {
        id: clean(data.id),
        companyId: clean(data.company_id),
        profileName: clean(data.profile_name),
        companyName: clean(data.company_name),
        contactName: clean(data.contact_name),
        addressLine1: clean(data.address_line1),
        addressLine2: clean(data.address_line2),
        addressLine3: clean(data.address_line3),
        postcode: clean(data.postcode),
        country: clean(data.country) || "UK",
        phone: clean(data.phone),
        email: clean(data.email),
        instructions: clean(data.instructions),
        updatedAt: clean(data.updated_at),
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
