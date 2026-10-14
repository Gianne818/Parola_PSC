import { describe, expect, it } from 'vitest';
import { canEnterPhilippineMobile, isValidPhilippineMobile } from './philippine-mobile';

describe('Philippine mobile input', () => {
  it.each(['09123456789', '9123456789', '639123456789', '+639123456789', '0912 345 6789', '+63 912 345 6789', '+63 (912) 345-6789'])('accepts %s without mandatory formatting', value => {
    expect(isValidPhilippineMobile(value)).toBe(true);
    expect(canEnterPhilippineMobile(value)).toBe(true);
  });

  it.each(['', '0912345678', '091234567890', '63912345678', '6391234567890', '+14155552671', '631234567890', '+6309123456789', '+639123456789abc', '++639123456789', '09+123456789'])('rejects incomplete, foreign, or malformed number %s', value => {
    expect(isValidPhilippineMobile(value)).toBe(false);
  });

  it.each(['', '0', '09', '+', '+6', '+63', '+63 9'])('allows partial input %s', value => {
    expect(canEnterPhilippineMobile(value)).toBe(true);
  });

  it.each(['091234567890', '91234567890', '6391234567890', '+63 912 345 67890'])('blocks additional digits in %s', value => {
    expect(canEnterPhilippineMobile(value)).toBe(false);
  });
});
