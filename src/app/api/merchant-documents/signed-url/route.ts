import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SIGN_IN_ERROR = "Please sign in to access merchant documents";
const NO_COMPANY_ERROR = "No company is linked to this user";
const ACCESS_DENIED_ERROR = "You do not have access to this document";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

function keyFingerprint(value: string | undefined) {
  return value ? value.slice(0, 20) : null;
}

const authClient =
  supabaseUrl && supabasePublicKey
    ? createClient(supabaseUrl, supabasePublicKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

const privilegedClient =
  supabaseUrl && supabaseServerKey
    ? createClient(supabaseUrl, supabaseServerKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      })
    : null;

function createAuthenticatedAnonClient(accessToken: string) {
  if (!supabaseUrl || !supabasePublicKey) {
    return null;
  }

  return createClient(supabaseUrl, supabasePublicKey, {
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

    const [profilesResult, publicProfilesResult, companiesResult, adminUsersResult] =
      await Promise.all([
        dbClient.from("profiles").select("*"),
        dbClient.schema("public").from("profiles").select("*"),
        dbClient.from("companies").select("*"),
        dbClient.auth.admin.listUsers(),
      ]);

    const runtimeDiagnostics = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
      SUPABASE_SERVICE_ROLE_KEY_EXISTS: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_SECRET_KEY_EXISTS: Boolean(process.env.SUPABASE_SECRET_KEY),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_EXISTS: Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ),
      SUPABASE_SERVICE_ROLE_KEY_FINGERPRINT: keyFingerprint(process.env.SUPABASE_SERVICE_ROLE_KEY),
      SUPABASE_SECRET_KEY_FINGERPRINT: keyFingerprint(process.env.SUPABASE_SECRET_KEY),
      NEXT_PUBLIC_SUPABASE_ANON_KEY_FINGERPRINT: keyFingerprint(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ),
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY_FINGERPRINT: keyFingerprint(
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ),
      SERVICE_ROLE_AND_ANON_KEYS_DIFFERENT:
        (process.env.SUPABASE_SERVICE_ROLE_KEY ?? null) !==
        (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? null),
      SERVER_AND_PUBLIC_KEYS_DIFFERENT:
        (supabaseServerKey ?? null) !== (supabasePublicKey ?? null),
      SERVER_CLIENT_KEY_SOURCE:
        process.env.SUPABASE_SECRET_KEY != null
          ? "SUPABASE_SECRET_KEY"
          : process.env.SUPABASE_SERVICE_ROLE_KEY != null
            ? "SUPABASE_SERVICE_ROLE_KEY"
            : null,
      SERVICE_ROLE_CLIENT_KEY_VARIABLE_VALUE_FINGERPRINT: keyFingerprint(
        supabaseServerKey
      ),
      SERVICE_ROLE_CLIENT_CONSTRUCTION: {
        createClientCall: "createClient(supabaseUrl, supabaseServerKey, ...)",
        constructedAtModuleScope: true,
        clientVariableName: "privilegedClient",
        reusedInHandlerVia: "const dbClient = privilegedClient",
        dbClientIsPrivilegedClient: dbClient === privilegedClient,
        overwrittenAfterConstructionInThisFile: false,
      },
      "dbClient.from(\"profiles\").select(\"*\")": {
        data: profilesResult.data ?? null,
        error:
          profilesResult.error == null
            ? null
            : {
                message: profilesResult.error.message,
                code: profilesResult.error.code ?? null,
                details: profilesResult.error.details ?? null,
                hint: profilesResult.error.hint ?? null,
              },
      },
      "dbClient.schema(\"public\").from(\"profiles\").select(\"*\")": {
        data: publicProfilesResult.data ?? null,
        error:
          publicProfilesResult.error == null
            ? null
            : {
                message: publicProfilesResult.error.message,
                code: publicProfilesResult.error.code ?? null,
                details: publicProfilesResult.error.details ?? null,
                hint: publicProfilesResult.error.hint ?? null,
              },
      },
      "dbClient.from(\"companies\").select(\"*\")": {
        data: companiesResult.data ?? null,
        error:
          companiesResult.error == null
            ? null
            : {
                message: companiesResult.error.message,
                code: companiesResult.error.code ?? null,
                details: companiesResult.error.details ?? null,
                hint: companiesResult.error.hint ?? null,
              },
      },
      "dbClient.auth.admin.listUsers()": {
        data: adminUsersResult.data ?? null,
        error:
          adminUsersResult.error == null
            ? null
            : {
                message: adminUsersResult.error.message,
                status: adminUsersResult.error.status ?? null,
                name: adminUsersResult.error.name ?? null,
              },
      },
    };

    const { data: profile, error: profileError } = await dbClient
      .from("profiles")
      .select("company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json(
        { error: profileError.message, diagnostics: runtimeDiagnostics },
        { status: 500 }
      );
    }

    let resolvedCompanyId = profile?.company_id ?? null;

    if (!resolvedCompanyId) {
      const { data: customer, error: customerError } = await dbClient
        .from("customers")
        .select("company_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (customerError) {
        return NextResponse.json(
          { error: customerError.message, diagnostics: runtimeDiagnostics },
          { status: 500 }
        );
      }

      resolvedCompanyId = customer?.company_id ?? null;
    }

    if (!resolvedCompanyId) {
      return NextResponse.json(
        { error: NO_COMPANY_ERROR, diagnostics: runtimeDiagnostics },
        { status: 403 }
      );
    }

    const { data: document, error: documentError } = await dbClient
      .from("uploaded_documents")
      .select("id, file_name, file_path, company_id")
      .eq("id", documentId)
      .eq("company_id", resolvedCompanyId)
      .maybeSingle();

    if (documentError) {
      return NextResponse.json(
        { error: documentError.message, diagnostics: runtimeDiagnostics },
        { status: 500 }
      );
    }

    if (!document) {
      return NextResponse.json(
        { error: ACCESS_DENIED_ERROR, diagnostics: runtimeDiagnostics },
        { status: 403 }
      );
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
          diagnostics: runtimeDiagnostics,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      diagnostics: runtimeDiagnostics,
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