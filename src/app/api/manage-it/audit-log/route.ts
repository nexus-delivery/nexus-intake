import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  FALLBACK_AUDIT_LOGS,
  MANAGE_IT_ACCESS_COOKIE,
  MANAGE_IT_SESSION_COOKIE,
} from "@/lib/manageIt";

function createSupabaseTokenClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: "Bearer " + accessToken,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const cookieHeader = request.headers.get("cookie") ?? "";
  const hasAccess = cookieHeader.includes(`${MANAGE_IT_ACCESS_COOKIE}=1`);
  const sessionCookieMatch = cookieHeader.match(new RegExp(`${MANAGE_IT_SESSION_COOKIE}=([^;]+)`));
  const accessToken = sessionCookieMatch?.[1] ? decodeURIComponent(sessionCookieMatch[1]) : null;
  const parsedLimit = Number(url.searchParams.get("limit") ?? 25);
  const limit = Number.isFinite(parsedLimit)
    ? Math.min(Math.max(Math.trunc(parsedLimit), 1), 100)
    : 25;

  if (!hasAccess || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = createSupabaseTokenClient(accessToken);
  if (!client) {
    return NextResponse.json({ data: FALLBACK_AUDIT_LOGS });
  }

  const { data, error } = await client
    .from("audit_log")
    .select("id, actor_email, action, resource_type, resource_id, details, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ data: FALLBACK_AUDIT_LOGS });
  }

  return NextResponse.json({
    data: (data ?? []).map((entry) => ({
      id: entry.id,
      actorEmail: entry.actor_email,
      action: entry.action,
      resourceType: entry.resource_type,
      resourceId: entry.resource_id,
      details: entry.details ?? {},
      createdAt: entry.created_at,
    })),
  });
}
