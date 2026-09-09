export function normalizeIntegerInput(value: string, minimum: number, maximum: number): string {
  const digits = value.replace(/\D/g, '');
  const parsed = Number(digits);

  if (!Number.isSafeInteger(parsed)) {
    return String(maximum);
  }
  return String(Math.min(maximum, Math.max(minimum, parsed)));
}
