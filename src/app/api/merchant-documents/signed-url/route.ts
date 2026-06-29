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

    if (profileError) {
      return NextResponse.json(
        {
          error: "Profile lookup failed",
          details: profileError.message,
          userId: user.id,
        },
        { status: 500 }
      );
    }

    const profile = profiles?.[0] ?? null;

    if (!profile?.company_id) {
      return NextResponse.json(
        {
          error: NO_COMPANY_ERROR,
          details: "Profile exists but company_id is empty",
          profile,
          profiles,
          userId: user.id,
        },
        { status: 403 }
      );
    }

    const resolvedCompanyId = profile.company_id;

    const { data: document, error: documentError } = await dbClient
      .from("uploaded_documents")
      .select("id, file_name, file_path, company_id")
      .eq("id", documentId)
      .eq("company_id", resolvedCompanyId)
      .maybeSingle();

    if (documentError) {
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }

    if (!document) {
      return NextResponse.json({ error: ACCESS_DENIED_ERROR }, { status: 403 });
    }

    const bucketName = "merchant-documents";
    const objectKey = document.file_path;
    const { data: signedData, error: signedError } = await dbClient.storage
      .from(bucketName)
      .createSignedUrl(objectKey, 60 * 10, {
        download: download ? document.file_name : false,
      });

    if (signedError || !signedData?.signedUrl) {
      const completeSignedUrlError =
        signedError == null
          ? null
          : {
              ...signedError,
              message: signedError.message,
              status: (signedError as { status?: number }).status ?? null,
              error: (signedError as { error?: string }).error ?? null,
              name: (signedError as { name?: string }).name ?? null,
            };

      return NextResponse.json(
        {
          error: signedError?.message ?? "Failed to generate signed URL",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
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