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

    const { data: profile, error: profileError } = await dbClient
      .from("profiles")
      .select("company_id")
      .eq("auth_user_id", user.id)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const { data: customer, error: customerError } = await dbClient
      .from("customers")
      .select("company_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (customerError) {
      return NextResponse.json({ error: customerError.message }, { status: 500 });
    }

    const resolvedCompanyId = profile?.company_id ?? customer?.company_id ?? null;

    console.info("[merchant-documents:signed-url] company resolution", {
      authUserId: user.id,
      profileCompanyId: profile?.company_id ?? null,
      customerCompanyId: customer?.company_id ?? null,
      resolvedCompanyId,
    });

    if (!resolvedCompanyId) {
      console.info("[merchant-documents:signed-url] NO_COMPANY_ERROR evidence", {
        userId: user.id,
        profile,
        customer,
        resolvedCompanyId,
        noCompanyCondition: !resolvedCompanyId,
      });

      return NextResponse.json({ error: NO_COMPANY_ERROR }, { status: 403 });
    }

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
    const separatorIndex = objectKey.lastIndexOf("/");
    const parentFolder = separatorIndex >= 0 ? objectKey.slice(0, separatorIndex) : "";
    const fileName = separatorIndex >= 0 ? objectKey.slice(separatorIndex + 1) : objectKey;

    const { data: listData, error: listError } = await dbClient.storage
      .from(bucketName)
      .list(parentFolder, { limit: 1000 });

    const listedFileNames = (listData ?? []).map((item) => item.name);

    const diagnosticsBase = {
      documentId: document.id,
      uploadedDocumentFilePath: document.file_path,
      bucketUsed: bucketName,
      createSignedUrlObjectKey: objectKey,
      parentFolder,
      parentFolderFileName: fileName,
      storageListResult: listData ?? null,
      storageListError:
        listError == null
          ? null
          : {
              message: listError.message,
              status: (listError as { status?: number }).status ?? null,
              error: (listError as { error?: string }).error ?? null,
            },
      storageListFilenames: listedFileNames,
      storageListContainsFilename: listedFileNames.includes(fileName),
    };

    console.info("[merchant-documents:signed-url] storage diagnostics", diagnosticsBase);

    console.info("[merchant-documents:signed-url] createSignedUrl inputs", {
      bucket: bucketName,
      objectKey,
      "uploadedDocument.file_path": document.file_path,
      parentFolder,
      filename: fileName,
      "storage.list(parentFolder)": listData ?? null,
      "createSignedUrl.objectKey": objectKey,
    });

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

      const diagnostics = {
        ...diagnosticsBase,
        createSignedUrlError: completeSignedUrlError,
      };

      console.error("[merchant-documents:signed-url] createSignedUrl failed", diagnostics);

      return NextResponse.json(
        {
          error: signedError?.message ?? "Failed to generate signed URL",
          diagnostics,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      signedUrl: signedData.signedUrl,
      diagnostics: {
        ...diagnosticsBase,
        createSignedUrlError: null,
      },
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