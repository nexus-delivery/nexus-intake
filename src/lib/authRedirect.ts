const REDIRECT_DEBOUNCE_MS = 1200;

let lastRedirectKey: string | null = null;
let lastRedirectAt = 0;

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function redirectWithLog(
  router: { replace: (href: string) => void },
  params: {
    route: string;
    target: string;
    reason: string;
    sessionUserId?: string | null;
    extra?: Record<string, unknown>;
  }
): boolean {
  const key = `${params.route}|${params.target}|${params.reason}`;
  const now = Date.now();
  const isDebounced = key === lastRedirectKey && now - lastRedirectAt < REDIRECT_DEBOUNCE_MS;

  if (isDebounced) {
    console.info("[auth] redirect debounced", params);
    return false;
  }

  lastRedirectKey = key;
  lastRedirectAt = now;
  console.info("[auth] redirect", params);
  router.replace(params.target);
  return true;
}
