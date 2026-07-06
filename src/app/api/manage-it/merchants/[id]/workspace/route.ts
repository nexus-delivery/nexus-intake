import { NextRequest, NextResponse } from "next/server";
import { getMerchantContext } from "@/lib/serverAuth";

type CompanyRow = {
  id: string;
  name: string;
  trading_name: string | null;
  business_type: string | null;
  created_at: string;
  updated_at: string;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
  created_at: string;
};

type OrderRow = {
  id: string;
  job_reference: string | null;
  external_order_id: string | null;
  customer: string | null;
  collection_company: string | null;
  delivery_company: string | null;
  lifecycle_status: string | null;
  status: string | null;
  created_at: string;
};

type DocumentRow = {
  id: string;
  file_name: string | null;
  document_type: string | null;
  status: string | null;
  created_at: string;
};

function isAdminRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return ["admin", "owner", "operations_admin", "ops_admin", "platform_admin", "super_admin"].includes(normalized);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const { id } = await params;
  const isAdmin = isAdminRole(context.value.role);

  if (!isAdmin && id !== context.value.companyId) {
    return NextResponse.json({ error: "You can only access your own merchant workspace." }, { status: 403 });
  }

  const [companyResult, usersResult, customersResult, ordersResult, docsResult] = await Promise.all([
    context.value.privilegedClient
      .from("companies")
      .select("id, name, trading_name, business_type, created_at, updated_at")
      .eq("id", id)
      .maybeSingle<CompanyRow>(),
    context.value.privilegedClient
      .from("profiles")
      .select("id, full_name, email, role, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .returns<ProfileRow[]>(),
    context.value.privilegedClient
      .from("merchant_customers")
      .select("id", { count: "exact", head: true })
      .eq("company_id", id)
      .is("archived_at", null),
    context.value.privilegedClient
      .from("draft_jobs")
      .select("id, job_reference, external_order_id, customer, collection_company, delivery_company, lifecycle_status, status, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(50)
      .returns<OrderRow[]>(),
    context.value.privilegedClient
      .from("uploaded_documents")
      .select("id, file_name, document_type, status, created_at")
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(10)
      .returns<DocumentRow[]>(),
  ]);

  if (companyResult.error) return NextResponse.json({ error: companyResult.error.message }, { status: 500 });
  if (usersResult.error) return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
  if (customersResult.error) return NextResponse.json({ error: customersResult.error.message }, { status: 500 });
  if (ordersResult.error) return NextResponse.json({ error: ordersResult.error.message }, { status: 500 });
  if (docsResult.error) return NextResponse.json({ error: docsResult.error.message }, { status: 500 });

  if (!companyResult.data) {
    return NextResponse.json({ error: "Merchant not found." }, { status: 404 });
  }

  const allOrders = ordersResult.data ?? [];
  const nonArchivedOrders = allOrders.filter((order) => (order.lifecycle_status ?? "").toLowerCase() !== "archived");

  const activity = nonArchivedOrders.slice(0, 10).map((order) => ({
    id: order.id,
    createdAt: order.created_at,
    label: order.lifecycle_status ?? order.status ?? "Order update",
    detail: `${order.job_reference ?? order.external_order_id ?? order.id} · ${order.customer ?? "Unknown customer"}`,
  }));

  return NextResponse.json({
    merchant: companyResult.data,
    users: usersResult.data ?? [],
    documents: docsResult.data ?? [],
    counts: {
      customers: customersResult.count ?? 0,
      users: (usersResult.data ?? []).length,
      documents: (docsResult.data ?? []).length,
      activeOrders: nonArchivedOrders.filter((order) => {
        const lifecycle = (order.lifecycle_status ?? "").toLowerCase();
        return lifecycle !== "delivered";
      }).length,
      totalOrders: nonArchivedOrders.length,
    },
    recentActivity: activity,
    recentOrders: nonArchivedOrders.slice(0, 10),
  });
}
