"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  ensureCustomerRecord,
  mapAuthError,
  resolvePostSignInPath,
  validateEmail,
  validatePassword,
} from "@/lib/customerAuth";
import { syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

export default function SignUpPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        if (!supabase) return;
        const { data } = await supabase.auth.getUser();
        if (data.user) {
          const { data: sessionData } = await supabase.auth.getSession();
          await syncManageItSession(sessionData.session?.access_token ?? null);
          const destination = await resolvePostSignInPath(data.user.id, data.user.email ?? null);
          router.replace(destination);
        }
      } catch (err) {
        console.error("Signup bootstrap check failed", err);
      }
    }

    void bootstrap();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!supabase) {
      setError("Authentication is unavailable. Add Supabase environment variables.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email.");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        console.error("Supabase signup raw error:", signUpError);
        const fullMessage = [
          signUpError.message,
          signUpError.status ? `Status: ${signUpError.status}` : "",
          signUpError.code ? `Code: ${signUpError.code}` : "",
          signUpError.name ? `Name: ${signUpError.name}` : "",
        ]
          .filter(Boolean)
          .join(" | ");
        setError(fullMessage);
        return;
      }

      if (!data.user) {
        setError("Signup succeeded, but your session is not ready yet. Please continue from sign in.");
        return;
      }

      // Sync session with server (this can now throw meaningful errors)
      try {
        await syncManageItSession(data.session?.access_token ?? null);
      } catch (syncErr) {
        const syncMessage = syncErr instanceof Error ? syncErr.message : "Session synchronization failed";
        console.error("Session sync error during signup:", syncMessage);
        setError(`Session setup failed: ${syncMessage}`);
        return;
      }

      // Ensure customer record exists
      try {
        await ensureCustomerRecord(data.user.id, data.user.email ?? email.trim());
      } catch (ensureErr) {
        const ensureMessage = ensureErr instanceof Error ? ensureErr.message : "Failed to create customer record";
        console.error("Ensure customer record error:", ensureMessage);
        setError(`Profile setup failed: ${ensureMessage}`);
        return;
      }

      router.replace("/onboarding");
    } catch (err) {
      console.error("Unexpected signup error:", err);
      if (err instanceof Error) {
        setError(`${err.name}: ${err.message}`);
      } else {
        setError(JSON.stringify(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#111827] flex flex-col items-center justify-center px-4 py-16">
      <div className="mb-8 flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#7C3AED] text-lg font-bold text-white shadow-lg shadow-[#7C3AED]/40">
          N
        </div>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">NEXUS Platform</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Join IT</h1>
          <p className="mt-1 text-sm text-slate-400">Create your account and start onboarding.</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
        <form className="space-y-4" onSubmit={handleSubmit} noValidate>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-medium text-slate-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="jane@yourcompany.com"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-slate-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 chars, upper/lowercase and number"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-medium text-slate-300">
              Confirm password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter your password"
              className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
              required
            />
          </div>

          {error ? (
            <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#7C3AED] px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-[#7C3AED]/30 transition hover:bg-[#6D28D9] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#A78BFA] hover:underline">
            Enter IT
          </Link>
        </p>
      </div>
    </div>
  );
}
