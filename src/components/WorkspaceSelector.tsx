"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type WorkspaceKind = "admin" | "merchant" | "customer";

type WorkspaceOption = {
  key: WorkspaceKind;
  label: string;
  route: string;
};

const WORKSPACE_OPTIONS: WorkspaceOption[] = [
  { key: "admin", label: "Admin", route: "/dashboard" },
  { key: "merchant", label: "Merchant", route: "/portal" },
  { key: "customer", label: "Customer", route: "/customer" },
];

const STORAGE_KEY = "nexus.workspace.selector.v1";

function inferWorkspace(pathname: string): WorkspaceKind {
  if (pathname.startsWith("/customer")) return "customer";
  if (pathname.startsWith("/portal")) return "merchant";
  return "admin";
}

export default function WorkspaceSelector() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const [workspace, setWorkspace] = useState<WorkspaceKind>(() => inferWorkspace(pathname));

  useEffect(() => {
    const inferred = inferWorkspace(pathname);
    setWorkspace(inferred);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, inferred);
    }
  }, [pathname]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY) as WorkspaceKind | null;
    if (!saved) return;
    if (["admin", "merchant", "customer"].includes(saved)) {
      setWorkspace(saved);
    }
  }, []);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm shadow-slate-300/30">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Workspace</p>
      <div className="mt-1 flex gap-1">
        {WORKSPACE_OPTIONS.map((option) => {
          const active = workspace === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                setWorkspace(option.key);
                if (typeof window !== "undefined") {
                  window.localStorage.setItem(STORAGE_KEY, option.key);
                }
                router.push(option.route);
              }}
              className={
                "rounded-lg px-2.5 py-1 text-xs font-semibold transition " +
                (active
                  ? "bg-[#7C3AED] text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300")
              }
              aria-pressed={active}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
