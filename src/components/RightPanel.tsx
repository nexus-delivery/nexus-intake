"use client";

import { useState } from "react";
import Link from "next/link";

const NOTIFICATIONS = [
  { label: "New order received", on: true },
  { label: "Delivery status update", on: true },
  { label: "Message from customer", on: true },
  { label: "Message from merchant", on: false },
];

const SUPPORT_OPTIONS = [
  {
    label: "Contact & Support",
    sub: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#7C3AED]">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.12.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    label: "Submit a request",
    sub: null,
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#7C3AED]">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
  },
  {
    label: "Live chat",
    sub: "Mon–Fri 08:00–18:00",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#7C3AED]">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
  },
  {
    label: "Call us",
    sub: "+44 11 3479 0208",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#7C3AED]">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.82 19.79 19.79 0 01.07 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.12.96.36 1.9.71 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.45-.45a2 2 0 012.11-.45c.91.35 1.85.59 2.81.71A2 2 0 0122 16.92z" />
      </svg>
    ),
  },
  {
    label: "Email us",
    sub: "support@it.nexus.delivery",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4 shrink-0 text-[#7C3AED]">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
  },
];

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:outline-none ${
        on ? "bg-[#7C3AED]" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function RightPanel() {
  const [notifStates, setNotifStates] = useState(NOTIFICATIONS.map((n) => n.on));

  function toggleNotif(i: number) {
    setNotifStates((prev) => prev.map((v, idx) => (idx === i ? !v : v)));
  }

  return (
    <aside className="hidden xl:flex w-[22rem] shrink-0 flex-col gap-4 overflow-y-auto border-l border-slate-200 bg-white/60 px-5 py-6">
      {/* ── Notifications ─────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-base font-semibold text-slate-900">Notifications</span>
          <div className="relative">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-slate-500">
              <path d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2a2 2 0 01-.6 1.4L4 17h5" />
              <path d="M10 17a2 2 0 104 0" />
            </svg>
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#7C3AED] text-[10px] font-bold leading-none text-white">
              3
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {NOTIFICATIONS.map((n, i) => (
            <div key={n.label} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-700">{n.label}</span>
              <Toggle on={notifStates[i]} onToggle={() => toggleNotif(i)} />
            </div>
          ))}
        </div>

        <Link
          href="/settings"
          className="mt-4 flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline"
        >
          Manage notification settings <span aria-hidden>→</span>
        </Link>
      </div>

      {/* ── WhatsApp ──────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]">
            <svg viewBox="0 0 24 24" fill="white" className="h-6 w-6">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.12 1.528 5.848L.057 23.776l6.099-1.447A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.568-.505-5.046-1.383l-.361-.214-3.74.887.902-3.645-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
            </svg>
          </div>
          <span className="text-base font-semibold text-slate-900">WhatsApp</span>
        </div>
        <p className="mb-3 text-sm text-slate-600">
          Chat with our team on WhatsApp for quick support.
        </p>
        <a
          href="https://wa.me/44113479020"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1fbd5a]"
        >
          <svg viewBox="0 0 24 24" fill="white" className="h-4 w-4">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.557 4.12 1.528 5.848L.057 23.776l6.099-1.447A11.944 11.944 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.846 0-3.568-.505-5.046-1.383l-.361-.214-3.74.887.902-3.645-.235-.374A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
          </svg>
          Chat on WhatsApp
        </a>
        <p className="mt-2 text-center text-xs text-slate-500">+44 11 3479 0208</p>
      </div>

      {/* ── Tell it ───────────────────────────────────────────── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-1 flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5 text-[#7C3AED]">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span className="text-base font-semibold text-slate-900">Tell it</span>
        </div>
        <p className="mb-4 text-sm text-slate-600">
          Get in touch with our team. We're here to help.
        </p>

        <div className="space-y-1">
          {SUPPORT_OPTIONS.map((option) => (
            <button
              key={option.label}
              type="button"
              className="flex w-full items-start gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-slate-50"
            >
              <span className="mt-0.5">{option.icon}</span>
              <span>
                <span className="block text-sm font-medium text-slate-800">{option.label}</span>
                {option.sub ? (
                  <span className="block text-xs text-slate-500">{option.sub}</span>
                ) : null}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="mt-3 flex items-center gap-1 text-xs font-semibold text-[#7C3AED] hover:underline"
        >
          View all support options <span aria-hidden>→</span>
        </button>
      </div>
    </aside>
  );
}
