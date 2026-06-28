"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  BusinessType,
  completeCustomerOnboarding,
  ensureCustomerRecordWithSetup,
  fetchCustomerByUserId,
  uploadCompanyLogo,
  validateEmail,
  validateLogoFile,
  validatePhone,
} from "@/lib/customerAuth";
import { supabase } from "@/lib/supabaseClient";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "courier", label: "Courier" },
  { value: "fulfilment", label: "Fulfilment" },
  { value: "retailer", label: "Retailer" },
  { value: "manufacturer", label: "Manufacturer" },
  { value: "marketplace_seller", label: "Marketplace Seller" },
  { value: "other", label: "Other" },
];

function isBusinessType(value: unknown): value is BusinessType {
  return BUSINESS_TYPES.some((type) => type.value === value);
}

export default function OnboardingPage() {
  const router = useRouter();
  const [bootstrapRetryKey, setBootstrapRetryKey] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [companyId, setCompanyId] = useState(() => crypto.randomUUID());
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("courier");
  const [customerExists, setCustomerExists] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!supabase) {
          setLoading(false);
          return;
        }

        const { data: userData } = await supabase.auth.getUser();
        const user = userData.user;
        if (!user) {
          router.replace("/signin");
          return;
        }

        setUserId(user.id);
        setEmail(user.email ?? "");
        const customer = await fetchCustomerByUserId(user.id);

        if (customer?.onboarding_complete) {
          router.replace("/");
          return;
        }

        if (customer) {
          setCustomerExists(true);
          setCompanyId(customer.company_id);
          setCompanyName(customer.company_name ?? "");
          setContactName(customer.contact_name ?? "");
          setContactPhone(customer.contact_phone ?? "");
          setBusinessType(customer.business_type);
          setLogoUrl(customer.company_logo_url ?? null);
        } else {
          const metadata = user.user_metadata ?? {};
          setCustomerExists(false);
          if (typeof metadata.company_id === "string" && metadata.company_id.trim()) {
            setCompanyId(metadata.company_id);
          }
          setCompanyName(typeof metadata.company_name === "string" ? metadata.company_name : "");
          setContactName(typeof metadata.contact_name === "string" ? metadata.contact_name : "");
          setContactPhone(typeof metadata.contact_phone === "string" ? metadata.contact_phone : "");
          if (isBusinessType(metadata.business_type)) {
            setBusinessType(metadata.business_type);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load onboarding.");
        setLoading(false);
        return;
      }
    }

    void bootstrap();
  }, [router, bootstrapRetryKey]);

  const logoPreviewUrl = useMemo(() => {
    if (logoFile) {
      return URL.createObjectURL(logoFile);
    }
    return logoUrl;
  }, [logoFile, logoUrl]);

  const safeLogoPreviewUrl = useMemo(() => {
    if (!logoPreviewUrl) {
      return null;
    }

    if (logoPreviewUrl.startsWith("blob:")) {
      return logoPreviewUrl;
    }

    try {
      const parsed = new URL(logoPreviewUrl);
      if (parsed.protocol === "https:" || parsed.protocol === "http:") {
        return logoPreviewUrl;
      }
      return null;
    } catch {
      return null;
    }
  }, [logoPreviewUrl]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoPreviewUrl]);

  function onLogoSelected(event: ChangeEvent<HTMLInputElement>) {
    setError(null);
    const file = event.target.files?.[0] ?? null;
    if (!file) {
      setLogoFile(null);
      return;
    }

    const fileError = validateLogoFile(file);
    if (fileError) {
      setLogoFile(null);
      setError(fileError);
      return;
    }

    setLogoFile(file);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Onboarding is unavailable. Add Supabase environment variables.");
      return;
    }

    if (!userId) {
      setError("Session expired. Please sign in again.");
      router.replace("/signin");
      return;
    }

    if (!companyName.trim() || !contactName.trim() || !contactPhone.trim()) {
      setError("Please complete all required fields.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please provide a valid contact email.");
      return;
    }

    if (!validatePhone(contactPhone)) {
      setError("Please provide a valid contact phone.");
      return;
    }

    if (!logoFile && !logoUrl) {
      setError("Company logo is required.");
      return;
    }

    setSaving(true);

    try {
      let uploadedLogoUrl = logoUrl;
      if (logoFile) {
        uploadedLogoUrl = await uploadCompanyLogo(logoFile, userId);
      }

      if (!uploadedLogoUrl) {
        setError("Unable to save your logo. Please retry.");
        return;
      }

      if (!customerExists) {
        const ensured = await ensureCustomerRecordWithSetup(userId, email.trim(), {
          companyId,
          companyName: companyName.trim(),
          contactName: contactName.trim(),
          contactPhone: contactPhone.trim(),
          businessType,
        });
        if (!ensured) {
          throw new Error("Unable to create your customer profile. Please retry.");
        }
        setCustomerExists(true);
      }

      await completeCustomerOnboarding({
        userId,
        companyName: companyName.trim(),
        logoUrl: uploadedLogoUrl,
        contactName: contactName.trim(),
        contactEmail: email.trim(),
        contactPhone: contactPhone.trim(),
        businessType,
      });

      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to complete onboarding. Please retry.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111827] px-4 text-sm text-slate-300">
        Loading onboarding...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111827] px-4 py-10 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl sm:p-8">
        <div className="mb-6 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">Nexus IT</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Complete your Nexus IT setup</h1>
          <p className="mt-2 text-sm text-slate-400">Intelligent Transport by Nexus</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Company logo</h2>
            <p className="text-xs text-slate-400">Upload your logo to finish account setup.</p>
            <div>
              <label htmlFor="logo" className="mb-1.5 block text-xs font-medium text-slate-300">
                Company logo
              </label>
              <input
                id="logo"
                type="file"
                accept="image/png,image/jpg,image/jpeg,image/gif,image/webp"
                onChange={onLogoSelected}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-[#7C3AED] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
              />
              {safeLogoPreviewUrl ? (
                <div className="mt-3 flex items-center gap-3">
                  <Image
                    src={safeLogoPreviewUrl}
                    alt="Company logo preview"
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoUrl(null);
                    }}
                    className="rounded-lg border border-white/20 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Confirm company details</h2>
            <p className="text-xs text-slate-400">These details should match your signup information.</p>
            <div>
              <label htmlFor="companyName" className="mb-1.5 block text-xs font-medium text-slate-300">
                Company name
              </label>
              <input
                id="companyName"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              />
            </div>
            <div>
              <label htmlFor="contactName" className="mb-1.5 block text-xs font-medium text-slate-300">
                Contact name
              </label>
              <input
                id="contactName"
                value={contactName}
                onChange={(event) => setContactName(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="mb-1.5 block text-xs font-medium text-slate-300">
                Contact email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              />
            </div>
            <div>
              <label htmlFor="businessType" className="mb-1.5 block text-xs font-medium text-slate-300">
                Business type
              </label>
              <select
                id="businessType"
                value={businessType}
                onChange={(event) => setBusinessType(event.target.value as BusinessType)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              >
                {BUSINESS_TYPES.map((type) => (
                  <option key={type.value} value={type.value} className="bg-[#111827]">
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="contactPhone" className="mb-1.5 block text-xs font-medium text-slate-300">
                Phone number
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              />
            </div>
          </section>

          {error ? (
            <div
              role="alert"
              className="space-y-2 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200"
            >
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  setBootstrapRetryKey((current) => current + 1);
                }}
                className="rounded-lg border border-red-300/30 px-2.5 py-1 text-[11px] font-semibold text-red-100 hover:bg-red-500/20"
              >
                Retry
              </button>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center rounded-2xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving setup..." : "Save and enter Nexus IT"}
          </button>
        </form>
      </div>
    </div>
  );
}
