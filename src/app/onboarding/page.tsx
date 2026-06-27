"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BusinessType,
  completeCustomerOnboarding,
  ensureCustomerRecord,
  fetchCustomerByUserId,
  uploadCompanyLogo,
  validateEmail,
  validateLogoFile,
  validatePhone,
} from "@/lib/customerAuth";
import { supabase } from "@/lib/supabaseClient";

const BUSINESS_TYPES: { value: BusinessType; label: string }[] = [
  { value: "merchant", label: "Merchant" },
  { value: "shipper", label: "Shipper" },
  { value: "logistics_partner", label: "Logistics Partner" },
  { value: "other", label: "Other" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("merchant");
  const [businessAddress, setBusinessAddress] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
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

        await ensureCustomerRecord(user.id, user.email ?? null);
        const customer = await fetchCustomerByUserId(user.id);

        if (customer?.onboarding_complete) {
          router.replace("/");
          return;
        }

        setCompanyName(customer?.company_name ?? "");
        setContactName(customer?.contact_name ?? "");
        setContactPhone(customer?.contact_phone ?? "");
        setBusinessType(customer?.business_type ?? "merchant");
        setBusinessAddress(customer?.business_address ?? "");
        setLogoUrl(customer?.company_logo_url ?? null);
        setTermsAccepted(customer?.terms_accepted ?? false);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load onboarding.");
        setLoading(false);
        return;
      }
    }

    void bootstrap();
  }, [router]);

  const logoPreviewUrl = useMemo(() => {
    if (logoFile) {
      return URL.createObjectURL(logoFile);
    }
    return logoUrl;
  }, [logoFile, logoUrl]);

  useEffect(() => {
    return () => {
      if (logoPreviewUrl && logoFile) {
        URL.revokeObjectURL(logoPreviewUrl);
      }
    };
  }, [logoFile, logoPreviewUrl]);

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

    if (!companyName.trim() || !contactName.trim() || !contactPhone.trim() || !businessAddress.trim()) {
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

    if (!termsAccepted) {
      setError("You must accept the terms to continue.");
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

      await completeCustomerOnboarding({
        userId,
        companyName: companyName.trim(),
        logoUrl: uploadedLogoUrl,
        contactName: contactName.trim(),
        contactEmail: email.trim(),
        contactPhone: contactPhone.trim(),
        businessType,
        businessAddress: businessAddress.trim(),
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">Onboarding</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">Complete Your Profile</h1>
          <p className="mt-2 text-sm text-slate-400">Finish your company details to enter The Hub.</p>
        </div>

        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Company Details</h2>
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
              {logoPreviewUrl ? (
                <div className="mt-3 flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logoPreviewUrl} alt="Company logo preview" className="h-12 w-12 rounded-md object-cover" />
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
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Contact Information</h2>
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
              <label htmlFor="contactPhone" className="mb-1.5 block text-xs font-medium text-slate-300">
                Contact phone
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

          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Location</h2>
            <div>
              <label htmlFor="businessAddress" className="mb-1.5 block text-xs font-medium text-slate-300">
                Business address
              </label>
              <textarea
                id="businessAddress"
                value={businessAddress}
                onChange={(event) => setBusinessAddress(event.target.value)}
                rows={3}
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
                required
              />
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-white/10 p-4">
            <h2 className="text-sm font-semibold text-white">Legal</h2>
            <label className="flex items-start gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(event) => setTermsAccepted(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5"
              />
              <span>
                I accept the <a href="/support" className="text-[#A78BFA] hover:underline">terms and conditions</a>.
              </span>
            </label>
          </section>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center rounded-2xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving profile..." : "Save and Enter The Hub"}
          </button>
        </form>
      </div>
    </div>
  );
}
