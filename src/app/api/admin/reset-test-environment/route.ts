import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getMerchantContext } from "@/lib/serverAuth";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServerKey =
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_ROLES = new Set([
  "super_admin",
  "platform_admin",
  "operations_admin",
  "admin",
  "company_admin",
]);

type ResetBody = {
  confirm?: string;
  dryRun?: boolean;
};

function createPrivilegedClient() {
  if (!supabaseUrl || !supabaseServerKey) return null;
  return createClient(supabaseUrl, supabaseServerKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: NextRequest) {
  const context = await getMerchantContext(request);
  if (!context.ok) {
    return NextResponse.json({ error: context.error }, { status: context.status });
  }

  const role = context.value.role.trim().toLowerCase();
  if (!ADMIN_ROLES.has(role)) {
    return NextResponse.json(
      { error: "Only admin roles can run environment reset." },
      { status: 403 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as ResetBody;
  const dryRun = body.dryRun !== false;

  if (!dryRun && body.confirm !== "RESET_TEST_ENVIRONMENT") {
    return NextResponse.json(
      {
        error:
          'Set { "confirm": "RESET_TEST_ENVIRONMENT", "dryRun": false } to run destructive reset.',
      },
      { status: 400 }
    );
  }

  const companyId = context.value.companyId;
  const client = context.value.privilegedClient;
  const serviceClient = createPrivilegedClient();

  const summary: Record<string, number> = {};
  const warnings: string[] = [];

  const { data: uploadedDocuments, error: uploadedDocIdsError } = await client
    .from("uploaded_documents")
    .select("id")
    .eq("company_id", companyId);

  if (uploadedDocIdsError) {
    warnings.push(`uploaded_documents.select: ${uploadedDocIdsError.message}`);
  }

  const uploadedDocumentIds = (uploadedDocuments ?? []).map((row) => String(row.id));

  if (uploadedDocumentIds.length > 0) {
    const { count: extractedCount, error: extractedCountError } = await client
      .from("document_extracted_fields")
      .select("id", { count: "exact", head: true })
      .in("document_id", uploadedDocumentIds);

    if (extractedCountError) {
      warnings.push(`document_extracted_fields.count: ${extractedCountError.message}`);
    }
    summary["document_extracted_fields"] = extractedCount ?? 0;

    if (!dryRun && (extractedCount ?? 0) > 0) {
      const { error: extractedDeleteError } = await client
        .from("document_extracted_fields")
        .delete()
        .in("document_id", uploadedDocumentIds);
      if (extractedDeleteError) {
        warnings.push(`document_extracted_fields.delete: ${extractedDeleteError.message}`);
      }
    }
  } else {
    summary["document_extracted_fields"] = 0;
  }

  const { count: notificationsCount, error: notificationsCountError } = await client
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (notificationsCountError) warnings.push(`notifications.count: ${notificationsCountError.message}`);
  summary["notifications"] = notificationsCount ?? 0;
  if (!dryRun && (notificationsCount ?? 0) > 0) {
    const { error } = await client.from("notifications").delete().eq("company_id", companyId);
    if (error) warnings.push(`notifications.delete: ${error.message}`);
  }

  const { count: bookingProfilesCount, error: bookingProfilesCountError } = await client
    .from("merchant_customer_booking_profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (bookingProfilesCountError) warnings.push(`merchant_customer_booking_profiles.count: ${bookingProfilesCountError.message}`);
  summary["merchant_customer_booking_profiles"] = bookingProfilesCount ?? 0;
  if (!dryRun && (bookingProfilesCount ?? 0) > 0) {
    const { error } = await client
      .from("merchant_customer_booking_profiles")
      .delete()
      .eq("company_id", companyId);
    if (error) warnings.push(`merchant_customer_booking_profiles.delete: ${error.message}`);
  }

  const { count: customerAddressesCount, error: customerAddressesCountError } = await client
    .from("merchant_customer_addresses")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (customerAddressesCountError) warnings.push(`merchant_customer_addresses.count: ${customerAddressesCountError.message}`);
  summary["merchant_customer_addresses"] = customerAddressesCount ?? 0;
  if (!dryRun && (customerAddressesCount ?? 0) > 0) {
    const { error } = await client
      .from("merchant_customer_addresses")
      .delete()
      .eq("company_id", companyId);
    if (error) warnings.push(`merchant_customer_addresses.delete: ${error.message}`);
  }

  const { count: collectionProfilesCount, error: collectionProfilesCountError } = await client
    .from("merchant_collection_profiles")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (collectionProfilesCountError) warnings.push(`merchant_collection_profiles.count: ${collectionProfilesCountError.message}`);
  summary["merchant_collection_profiles"] = collectionProfilesCount ?? 0;
  if (!dryRun && (collectionProfilesCount ?? 0) > 0) {
    const { error } = await client
      .from("merchant_collection_profiles")
      .delete()
      .eq("company_id", companyId);
    if (error) warnings.push(`merchant_collection_profiles.delete: ${error.message}`);
  }

  const { count: customersCount, error: customersCountError } = await client
    .from("merchant_customers")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (customersCountError) warnings.push(`merchant_customers.count: ${customersCountError.message}`);
  summary["merchant_customers"] = customersCount ?? 0;
  if (!dryRun && (customersCount ?? 0) > 0) {
    const { error } = await client.from("merchant_customers").delete().eq("company_id", companyId);
    if (error) warnings.push(`merchant_customers.delete: ${error.message}`);
  }

  const { count: catalogueItemsCount, error: catalogueItemsCountError } = await client
    .from("catalogue_items")
    .select("id", { count: "exact", head: true })
    .eq("merchant_id", companyId);
  if (catalogueItemsCountError) warnings.push(`catalogue_items.count: ${catalogueItemsCountError.message}`);
  summary["catalogue_items"] = catalogueItemsCount ?? 0;
  if (!dryRun && (catalogueItemsCount ?? 0) > 0) {
    const { error } = await client.from("catalogue_items").delete().eq("merchant_id", companyId);
    if (error) warnings.push(`catalogue_items.delete: ${error.message}`);
  }

  const { count: draftJobsCount, error: draftJobsCountError } = await client
    .from("draft_jobs")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (draftJobsCountError) warnings.push(`draft_jobs.count: ${draftJobsCountError.message}`);
  summary["draft_jobs"] = draftJobsCount ?? 0;
  if (!dryRun && (draftJobsCount ?? 0) > 0) {
    const { error } = await client.from("draft_jobs").delete().eq("company_id", companyId);
    if (error) warnings.push(`draft_jobs.delete: ${error.message}`);
  }

  const { count: uploadedDocumentsCount, error: uploadedDocumentsCountError } = await client
    .from("uploaded_documents")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId);
  if (uploadedDocumentsCountError) warnings.push(`uploaded_documents.count: ${uploadedDocumentsCountError.message}`);
  summary["uploaded_documents"] = uploadedDocumentsCount ?? 0;
  if (!dryRun && (uploadedDocumentsCount ?? 0) > 0) {
    const { error } = await client
      .from("uploaded_documents")
      .delete()
      .eq("company_id", companyId);
    if (error) warnings.push(`uploaded_documents.delete: ${error.message}`);
  }

  let storageObjects = 0;
  if (serviceClient) {
    const keysToDelete: string[] = [];

    const collectKeys = async (prefix: string) => {
      let offset = 0;
      while (true) {
        const { data: list, error } = await serviceClient.storage
          .from("merchant-documents")
          .list(prefix, { limit: 100, offset });

        if (error) {
          warnings.push(`merchant-documents.list(${prefix}): ${error.message}`);
          return;
        }

        if (!list || list.length === 0) {
          return;
        }

        for (const entry of list) {
          if (!entry.name) continue;
          if (entry.id) {
            keysToDelete.push(`${prefix}/${entry.name}`);
          }
        }

        if (list.length < 100) {
          return;
        }
        offset += 100;
      }
    };

    await collectKeys(companyId);
    await collectKeys(`${companyId}/uploads`);

    // Deduplicate in case nested scans overlap.
    const uniqueKeys = Array.from(new Set(keysToDelete));

    storageObjects = uniqueKeys.length;
    summary["storage:merchant-documents"] = storageObjects;

    if (!dryRun && uniqueKeys.length > 0) {
      const { error: removeError } = await serviceClient.storage
        .from("merchant-documents")
        .remove(uniqueKeys);
      if (removeError) {
        warnings.push(`merchant-documents.remove: ${removeError.message}`);
      }
    }
  } else {
    warnings.push("storage reset skipped: service role client unavailable");
  }

  return NextResponse.json({
    success: true,
    companyId,
    dryRun,
    summary,
    warnings,
    nextStep: dryRun
      ? 'Re-run with { "confirm": "RESET_TEST_ENVIRONMENT", "dryRun": false }'
      : "Reset complete",
  });
}
