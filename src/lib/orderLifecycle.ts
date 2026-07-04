const WORKING_DAYS_TO_RELEASE = 10;

function isWeekend(day: Date): boolean {
  const weekDay = day.getDay();
  return weekDay === 0 || weekDay === 6;
}

function startOfDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

export function parseDateOnly(value: string): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function addWorkingDays(date: Date, days: number): Date {
  let remaining = Math.max(0, days);
  const cursor = startOfDay(date);

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) {
      remaining -= 1;
    }
  }

  return cursor;
}

export function subtractWorkingDays(date: Date, days: number): Date {
  let remaining = Math.max(0, days);
  const cursor = startOfDay(date);

  while (remaining > 0) {
    cursor.setDate(cursor.getDate() - 1);
    if (!isWeekend(cursor)) {
      remaining -= 1;
    }
  }

  return cursor;
}

export function workingDaysBetween(from: Date, to: Date): number {
  const start = startOfDay(from);
  const end = startOfDay(to);

  if (end <= start) return 0;

  const cursor = new Date(start);
  let count = 0;

  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (!isWeekend(cursor)) {
      count += 1;
    }
  }

  return count;
}

export type FutureDeliveryHoldEvaluation = {
  hasDeliveryDate: boolean;
  workingDaysUntilDelivery: number;
  shouldHoldDelivery: boolean;
  autoReleaseDate: Date | null;
};

export function evaluateFutureDeliveryHold(
  requestedDeliveryDate: string,
  now: Date = new Date()
): FutureDeliveryHoldEvaluation {
  const deliveryDate = parseDateOnly(requestedDeliveryDate);
  if (!deliveryDate) {
    return {
      hasDeliveryDate: false,
      workingDaysUntilDelivery: 0,
      shouldHoldDelivery: false,
      autoReleaseDate: null,
    };
  }

  const today = startOfDay(now);
  const workingDaysUntilDelivery = workingDaysBetween(today, deliveryDate);
  const shouldHoldDelivery = workingDaysUntilDelivery > WORKING_DAYS_TO_RELEASE;

  return {
    hasDeliveryDate: true,
    workingDaysUntilDelivery,
    shouldHoldDelivery,
    autoReleaseDate: shouldHoldDelivery
      ? subtractWorkingDays(deliveryDate, WORKING_DAYS_TO_RELEASE)
      : null,
  };
}

export function canReleaseDelivery(args: {
  requestedDeliveryDate: string;
  collectionConfirmedAt: string | null;
  adminOverride: boolean;
  now?: Date;
}): { ok: boolean; reason?: string; wasAutoReleased?: boolean } {
  const { requestedDeliveryDate, collectionConfirmedAt, adminOverride, now = new Date() } = args;

  if (!collectionConfirmedAt && !adminOverride) {
    return { ok: false, reason: "Collection must be confirmed before delivery release" };
  }

  const holdEvaluation = evaluateFutureDeliveryHold(requestedDeliveryDate, now);
  if (holdEvaluation.shouldHoldDelivery && !adminOverride) {
    return { ok: false, reason: "Delivery is held because requested date is more than 10 working days away" };
  }

  if (!holdEvaluation.shouldHoldDelivery) {
    return { ok: true, wasAutoReleased: holdEvaluation.hasDeliveryDate };
  }

  return { ok: true };
}

export const DELIVERY_RELEASE_WORKING_DAYS = WORKING_DAYS_TO_RELEASE;
