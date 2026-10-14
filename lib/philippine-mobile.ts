/** Accept local and international mobile formats without requiring separators. */
export function isValidPhilippineMobile(value: string): boolean {
  const compact = value.replace(/[\s()-]/g, '');
  return value.length <= 32 && /^(?:09\d{9}|9\d{9}|\+?639\d{9})$/.test(compact);
}

/** Allow incomplete input while limiting digits rather than formatting characters. */
export function canEnterPhilippineMobile(value: string): boolean {
  if (value.length > 32 || !/^\+?[\d\s()-]*$/.test(value.trim())) return false;
  const digits = value.replace(/\D/g, '');
  const limit = digits.startsWith('0') ? 11 : digits.startsWith('9') ? 10 : 12;
  return digits.length <= limit;
}
