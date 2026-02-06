import { describe, it, expect } from 'vitest';

describe('Token ID Precision', () => {
  it('should demonstrate that BigInt -> Number causes precision loss', () => {
    // 2^53 + 1 is the first integer that cannot be safely represented as a double
    const safeLimit = BigInt(Number.MAX_SAFE_INTEGER);
    const unsafeId = safeLimit + 2n; // 9007199254740993n

    const corrupted = Number(unsafeId);

    // Confirms that Number() corrupts the value
    expect(BigInt(corrupted)).not.toBe(unsafeId);
    expect(corrupted).toBe(9007199254740992);
  });

  it('should demonstrate that BigInt -> String preserves precision', () => {
    const safeLimit = BigInt(Number.MAX_SAFE_INTEGER);
    const unsafeId = safeLimit + 2n; // 9007199254740993n

    const preserved = unsafeId.toString();

    // Confirms that toString() preserves the value
    expect(preserved).toBe('9007199254740993');
  });
});
