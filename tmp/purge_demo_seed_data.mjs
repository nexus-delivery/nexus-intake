import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
const execute = process.argv.includes("--execute");

if (!supabaseUrl || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or service role key.");
  process.exit(1);
}

const client = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TEST_REGEX = /(test|demo|sample|seed|placeholder|dummy|qa|staging|sandbox|doorway|nook|di designs|blb)/i;

function isTestLike(value) {
  return typeof value === "string" && TEST_REGEX.test(value);
}

function rowMatches(fields) {
  return fields.some((value) => isTestLike(value));
}

function isMissingTableError(message) {
  const text = String(message ?? "").toLowerCase();
  return text.includes("could not find the table") || text.includes("relation") && text.includes("does not exist");
}

async function fetchRows(table, select) {
  const { data, error } = await client.from(table).select(select).limit(5000);
  if (error) {
    if (isMissingTableError(error.message)) {
      console.warn(`${table}: skipped (table missing)`);
      return [];
    }
    throw new Error(`${table}.select failed: ${error.message}`);
  }
  return data ?? [];
}

async function deleteIds(table, idColumn, ids) {
  if (ids.length === 0) return 0;
  if (!execute) return ids.length;
  const { error } = await client.from(table).delete().in(idColumn, ids);
  if (error) throw new Error(`${table}.delete failed: ${error.message}`);
  return ids.length;
}

async function run() {
  const summary = {};

  const companies = await fetchRows("companies", "id,name,trading_name,business_type");
  const testCompanyIds = companies
    .filter((row) => rowMatches([row.name, row.trading_name, row.business_type]))
    .map((row) => row.id);
  summary.companies_detected = testCompanyIds.length;

  const organisations = await fetchRows("organisations", "id,slug,name,trading_name,status,source_system");
  const testOrganisationIds = organisations
    .filter((row) => rowMatches([row.slug, row.name, row.trading_name, row.status, row.source_system]))
    .map((row) => row.id);
  summary.organisations_detected = testOrganisationIds.length;

  const targetOrganisationIds = new Set([...testCompanyIds, ...testOrganisationIds]);

  const profiles = await fetchRows("profiles", "id,auth_user_id,company_id,email,full_name");
  const testProfileIds = profiles
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.email, row.full_name]))
    .map((row) => row.id);
  summary.profiles_detected = testProfileIds.length;

  const organisationUsers = await fetchRows("organisation_users", "id,organisation_id,user_id,role,status");
  const testOrganisationUserIds = organisationUsers
    .filter((row) => targetOrganisationIds.has(row.organisation_id) || rowMatches([row.role, row.status]))
    .map((row) => row.id);
  summary.organisation_users_detected = testOrganisationUserIds.length;

  const customers = await fetchRows("merchant_customers", "id,company_id,customer_name,company,contact_name,email");
  const testCustomerIds = customers
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.customer_name, row.company, row.contact_name, row.email]))
    .map((row) => row.id);
  summary.merchant_customers_detected = testCustomerIds.length;

  const jobs = await fetchRows("draft_jobs", "id,company_id,job_reference,external_order_id,customer,collection_company,delivery_company");
  const testJobIds = jobs
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.job_reference, row.external_order_id, row.customer, row.collection_company, row.delivery_company]))
    .map((row) => row.id);
  summary.draft_jobs_detected = testJobIds.length;

  const notifications = await fetchRows("notifications", "id,company_id,title,body");
  const testNotificationIds = notifications
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.title, row.body]))
    .map((row) => row.id);
  summary.notifications_detected = testNotificationIds.length;

  const uploadedDocuments = await fetchRows("uploaded_documents", "id,company_id,file_name,document_type,status");
  const testDocumentIds = uploadedDocuments
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.file_name, row.document_type, row.status]))
    .map((row) => row.id);
  summary.uploaded_documents_detected = testDocumentIds.length;

  const extractedFields = await fetchRows("document_extracted_fields", "id,document_id");
  const testExtractedFieldIds = extractedFields
    .filter((row) => testDocumentIds.includes(row.document_id))
    .map((row) => row.id);
  summary.document_extracted_fields_detected = testExtractedFieldIds.length;

  const customerAddresses = await fetchRows("merchant_customer_addresses", "id,company_id,merchant_customer_id,label,contact_name,address_line1");
  const testAddressIds = customerAddresses
    .filter((row) => targetOrganisationIds.has(row.company_id) || testCustomerIds.includes(row.merchant_customer_id) || rowMatches([row.label, row.contact_name, row.address_line1]))
    .map((row) => row.id);
  summary.merchant_customer_addresses_detected = testAddressIds.length;

  const bookingProfiles = await fetchRows("merchant_customer_booking_profiles", "id,company_id,merchant_customer_id,profile_name,instructions");
  const testBookingProfileIds = bookingProfiles
    .filter((row) => targetOrganisationIds.has(row.company_id) || testCustomerIds.includes(row.merchant_customer_id) || rowMatches([row.profile_name, row.instructions]))
    .map((row) => row.id);
  summary.merchant_customer_booking_profiles_detected = testBookingProfileIds.length;

  const collectionProfiles = await fetchRows("merchant_collection_profiles", "id,company_id,profile_name,company_name,address_line1");
  const testCollectionProfileIds = collectionProfiles
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.profile_name, row.company_name, row.address_line1]))
    .map((row) => row.id);
  summary.merchant_collection_profiles_detected = testCollectionProfileIds.length;

  const salesChannels = await fetchRows("sales_channels", "id,company_id,name,active");
  const testSalesChannelIds = salesChannels
    .filter((row) => targetOrganisationIds.has(row.company_id) || rowMatches([row.name, row.active ? "active" : "inactive"]))
    .map((row) => row.id);
  summary.sales_channels_detected = testSalesChannelIds.length;

  summary.document_extracted_fields_deleted = await deleteIds("document_extracted_fields", "id", testExtractedFieldIds);
  summary.notifications_deleted = await deleteIds("notifications", "id", testNotificationIds);
  summary.merchant_customer_booking_profiles_deleted = await deleteIds("merchant_customer_booking_profiles", "id", testBookingProfileIds);
  summary.merchant_customer_addresses_deleted = await deleteIds("merchant_customer_addresses", "id", testAddressIds);
  summary.merchant_collection_profiles_deleted = await deleteIds("merchant_collection_profiles", "id", testCollectionProfileIds);
  summary.sales_channels_deleted = await deleteIds("sales_channels", "id", testSalesChannelIds);
  summary.merchant_customers_deleted = await deleteIds("merchant_customers", "id", testCustomerIds);
  summary.draft_jobs_deleted = await deleteIds("draft_jobs", "id", testJobIds);
  summary.uploaded_documents_deleted = await deleteIds("uploaded_documents", "id", testDocumentIds);

  if (execute && testProfileIds.length > 0) {
    const { error } = await client.from("profiles").delete().in("id", testProfileIds);
    if (error) throw new Error(`profiles.delete failed: ${error.message}`);
    summary.profiles_deleted = testProfileIds.length;
  } else {
    summary.profiles_deleted = testProfileIds.length;
  }

  if (execute && testCompanyIds.length > 0) {
    const { error } = await client.from("companies").delete().in("id", testCompanyIds);
    if (error) throw new Error(`companies.delete failed: ${error.message}`);
    summary.companies_deleted = testCompanyIds.length;
  } else {
    summary.companies_deleted = testCompanyIds.length;
  }

  if (execute && testOrganisationIds.length > 0) {
    const { error } = await client.from("organisations").delete().in("id", testOrganisationIds);
    if (error) throw new Error(`organisations.delete failed: ${error.message}`);
    summary.organisations_deleted = testOrganisationIds.length;
  } else {
    summary.organisations_deleted = testOrganisationIds.length;
  }

  if (execute && testOrganisationUserIds.length > 0) {
    const { error } = await client.from("organisation_users").delete().in("id", testOrganisationUserIds);
    if (error) throw new Error(`organisation_users.delete failed: ${error.message}`);
    summary.organisation_users_deleted = testOrganisationUserIds.length;
  } else {
    summary.organisation_users_deleted = testOrganisationUserIds.length;
  }

  console.log(JSON.stringify({ execute, summary }, null, 2));
}

run().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
