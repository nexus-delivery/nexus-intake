import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * TEMPORARY DEBUG ENDPOINT - Remove before merge
 * 
 * Diagnostic endpoint to test signed URL generation against live Supabase Storage.
 * Helps identify path format issues and permission problems.
 * 
 * POST /api/debug/signed-url
 * {
 *   "documentId": "doc-uuid",
 *   "filePath": "3fc46433-2dbc-43e1-9fa5-8ed68957d746/uploads/1782662657399-Nook purchase order UKLH 402D.pdf"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { documentId, filePath } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase env vars not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const bucketName = "merchant-documents";

    console.log("[DEBUG:SignedURL] Starting diagnostic", {
      documentId,
      filePath,
      filePathLength: filePath?.length,
      filePathType: typeof filePath,
      bucketName,
      timestamp: new Date().toISOString(),
    });

    const diagnostics: Record<string, any> = {
      input: {
        documentId,
        filePath,
        bucketName,
      },
      tests: {},
    };

    // Test 1: Extract folder path and list files
    const folderPath =
      filePath && filePath.includes("/")
        ? filePath.substring(0, filePath.lastIndexOf("/"))
        : "";

    console.log("[DEBUG:SignedURL] Test 1: List files in folder", {
      folderPath,
    });

    const { data: listData, error: listError } = await supabase.storage
      .from(bucketName)
      .list(folderPath);

    diagnostics.tests.list = {
      folderPath,
      error: listError?.message || null,
      errorStatus: (listError as any)?.status || null,
      filesFound: listData?.length || 0,
      files:
        listData?.map((f) => ({
          name: f.name,
          id: f.id,
          metadata: f.metadata,
        })) || [],
    };

    console.log("[DEBUG:SignedURL] Test 1 result", diagnostics.tests.list);

    // Test 2: Try createSignedUrl with exact path
    console.log("[DEBUG:SignedURL] Test 2: createSignedUrl with exact path", {
      filePath,
    });

    const { data: signedData, error: signedError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 60 * 60);

    diagnostics.tests.signedUrlExact = {
      filePath,
      error: signedError?.message || null,
      errorStatus: (signedError as any)?.status || null,
      errorCode: (signedError as any)?.code || null,
      signedUrlGenerated: !!signedData?.signedUrl,
      signedUrlLength: signedData?.signedUrl?.length || 0,
    };

    console.log(
      "[DEBUG:SignedURL] Test 2 result",
      diagnostics.tests.signedUrlExact
    );

    // Test 3: Try with leading slash removed
    let pathWithoutLeadingSlash = filePath;
    if (filePath?.startsWith("/")) {
      pathWithoutLeadingSlash = filePath.substring(1);
      console.log("[DEBUG:SignedURL] Test 3: Path has leading /, trying without", {
        pathWithoutLeadingSlash,
      });

      const { data: altData, error: altError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(pathWithoutLeadingSlash, 60 * 60);

      diagnostics.tests.signedUrlNoLeadingSlash = {
        filePath: pathWithoutLeadingSlash,
        error: altError?.message || null,
        errorStatus: (altError as any)?.status || null,
        signedUrlGenerated: !!altData?.signedUrl,
      };

      console.log(
        "[DEBUG:SignedURL] Test 3 result",
        diagnostics.tests.signedUrlNoLeadingSlash
      );
    }

    // Test 4: Try with leading slash added (if not present)
    let pathWithLeadingSlash = filePath;
    if (!filePath?.startsWith("/")) {
      pathWithLeadingSlash = "/" + filePath;
      console.log("[DEBUG:SignedURL] Test 4: Path has no leading /, trying with", {
        pathWithLeadingSlash,
      });

      const { data: altData, error: altError } = await supabase.storage
        .from(bucketName)
        .createSignedUrl(pathWithLeadingSlash, 60 * 60);

      diagnostics.tests.signedUrlWithLeadingSlash = {
        filePath: pathWithLeadingSlash,
        error: altError?.message || null,
        errorStatus: (altError as any)?.status || null,
        signedUrlGenerated: !!altData?.signedUrl,
      };

      console.log(
        "[DEBUG:SignedURL] Test 4 result",
        diagnostics.tests.signedUrlWithLeadingSlash
      );
    }

    console.log("[DEBUG:SignedURL] Diagnostic complete", diagnostics);

    return NextResponse.json(diagnostics);
  } catch (err) {
    console.error("[DEBUG:SignedURL] Exception", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        errorStack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
