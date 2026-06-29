import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SIGN_IN_ERROR = "Please sign in to access merchant documents";
const NO_COMPANY_ERROR = "No company is linked to this user";
const ACCESS_DENIED_ERROR = "You do not have access to this document";

function createAuthenticatedClient(accessToken: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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

    const supabase = createAuthenticatedClient(accessToken);
    if (!supabase) {
      return NextResponse.json(
        { error: "Supabase env vars not configured" },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(accessToken);

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

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile?.company_id) {
      return NextResponse.json({ error: NO_COMPANY_ERROR }, { status: 403 });
    }

    const { data: document, error: documentError } = await supabase
      .from("uploaded_documents")
      .select("id, file_name, file_path, company_id")
      .eq("id", documentId)
      .maybeSingle();

    if (documentError) {
      return NextResponse.json({ error: documentError.message }, { status: 500 });
    }

    if (!document || document.company_id !== profile.company_id) {
      return NextResponse.json({ error: ACCESS_DENIED_ERROR }, { status: 403 });
    }

    const { data: signedData, error: signedError } = await supabase.storage
      .from("merchant-documents")
      .createSignedUrl(document.file_path, 60 * 10, {
        download: download ? document.file_name : false,
      });

    if (signedError || !signedData?.signedUrl) {
      return NextResponse.json(
        { error: signedError?.message ?? "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({ signedUrl: signedData.signedUrl });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}