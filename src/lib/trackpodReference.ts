function normalizeReferencePart(value: string | null | undefined): string {
  return (value ?? "").trim().replace(/\s+/g, "-").replace(/^-+|-+$/g, "");
}

function toBoolString(value: string | null | undefined): boolean {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function buildTrackPodOrderReference(fields: {
  orderReference?: string | null;
  externalOrderId?: string | null;
  twoMan?: string | null;
}): string {
  const parts = [
    normalizeReferencePart(fields.orderReference),
    normalizeReferencePart(fields.externalOrderId),
    toBoolString(fields.twoMan) ? "2MAN" : "",
  ].filter((part) => part.length > 0);

  return parts.join("-").replace(/-+/g, "-").toUpperCase();
}
