import { supabase } from "@/lib/supabaseClient";

export const SUPER_ADMIN_EMAIL = "office@nexus.delivery";
export const MANAGE_IT_ACCESS_PERMISSION = "view:manage_it";
export const MANAGE_IT_SESSION_COOKIE = "nexus-session-token";
export const MANAGE_IT_ACCESS_COOKIE = "nexus-manage-it";

export type ManageItSectionSlug =
  | "dashboard"
  | "customers"
  | "companies"
  | "document-centre"
  | "settings"
  | "team-management"
  | "integrations"
  | "subscriptions"
  | "platform";

export type ManageItSection = {
  slug: ManageItSectionSlug;
  title: string;
  description: string;
  eyebrow: string;
  requiredPermission: string;
  status: "live" | "restricted";
};

export type ManageItAccessProfile = {
  userId: string | null;
  email: string | null;
  accessToken: string | null;
  roles: string[];
  permissions: string[];
  canAccessManageIt: boolean;
};

export type AuditLogEntry = {
  id: string;
  actorEmail: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  createdAt: string;
  details: Record<string, unknown>;
};

const EMPTY_ACCESS_PROFILE: ManageItAccessProfile = {
  userId: null,
  email: null,
  accessToken: null,
  roles: [],
  permissions: [],
  canAccessManageIt: false,
};

export const MANAGE_IT_SECTIONS: ManageItSection[] = [
  {
    slug: "dashboard",
    title: "Dashboard",
    description: "Live platform statistics, bookings, routes, delivery health and queue visibility.",
    eyebrow: "Operations overview",
    requiredPermission: "view:operations",
    status: "live",
  },
  {
    slug: "customers",
    title: "Customers",
    description: "Search customers, suspend accounts, remove access and impersonate support journeys.",
    eyebrow: "Customer control",
    requiredPermission: "manage:customers:view",
    status: "live",
  },
  {
    slug: "companies",
    title: "Companies",
    description: "Review logos, subscription status, usage and company-level configuration.",
    eyebrow: "Tenant control",
    requiredPermission: "manage:companies:view",
    status: "live",
  },
  {
    slug: "document-centre",
    title: "Document Centre",
    description: "Manage PODs, invoices, shipping documents and controlled uploads.",
    eyebrow: "Document operations",
    requiredPermission: "manage:documents:view",
    status: "live",
  },
  {
    slug: "settings",
    title: "Settings",
    description: "Account controls, company settings, tenant defaults and feature configuration.",
    eyebrow: "Configuration",
    requiredPermission: "manage:settings:view",
    status: "live",
  },
  {
    slug: "team-management",
    title: "Team Management",
    description: "Invite users, reset passwords, assign roles and review team activity.",
    eyebrow: "Identity & access",
    requiredPermission: "manage:users:invite",
    status: "live",
  },
  {
    slug: "integrations",
    title: "Integrations",
    description: "Track-POD, Xero, WooCommerce, Stripe and API key diagnostics.",
    eyebrow: "Connected systems",
    requiredPermission: "manage:integrations:view",
    status: "live",
  },
  {
    slug: "subscriptions",
    title: "Subscriptions",
    description: "Plans, trials, billing health and Stripe oversight.",
    eyebrow: "Billing operations",
    requiredPermission: "manage:subscriptions:view",
    status: "live",
  },
  {
    slug: "platform",
    title: "Platform",
    description: "Feature flags, environment status, release notes and audit visibility.",
    eyebrow: "Platform controls",
    requiredPermission: "manage:platform:audit_log",
    status: "live",
  },
];

export const FALLBACK_AUDIT_LOGS: AuditLogEntry[] = [];

export function getManageItSection(slug: string): ManageItSection | undefined {
  return MANAGE_IT_SECTIONS.find((section) => section.slug === slug);
}

export function hasPermission(profile: ManageItAccessProfile, permission: string): boolean {
  return profile.permissions.includes(permission);
}

export function getVisibleManageItSections(profile: ManageItAccessProfile): ManageItSection[] {
  return MANAGE_IT_SECTIONS.filter((section) => hasPermission(profile, section.requiredPermission));
}

export async function getManageItAccessProfile(): Promise<ManageItAccessProfile> {
  if (!supabase) {
    return EMPTY_ACCESS_PROFILE;
  }

  const [{ data: sessionData, error: sessionError }, { data: userData, error: userError }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.getUser(),
  ]);

  if (sessionError || userError || !userData.user) {
    return EMPTY_ACCESS_PROFILE;
  }

  const { data, error } = await supabase.rpc("get_my_access_profile");
  if (error) {
    throw new Error(error.message);
  }

  const roles = Array.isArray(data?.roles) ? data.roles.filter((value: unknown): value is string => typeof value === "string") : [];
  const permissions = Array.isArray(data?.permissions)
    ? data.permissions.filter((value: unknown): value is string => typeof value === "string")
    : [];

  return {
    userId: userData.user.id,
    email: userData.user.email ?? null,
    accessToken: sessionData.session?.access_token ?? null,
    roles,
    permissions,
    canAccessManageIt: permissions.includes(MANAGE_IT_ACCESS_PERMISSION),
  };
}

export async function syncManageItSession(accessToken: string | null): Promise<void> {
  try {
    if (!accessToken) {
      const deleteResponse = await fetch("/api/auth/session", { method: "DELETE" });
      if (!deleteResponse.ok) {
        throw new Error(`Session clear failed: ${deleteResponse.status} ${deleteResponse.statusText}`);
      }
      return;
    }

    const postResponse = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accessToken }),
    });

    if (!postResponse.ok) {
      throw new Error(`Session sync failed: ${postResponse.status} ${postResponse.statusText}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Session synchronization failed";
    console.error("syncManageItSession error:", message);
    throw new Error(message);
  }
}

export async function logAdminAction(params: {
  action: string;
  resourceType: string;
  resourceId?: string | null;
  details?: Record<string, unknown>;
}): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.rpc("log_admin_action", {
    action_name: params.action,
    resource_type_name: params.resourceType,
    resource_id_value: params.resourceId ?? null,
    details_payload: params.details ?? {},
  });

  if (error) {
    throw new Error(error.message);
  }
}
