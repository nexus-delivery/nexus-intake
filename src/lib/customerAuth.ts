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

const LOGO_MAX_SIZE_BYTES = 10 * 1024 * 1024;
const LOGO_ALLOWED_TYPES = new Set(["image/png", "image/jpg", "image/jpeg", "image/gif", "image/webp"]);

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
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "png";
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
    throw new Error(error.message);
  }

  return data;
}

export async function ensureCustomerRecord(userId: string, email: string | null): Promise<void> {
  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("customers").upsert(
    {
      user_id: userId,
      contact_email: email,
      onboarding_complete: false,
      terms_accepted: false,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function resolvePostSignInPath(userId: string, email: string | null): Promise<"/" | "/onboarding"> {
  await ensureCustomerRecord(userId, email);
  const customer = await fetchCustomerByUserId(userId);
  return customer?.onboarding_complete ? "/" : "/onboarding";
}

export async function uploadCompanyLogo(file: File, userId: string): Promise<string> {
  if (!supabase) {
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
    setTimeout(() => reject(new Error("Logo upload timed out. Please try again.")), 30_000);
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
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", params.userId);

  if (error) {
    throw new Error(error.message);
  }
}
