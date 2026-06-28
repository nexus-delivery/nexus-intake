import { supabase } from "@/lib/supabaseClient";

export type BusinessType =
  | "courier"
  | "fulfilment"
  | "retailer"
  | "manufacturer"
  | "marketplace_seller"
  | "other";

export type CustomerRecord = {
  id: string;
  user_id: string;
  company_id: string;
  merchant_id: string | null;
  customer_type: "company";
  customer_name: string;
  email: string;
  phone: string;
  company_name: string;
  company_logo_url: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  business_type: BusinessType;
  business_address: string | null;
  terms_accepted: boolean;
  onboarding_complete: boolean;
};

type InitializeCustomerRecordParams = {
  userId: string;
  email: string | null;
  setup: InitialCustomerSetupData;
};

export type InitialCustomerSetupData = {
  companyName: string;
  contactName: string;
  contactPhone: string;
  businessType: BusinessType;
  companyId?: string;
  merchantId?: string | null;
};

// 10MB aligns with onboarding upload requirements for company branding assets.
const LOGO_MAX_SIZE_BYTES = 10 * 1024 * 1024;
// 30 seconds prevents indefinite wait states while still allowing normal uploads.
const LOGO_UPLOAD_TIMEOUT_MS = 30_000;
const DUPLICATE_KEY_ERROR_CODE = "23505";
const UNDEFINED_COLUMN_ERROR_CODE = "42703";
const LOGO_ALLOWED_TYPES = new Set(["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"]);
const LOGO_EXTENSION_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpg": "jpg",
  "image/jpeg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
};

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password must include an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password must include a lowercase letter.";
  if (!/[0-9]/.test(password)) return "Password must include a number.";
  return null;
}

export function validatePhone(phone: string): boolean {
  return /^[+()\-\s0-9]{7,20}$/.test(phone.trim());
}

export function mapAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login credentials")) {
    return "Invalid email or password.";
  }
  if (lower.includes("user already registered")) {
    return "Email already in use.";
  }
  if (lower.includes("password")) {
    return "Password is too weak. Please use at least 8 characters with upper/lowercase letters and a number.";
  }
  return message;
}

function getFileExtension(file: File): string {
  const parts = file.name.split(".");
  if (parts.length > 1) {
    const extension = parts[parts.length - 1].toLowerCase();
    const nameWithoutExtension = parts.slice(0, -1).join("").trim();
    if (nameWithoutExtension.length > 0) {
      return extension;
    }
  }
  return LOGO_EXTENSION_BY_MIME[file.type] ?? "bin";
}

export function validateLogoFile(file: File): string | null {
  if (!LOGO_ALLOWED_TYPES.has(file.type)) {
    return "Unsupported logo type. Please upload PNG, JPG, JPEG, GIF, or WebP.";
  }
  if (file.size > LOGO_MAX_SIZE_BYTES) {
    return "Logo exceeds 10MB size limit.";
  }
  return null;
}

export async function fetchCustomerByUserId(userId: string): Promise<CustomerRecord | null> {
  if (!supabase) {
    console.error("fetchCustomerByUserId called without Supabase client", { userId });
    return null;
  }

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, user_id, company_id, merchant_id, customer_type, customer_name, email, phone, company_name, company_logo_url, contact_name, contact_email, contact_phone, business_type, business_address, terms_accepted, onboarding_complete"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch customer by user id", { userId, error });
    throw new Error(error.message);
  }

  return data;
}

function buildInitialCustomerPayload({ userId, email, setup }: InitializeCustomerRecordParams) {
  const normalizedEmail = email?.trim();
  if (!normalizedEmail) {
    throw new Error("A valid email is required to initialize a customer record.");
  }

  const companyName = setup.companyName.trim();
  const contactName = setup.contactName.trim();
  const contactPhone = setup.contactPhone.trim();
  const companyId = setup.companyId ?? crypto.randomUUID();
  const merchantId = setup.merchantId ?? null;

  return {
    user_id: userId,
    company_id: companyId,
    merchant_id: merchantId,
    customer_type: "company" as const,
    customer_name: companyName,
    email: normalizedEmail,
    phone: contactPhone,
    company_name: companyName,
    company_logo_url: "",
    contact_name: contactName,
    contact_email: normalizedEmail,
    contact_phone: contactPhone,
    business_type: setup.businessType,
    business_address: "Provided during signup",
    terms_accepted: false,
    onboarding_complete: false,
  };
}

async function ensureCompanyRecord(companyId: string, companyName: string): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }
  const client = supabase;

  const { data: existing, error: existingError } = await client
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .maybeSingle();

  if (existingError) {
    console.error("Failed to check company record", { companyId, existingError });
    throw new Error(existingError.message);
  }

  if (existing?.id) {
    return;
  }

  const attemptInsert = async (payload: Record<string, unknown>) => {
    const { error } = await client.from("companies").insert(payload);
    if (!error || error.code === DUPLICATE_KEY_ERROR_CODE) {
      return true;
    }
    if (error.code === UNDEFINED_COLUMN_ERROR_CODE) {
      return false;
    }
    console.error("Failed to create company record", { companyId, payload, error });
    throw new Error(error.message);
  };

  const insertedWithCompanyName = await attemptInsert({
    id: companyId,
    company_name: companyName,
  });

  if (!insertedWithCompanyName) {
    const insertedWithName = await attemptInsert({
      id: companyId,
      name: companyName,
    });
    if (!insertedWithName) {
      await attemptInsert({
        id: companyId,
      });
    }
  }
}

export async function initializeCustomerRecord(params: InitializeCustomerRecordParams): Promise<void> {
  if (!supabase) {
    console.error("initializeCustomerRecord called without Supabase client", { userId: params.userId });
    return;
  }

  const payload = buildInitialCustomerPayload(params);
  await ensureCompanyRecord(payload.company_id, payload.company_name);
  console.debug("Initializing customer record", {
    userId: params.userId,
    companyId: payload.company_id,
    customerType: payload.customer_type,
  });
  const { error } = await supabase.from("customers").insert(payload);

  if (error) {
    if (error.code === DUPLICATE_KEY_ERROR_CODE) {
      return;
    }

    console.error("Failed to initialize customer record", {
      userId: params.userId,
      email: params.email,
      error,
    });
    throw new Error(error.message);
  }
}

export async function ensureCustomerRecord(userId: string, email: string | null): Promise<void> {
  if (!supabase) {
    console.error("ensureCustomerRecord called without Supabase client", { userId });
    return;
  }

  try {
    await ensureCustomerRecordWithSetup(userId, email, null);
  } catch (error) {
    console.error("Failed to ensure customer record", { userId, email, error });
    throw error instanceof Error ? error : new Error("Unable to ensure customer record.");
  }
}

export async function ensureCustomerRecordWithSetup(
  userId: string,
  email: string | null,
  setup: InitialCustomerSetupData | null
): Promise<boolean> {
  if (!supabase) {
    console.error("ensureCustomerRecordWithSetup called without Supabase client", { userId });
    return false;
  }

  try {
    const existing = await fetchCustomerByUserId(userId);
    if (existing) {
      console.debug("Customer record already exists", { userId, customerId: existing.id });
      return true;
    }

    if (!setup) {
      console.debug("Customer record missing and setup data unavailable; onboarding required", { userId });
      return false;
    }

    await initializeCustomerRecord({ userId, email, setup });
    return true;
  } catch (error) {
    console.error("Failed to ensure customer record with setup", { userId, email, error });
    throw error instanceof Error ? error : new Error("Unable to ensure customer record.");
  }
}

export async function resolvePostSignInPath(
  userId: string,
  email: string | null,
  setup: InitialCustomerSetupData | null = null
): Promise<"/" | "/onboarding"> {
  try {
    await ensureCustomerRecordWithSetup(userId, email, setup);
    const customer = await fetchCustomerByUserId(userId);
    console.debug("Resolved post-signin path", {
      userId,
      hasCustomer: Boolean(customer),
      onboardingComplete: Boolean(customer?.onboarding_complete),
    });
    return customer?.onboarding_complete ? "/" : "/onboarding";
  } catch (error) {
    console.error("Failed to resolve post-signin path", { userId, email, error });
    throw error instanceof Error ? error : new Error("Unable to resolve post-signin destination.");
  }
}

export async function uploadCompanyLogo(file: File, userId: string): Promise<string> {
  if (!supabase) {
    console.error("uploadCompanyLogo called without Supabase client", { userId });
    throw new Error("Supabase is not configured.");
  }

  const validationError = validateLogoFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  const extension = getFileExtension(file);
  const path = `${userId}/logo.${extension}`;

  const uploadPromise = supabase.storage.from("company-logos").upload(path, file, {
    cacheControl: "3600",
    upsert: true,
  });

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("Logo upload timed out. Please try again.")), LOGO_UPLOAD_TIMEOUT_MS);
  });

  const result = await Promise.race([uploadPromise, timeoutPromise]);

  if (result.error) {
    throw new Error(result.error.message);
  }

  const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
  return data.publicUrl;
}

export async function completeCustomerOnboarding(params: {
  userId: string;
  companyName: string;
  logoUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  businessType: BusinessType;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("customers")
    .update({
      company_name: params.companyName,
      customer_name: params.companyName,
      company_logo_url: params.logoUrl,
      contact_name: params.contactName,
      contact_email: params.contactEmail,
      contact_phone: params.contactPhone,
      email: params.contactEmail,
      phone: params.contactPhone,
      business_type: params.businessType,
      terms_accepted: true,
      onboarding_complete: true,
    })
    .eq("user_id", params.userId);

  if (error) {
    console.error("Failed to complete customer onboarding", { userId: params.userId, error });
    throw new Error(error.message);
  }
}
