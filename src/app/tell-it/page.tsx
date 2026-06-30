"use client";

import { FormEvent, useState } from "react";
import AppShell from "@/components/AppShell";

const ENQUIRY_TYPES = [
  "General enquiry",
  "Feature request",
  "Bug report",
  "Billing question",
  "Integration support",
  "Other",
];

const CHANNELS = [
  {
    label: "Live chat",
    sub: "Mon–Fri 08:00–18:00",
    badge: "Online now",
    badgeColor: "bg-emerald-100 text-emerald-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Call us",
    sub: "+44 11 3479 0208",
    badge: "Mon–Fri 09:00–17:00",
    badgeColor: "bg-sky-100 text-sky-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.12.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    label: "Email us",
    sub: "support@it.nexus.delivery",
    badge: "Reply within 4 hours",
    badgeColor: "bg-violet-100 text-violet-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
  {
    label: "Help centre",
    sub: "Guides, FAQs and tutorials",
    badge: "Self-service",
    badgeColor: "bg-amber-100 text-amber-700",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
];

export default function TellItPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [enquiryType, setEnquiryType] = useState(ENQUIRY_TYPES[0]);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Simulate async submission
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 900);
  }

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]";

  return (
    <AppShell>
      <div className="space-y-8">
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <div className="nexus-card rounded-[32px] p-8">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-3xl bg-[#7C3AED] text-white shadow-lg shadow-[#7C3AED]/30">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-8 w-8">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div>
              <p className="nexus-kicker">Tell it</p>
              <h1 className="mt-1 text-3xl font-semibold text-slate-900">Get in touch. We're here to help.</h1>
              <p className="mt-1.5 text-sm text-slate-600">
                Tell us what you need — whether it's support, a request or just feedback. We'll respond fast.
              </p>
            </div>
          </div>
        </div>

        {/* ── Support channels ──────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {CHANNELS.map((ch) => (
            <div
              key={ch.label}
              className="nexus-card group flex flex-col rounded-[24px] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#7C3AED]/50"
            >
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
                  {ch.icon}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${ch.badgeColor}`}>
                  {ch.badge}
                </span>
              </div>
              <p className="text-base font-semibold text-slate-900">{ch.label}</p>
              <p className="mt-1 text-sm text-slate-600">{ch.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Main two-column ───────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* WhatsApp card */}
          <div className="flex flex-col gap-4">
            <div className="nexus-card rounded-[24px] p-6">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#25D366]">
                  <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.12 1.528 5.848L.057 23.776l6.099-1.447A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.568-.505-5.046-1.383l-.361-.214-3.74.887.902-3.645-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                  </svg>
                </div>
                <div>
                  <p className="text-base font-semibold text-slate-900">WhatsApp</p>
                  <p className="text-xs text-slate-500">Fastest response</p>
                </div>
              </div>
              <p className="mb-4 text-sm text-slate-600">
                Chat with our team directly on WhatsApp for quick answers and real-time support.
              </p>
              <a
                href="https://wa.me/44113479020"
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1fbd5a]"
              >
                <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.12 1.528 5.848L.057 23.776l6.099-1.447A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.568-.505-5.046-1.383l-.361-.214-3.74.887.902-3.645-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                Chat on WhatsApp
              </a>
              <p className="mt-2 text-center text-xs text-slate-400">+44 11 3479 0208</p>
            </div>

            {/* Quick links */}
            <div className="nexus-card rounded-[24px] p-5">
              <p className="mb-3 text-sm font-semibold text-slate-900">Quick links</p>
              <div className="space-y-1">
                {[
                  "View system status",
                  "Platform documentation",
                  "Video walkthroughs",
                  "Release notes",
                ].map((link) => (
                  <button
                    key={link}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-[#7C3AED]"
                  >
                    <span>{link}</span>
                    <span className="text-slate-400">→</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="nexus-card rounded-[24px] p-7">
            {submitted ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 py-12 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-8 w-8">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
                <div>
                  <p className="text-xl font-semibold text-slate-900">Request received</p>
                  <p className="mt-2 text-sm text-slate-600">
                    We'll be in touch within 4 hours. For urgent issues, chat with us on WhatsApp.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSubmitted(false); setName(""); setEmail(""); setMessage(""); setEnquiryType(ENQUIRY_TYPES[0]); }}
                  className="rounded-xl border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-xl font-semibold text-slate-900">Send a message</p>
                  <p className="mt-1 text-sm text-slate-500">
                    We read every message and respond the same working day.
                  </p>
                </div>
                <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="tell-name" className="mb-1.5 block text-xs font-medium text-slate-600">
                        Your name
                      </label>
                      <input
                        id="tell-name"
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Jane Smith"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label htmlFor="tell-email" className="mb-1.5 block text-xs font-medium text-slate-600">
                        Email address
                      </label>
                      <input
                        id="tell-email"
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jane@yourcompany.com"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="tell-type" className="mb-1.5 block text-xs font-medium text-slate-600">
                      Enquiry type
                    </label>
                    <select
                      id="tell-type"
                      value={enquiryType}
                      onChange={(e) => setEnquiryType(e.target.value)}
                      className={inputCls}
                    >
                      {ENQUIRY_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="tell-message" className="mb-1.5 block text-xs font-medium text-slate-600">
                      Message
                    </label>
                    <textarea
                      id="tell-message"
                      required
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us what you need help with…"
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <button
                      type="submit"
                      disabled={loading || !name || !email || !message}
                      className="flex items-center gap-2 rounded-xl bg-[#7C3AED] px-7 py-3 text-sm font-semibold text-white shadow-sm shadow-[#7C3AED]/30 transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        "Send message"
                      )}
                    </button>
                    <p className="text-xs text-slate-400">
                      We respond within 4 hours on working days.
                    </p>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
