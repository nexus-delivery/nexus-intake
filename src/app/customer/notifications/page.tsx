"use client";

import { useEffect, useState } from "react";
import CustomerPortalShell from "@/components/CustomerPortalShell";
import { supabase } from "@/lib/supabaseClient";

type NotificationItem = {
  orderId: string;
  eventType: string;
  message: string;
  createdAt: string;
};

function toLocale(value: string): string {
  const ts = Date.parse(value);
  return Number.isFinite(ts) ? new Date(ts).toLocaleString() : "-";
}

export default function CustomerNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        if (!supabase) throw new Error("Supabase is unavailable");
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error("Please sign in");

        const response = await fetch("/api/customer/notifications", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        const payload = (await response.json()) as { notifications?: NotificationItem[]; error?: string };
        if (!response.ok) {
          throw new Error(payload.error ?? `Failed to load notifications (${response.status})`);
        }
        setItems(payload.notifications ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load notifications");
      }
    }

    void load();
  }, []);

  return (
    <CustomerPortalShell>
      <section className="space-y-4 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/30">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Notifications</p>
        <h2 className="text-2xl font-semibold text-slate-950">Recent Updates</h2>

        {error ? <p className="text-sm text-red-700">{error}</p> : null}

        {items.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications available.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <article key={`${item.orderId}-${item.createdAt}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">{item.eventType}</p>
                  <p className="text-xs text-slate-500">{toLocale(item.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-slate-700">{item.message}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </CustomerPortalShell>
  );
}
