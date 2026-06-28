"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { mapAuthError, validateEmail } from "@/lib/customerAuth";
import { resolvePostSignInPath } from "@/lib/authOnboarding";
import { syncManageItSession } from "@/lib/manageIt";
import { supabase } from "@/lib/supabaseClient";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
          const destination = await resolvePostSignInPath(data.user.id);
          router.replace(destination);
        }
      } catch (err) {
        console.error("Signin bootstrap check failed", err);
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

    if (!validateEmail(email) || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message));
        return;
      }

      const user = data.user;
      if (!user) {
        setError("Unable to verify your account right now. Please try again.");
        return;
      }

      // Sync session with server (this can now throw meaningful errors)
      try {
        await syncManageItSession(data.session?.access_token ?? null);
      } catch (syncErr) {
        const syncMessage = syncErr instanceof Error ? syncErr.message : "Session synchronization failed";
        console.error("Session sync error during signin:", syncMessage);
        setError(`Session setup failed: ${syncMessage}`);
        return;
      }

      // Resolve post-signin path
      try {
        const destination = await resolvePostSignInPath(user.id);
        router.replace(destination);
      } catch (resolveErr) {
        const resolveMessage = resolveErr instanceof Error ? resolveErr.message : "Failed to load your profile";
        console.error("Resolve signin path error", {
          userId: user.id,
          email: user.email ?? email.trim(),
          error: resolveErr,
        });
        setError(`Unable to access your profile: ${resolveMessage}`);
        return;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to sign in right now.";
      console.error("Signin error:", message);
      setError(message);
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
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#7C3AED]">Nexus IT</p>
          <h1 className="mt-1 text-2xl font-semibold text-white">Sign in to Nexus IT</h1>
          <p className="mt-1 text-sm text-slate-400">Access your Nexus IT workspace</p>
        </div>
      </div>

      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-white/5 backdrop-blur p-8 shadow-2xl">
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
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-medium text-slate-300">
                Password
              </label>
              <a href="/support" className="text-xs text-[#A78BFA] hover:underline">
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-[#A78BFA] hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
