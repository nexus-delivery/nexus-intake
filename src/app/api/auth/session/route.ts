import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  MANAGE_IT_ACCESS_COOKIE,
  MANAGE_IT_ACCESS_PERMISSION,
  MANAGE_IT_SESSION_COOKIE,
} from "@/lib/manageIt";

const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8;

function clearSessionCookies(response: NextResponse) {
  response.cookies.delete(MANAGE_IT_SESSION_COOKIE);
  response.cookies.delete(MANAGE_IT_ACCESS_COOKIE);
  return response;
}

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

export async function POST(request: NextRequest) {
  const { accessToken } = (await request.json()) as { accessToken?: string };
  const response = NextResponse.json({ synced: true });

  if (!accessToken) {
    return clearSessionCookies(response);
  }

  const client = createSupabaseTokenClient(accessToken);
  if (!client) {
    return clearSessionCookies(response);
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser(accessToken);

  if (userError || !user) {
    return clearSessionCookies(response);
  }

  const { data: profile, error: profileError } = await client.rpc("get_my_access_profile");
  if (profileError) {
    return clearSessionCookies(response);
  }

  const permissions = Array.isArray(profile?.permissions)
    ? profile.permissions.filter((value: unknown): value is string => typeof value === "string")
    : [];

  response.cookies.set(MANAGE_IT_SESSION_COOKIE, accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  if (permissions.includes(MANAGE_IT_ACCESS_PERMISSION)) {
    response.cookies.set(MANAGE_IT_ACCESS_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
    });
  } else {
    response.cookies.delete(MANAGE_IT_ACCESS_COOKIE);
  }

  return response;
}

export async function DELETE() {
  return clearSessionCookies(NextResponse.json({ cleared: true }));
}
