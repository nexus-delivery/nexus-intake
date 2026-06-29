import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * TEMPORARY DEBUG ENDPOINT - Remove before merge
 * 
 * Lists actual object keys in Supabase Storage bucket to identify path mismatches.
 * 
 * POST /api/debug/list-storage
 * {
 *   "companyId": "3fc46433-2dbc-43e1-9fa5-8ed68957d746"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const { companyId } = await request.json();

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

    console.log("[DEBUG:Storage] Starting storage inspection", {
      bucketName,
      companyId,
      timestamp: new Date().toISOString(),
    });

    const diagnostics: Record<string, any> = {
      input: {
        bucketName,
        companyId,
      },
      tests: {},
    };

    // Test 1: List root of bucket
    console.log("[DEBUG:Storage] Test 1: List bucket root");
    const { data: rootData, error: rootError } = await supabase.storage
      .from(bucketName)
      .list("", { limit: 1000 });

    diagnostics.tests.bucketRoot = {
      error: rootError?.message || null,
      itemsFound: rootData?.length || 0,
      items: rootData?.map((item) => ({
        name: item.name,
        id: item.id,
        isDir: !item.metadata,
      })) || [],
    };

    console.log("[DEBUG:Storage] Test 1 result", diagnostics.tests.bucketRoot);

    // Test 2: List company folder recursively
    if (companyId) {
      console.log("[DEBUG:Storage] Test 2: List company folder recursively");
      const { data: companyData, error: companyError } = await supabase.storage
        .from(bucketName)
        .list(companyId, { limit: 1000 });

      diagnostics.tests.companyFolder = {
        path: companyId,
        error: companyError?.message || null,
        itemsFound: companyData?.length || 0,
        items: companyData?.map((item) => ({
          name: item.name,
          id: item.id,
          fullPath: `${companyId}/${item.name}`,
        })) || [],
      };

      console.log("[DEBUG:Storage] Test 2 result", diagnostics.tests.companyFolder);

      // Test 3: Try listing uploads subfolder
      console.log("[DEBUG:Storage] Test 3: List uploads subfolder");
      const uploadsPath = `${companyId}/uploads`;
      const { data: uploadsData, error: uploadsError } = await supabase.storage
        .from(bucketName)
        .list(uploadsPath, { limit: 1000 });

      diagnostics.tests.uploadsFolder = {
        path: uploadsPath,
        error: uploadsError?.message || null,
        itemsFound: uploadsData?.length || 0,
        items: uploadsData?.map((item) => ({
          name: item.name,
          id: item.id,
          fullPath: `${uploadsPath}/${item.name}`,
        })) || [],
      };

      console.log("[DEBUG:Storage] Test 3 result", diagnostics.tests.uploadsFolder);
    }

    console.log("[DEBUG:Storage] Inspection complete", diagnostics);

    return NextResponse.json(diagnostics);
  } catch (err) {
    console.error("[DEBUG:Storage] Exception", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Unknown error",
        errorStack: err instanceof Error ? err.stack : undefined,
      },
      { status: 500 }
    );
  }
}
