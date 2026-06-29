import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SIGN_IN_ERROR = "Please sign in to access merchant documents";
const NO_COMPANY_ERROR = "No company is linked to this user";
const ACCESS_DENIED_ERROR = "You do not have access to this document";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const authClient =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const privilegedClient =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

function createAuthenticatedAnonClient(accessToken: string) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") ?? "";
    const accessToken = authorization.startsWith("Bearer ")
      ? authorization.slice("Bearer ".length).trim()
      : "";

    if (!accessToken) {
      return NextResponse.json({ error: SIGN_IN_ERROR }, { status: 401 });
    }

    if (!authClient) {
      return NextResponse.json(
        { error: "Supabase env vars not configured" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json({ error: SIGN_IN_ERROR }, { status: 401 });
    }

    const { documentId, download } = (await request.json()) as {
      documentId?: string;
      download?: boolean;
    };

    if (!documentId) {
      return NextResponse.json({ error: "Missing document ID" }, { status: 400 });
    }

    const dbClient = privilegedClient;
    if (!dbClient) {
      return NextResponse.json(
        { error: "Supabase env vars not configured" },
        { status: 500 }
      );
    }

    const { data: profiles, error: profileError } = await dbClient
      .from("profiles")
      .select("company_id")
      .eq("auth_user_id", user.id)
      .limit(1);

    return NextResponse.json({
      diagnostic: "raw profile query result",
      userId: user.id,
      profileError,
      profiles,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}