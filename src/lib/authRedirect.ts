// 1.2s absorbs duplicate redirects fired by overlapping auth checks across components
// while keeping navigation responsive for real user-driven route changes.
export const DEFAULT_AUTH_REDIRECT_DEBOUNCE_MS = 1200;
const redirectTimestamps = new Map<string, number>();

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}

export function resolveAuthUser<TUser extends { id: string }>(
  user: TUser | null | undefined,
  session: { user?: TUser | null } | null | undefined
): TUser | null {
  return user ?? session?.user ?? null;
}

export function buildAuthLookupError(userError?: string, sessionError?: string): Error {
  return new Error(
    `Auth lookup failed. userError=${userError ?? "none"} sessionError=${sessionError ?? "none"}`
  );
}

export type AuthenticatedAccessIssue = {
  sessionUserId: string | null;
  error: unknown;
};

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
  const expiryCutoff = now - DEFAULT_AUTH_REDIRECT_DEBOUNCE_MS;
  for (const [storedKey, storedAt] of redirectTimestamps.entries()) {
    if (storedAt < expiryCutoff) {
      redirectTimestamps.delete(storedKey);
    }
  }
  const previousRedirectAt = redirectTimestamps.get(key);
  const isDebounced =
    typeof previousRedirectAt === "number" && now - previousRedirectAt < DEFAULT_AUTH_REDIRECT_DEBOUNCE_MS;

  if (isDebounced) {
    console.info("[auth] redirect debounced", params);
    return false;
  }

  redirectTimestamps.set(key, now);
  while (redirectTimestamps.size > 100) {
    const oldest = redirectTimestamps.entries().next().value;
    if (!oldest) break;
    redirectTimestamps.delete(oldest[0]);
  }
  console.info("[auth] redirect", params);
  router.replace(params.target);
  return true;
}
