"use client";

import { useEffect, useState } from "react";

export function useRuntimeCompanyId(): string {
  const [companyId, setCompanyId] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setCompanyId(params.get("companyId") ?? "");
  }, []);

  return companyId;
}