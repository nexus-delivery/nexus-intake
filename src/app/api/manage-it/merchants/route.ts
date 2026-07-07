import { NextRequest, NextResponse } from "next/server";
import { canManageMerchants, getMerchantContext } from "@/lib/serverAuth";

type MerchantStatus = "active" | "disabled" | "archived";

type CompanyRow = {
  id: string;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  company_id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
};

type JobRow = {
  company_id: string;
  lifecycle_status: string | null;
};

function normalizeStatus(company: CompanyRow): MerchantStatus {
  const name = (company.name ?? "").trim().toLowerCase();
  const businessType = (company.business_type ?? "").trim().toLowerCase();
  if (name.startsWith("[archived]")) return "archived";
  if (businessType.startsWith("disabled:")) return "disabled";
  return "active";
}

function restoreStatusFields(
  company: CompanyRow,
  nextStatus: MerchantStatus
): Pick<CompanyRow, "name" | "business_type"> {
  const cleanedName = (company.name ?? "").replace(/^\[archived\]\s*/i, "").trim();
  const businessType = (company.business_type ?? "").replace(/^disabled:\s*/i, "").trim();

  if (nextStatus === "archived") {
    return {
      name: `[ARCHIVED] ${cleanedName || "Merchant"}`,
      business_type: businessType || null,
    };
  }

  if (nextStatus === "disabled") {
    return {
      name: cleanedName || company.name,
      business_type: `disabled:${businessType || "general"}`,
    };
  }

  return {
    name: cleanedName || company.name,
    business_type: businessType || null,
  };
}

function containsSearch(company: CompanyRow, contactEmail: string, search: string): boolean {
  if (!search) return true;
  const haystack = [company.name, company.trading_name ?? "", company.business_type ?? "", contactEmail]
    .join(" ")
    .toLowerCase();
  return haystack.includes(search);
}

export async function GET(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const isAdmin = canManageMerchants(context.value.role);
  const params = request.nextUrl.searchParams;
  const search = (params.get("search") ?? "").trim().toLowerCase();
  const statusFilter = (params.get("status") ?? "all").trim().toLowerCase();
  const sortBy = (params.get("sortBy") ?? "created_at").trim();
  const sortDir = (params.get("sortDir") ?? "desc").trim().toLowerCase() === "asc" ? "asc" : "desc";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);
  const pageSize = Math.min(100, Math.max(1, Number(params.get("pageSize") ?? "20") || 20));

  let query = context.value.privilegedClient
    .from("companies")
    .select("id, name, trading_name, business_type, created_at, updated_at");

  if (!isAdmin) {
    query = query.eq("id", context.value.companyId);
  }

  const { data: companies, error: companiesError } = await query.returns<CompanyRow[]>();
  if (companiesError) {
    return NextResponse.json({ error: companiesError.message }, { status: 500 });
  }

  const companyRows = companies ?? [];
  const companyIds = companyRows.map((company) => company.id);

  const [profilesResult, jobsResult] = await Promise.all([
    companyIds.length
      ? context.value.privilegedClient
          .from("profiles")
          .select("company_id, full_name, email, role")
          .in("company_id", companyIds)
          .returns<ProfileRow[]>()
      : Promise.resolve({ data: [], error: null }),
    companyIds.length
      ? context.value.privilegedClient
          .from("draft_jobs")
          .select("company_id, lifecycle_status")
          .in("company_id", companyIds)
          .returns<JobRow[]>()
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (profilesResult.error) {
    return NextResponse.json({ error: profilesResult.error.message }, { status: 500 });
  }

  if (jobsResult.error) {
    return NextResponse.json({ error: jobsResult.error.message }, { status: 500 });
  }

  const profilesByCompany = new Map<string, ProfileRow[]>();
  for (const profile of profilesResult.data ?? []) {
    const bucket = profilesByCompany.get(profile.company_id) ?? [];
    bucket.push(profile);
    profilesByCompany.set(profile.company_id, bucket);
  }

  const jobsByCompany = new Map<string, JobRow[]>();
  for (const job of jobsResult.data ?? []) {
    const bucket = jobsByCompany.get(job.company_id) ?? [];
    bucket.push(job);
    jobsByCompany.set(job.company_id, bucket);
  }

  const rows = companyRows
    .map((company) => {
      const status = normalizeStatus(company);
      const profiles = profilesByCompany.get(company.id) ?? [];
      const jobs = jobsByCompany.get(company.id) ?? [];
      const contactProfile =
        profiles.find((profile) => (profile.role ?? "").toLowerCase().includes("admin")) ??
        profiles[0] ??
        null;

      const activeOrders = jobs.filter((job) => {
        const lifecycle = (job.lifecycle_status ?? "").toLowerCase();
        return lifecycle !== "archived" && lifecycle !== "delivered";
      }).length;

      const totalOrders = jobs.filter((job) => (job.lifecycle_status ?? "").toLowerCase() !== "archived").length;

      const contactName = contactProfile?.full_name ?? "";
      const telephone = "";

      return {
        id: company.id,
        merchantName: company.name,
        company: company.trading_name ?? "",
        contact: contactName,
        email: contactProfile?.email ?? "",
        telephone,
        status,
        activeOrders,
        totalOrders,
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      };
    })
    .filter((row) => (statusFilter === "all" ? true : row.status === statusFilter))
    .filter((row) =>
      containsSearch(
        {
          id: row.id,
          name: row.merchantName,
          trading_name: row.company,
          business_type: null,
          created_at: row.createdAt,
          updated_at: row.updatedAt,
        },
        row.email,
        search
      )
    );

  const sorted = [...rows].sort((a, b) => {
    const key = sortBy as keyof typeof a;
    const av = (a[key] ?? "").toString().toLowerCase();
    const bv = (b[key] ?? "").toString().toLowerCase();
    if (av < bv) return sortDir === "asc" ? -1 : 1;
    if (av > bv) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  const total = sorted.length;
  const start = (page - 1) * pageSize;
  const paged = sorted.slice(start, start + pageSize);

  return NextResponse.json({
    merchants: paged,
    total,
    page,
    pageSize,
    canDelete: isAdmin,
  });
}

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  if (!canManageMerchants(context.value.role)) {
    return NextResponse.json({ error: "Only admin roles can create merchants." }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const merchantName = String(body.merchantName ?? "").trim();
  const company = String(body.company ?? "").trim();
  const businessType = String(body.businessType ?? "").trim();

  if (!merchantName) {
    return NextResponse.json({ error: "Merchant name is required." }, { status: 400 });
  }

  const insertPayload = {
    name: merchantName,
    trading_name: company || null,
    business_type: businessType || null,
  };

  const { data, error } = await context.value.privilegedClient
    .from("companies")
    .insert(insertPayload)
    .select("id, name, trading_name, business_type, created_at, updated_at")
    .single<CompanyRow>();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Failed to create merchant" }, { status: 500 });
  }

  const restored = restoreStatusFields(data, "active");

  return NextResponse.json({
    success: true,
    merchant: {
      id: data.id,
      merchantName: restored.name,
      company: data.trading_name ?? "",
      contact: "",
      email: "",
      telephone: "",
      status: "active",
      activeOrders: 0,
      totalOrders: 0,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    },
  });
}
