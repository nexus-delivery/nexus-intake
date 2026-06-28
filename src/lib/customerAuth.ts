import { supabase } from "@/lib/supabaseClient";

export type BusinessType = "merchant" | "shipper" | "logistics_partner" | "other";

export type CustomerRecord = {
  id: string;
  user_id: string;
  company_name: string | null;
  company_logo_url: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  business_type: BusinessType | null;
  business_address: string | null;
  terms_accepted: boolean;
  onboarding_complete: boolean;
};

type InitializeCustomerRecordParams = {
  userId: string;
  email: string | null;
};

// 10MB aligns with onboarding upload requirements for company branding assets.
const LOGO_MAX_SIZE_BYTES = 10 * 1024 * 1024;
// 30 seconds prevents indefinite wait states while still allowing normal uploads.
const LOGO_UPLOAD_TIMEOUT_MS = 30_000;
const FALLBACK_CONTACT_EMAIL_DOMAIN = "example.com";
const DEFAULT_CONTACT_NAME = "New Customer";
const DUPLICATE_KEY_ERROR_CODE = "23505";
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
      "id, user_id, company_name, company_logo_url, contact_name, contact_email, contact_phone, business_type, business_address, terms_accepted, onboarding_complete"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch customer by user id", { userId, error });
    throw new Error(error.message);
  }

  return data;
}

function getDefaultContactName(email: string | null): string {
  if (!email) {
    return DEFAULT_CONTACT_NAME;
  }

  const localPart = email.split("@")[0]?.trim();
  if (!localPart) {
    return DEFAULT_CONTACT_NAME;
  }

  const normalized = localPart
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return DEFAULT_CONTACT_NAME;
  }

  return normalized
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

function buildInitialCustomerPayload({ userId, email }: InitializeCustomerRecordParams) {
  const emailWithFallback = email?.trim() || `${userId}@${FALLBACK_CONTACT_EMAIL_DOMAIN}`;
  const contactName = getDefaultContactName(email);
  const companyName = contactName === DEFAULT_CONTACT_NAME ? "Company Pending Setup" : `${contactName} Company`;

  return {
    user_id: userId,
    company_name: companyName,
    company_logo_url: "",
    contact_name: contactName,
    contact_email: emailWithFallback,
    contact_phone: "",
    business_type: "merchant" as const,
    business_address: "",
    terms_accepted: false,
    onboarding_complete: false,
  };
}

export async function initializeCustomerRecord(params: InitializeCustomerRecordParams): Promise<void> {
  if (!supabase) {
    console.error("initializeCustomerRecord called without Supabase client", { userId: params.userId });
    return;
  }

  const payload = buildInitialCustomerPayload(params);
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
    const existing = await fetchCustomerByUserId(userId);
    if (existing) {
      return;
    }

    await initializeCustomerRecord({ userId, email });
  } catch (error) {
    console.error("Failed to ensure customer record", { userId, email, error });
    throw error instanceof Error ? error : new Error("Unable to ensure customer record.");
  }
}

export async function resolvePostSignInPath(userId: string, email: string | null): Promise<"/" | "/onboarding"> {
  try {
    await ensureCustomerRecord(userId, email);
    const customer = await fetchCustomerByUserId(userId);
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
  businessAddress: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase
    .from("customers")
    .update({
      company_name: params.companyName,
      company_logo_url: params.logoUrl,
      contact_name: params.contactName,
      contact_email: params.contactEmail,
      contact_phone: params.contactPhone,
      business_type: params.businessType,
      business_address: params.businessAddress,
      terms_accepted: true,
      onboarding_complete: true,
    })
    .eq("user_id", params.userId);

  if (error) {
    console.error("Failed to complete customer onboarding", { userId: params.userId, error });
    throw new Error(error.message);
  }
}
