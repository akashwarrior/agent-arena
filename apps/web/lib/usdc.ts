export const USDC_DECIMALS = 6;
export const USDC_BASE_UNITS = BigInt(10) ** BigInt(USDC_DECIMALS);

export function parseUsdcToBaseUnits(value: string | number): bigint {
  const amount = String(value).trim();

  if (!/^\d+(\.\d+)?$/.test(amount)) {
    throw new Error("Invalid USDC amount");
  }

  const [whole, fraction = ""] = amount.split(".");
  if (fraction.length > USDC_DECIMALS) {
    throw new Error(`USDC amount supports up to ${USDC_DECIMALS} decimals`);
  }

  return BigInt(whole + fraction.padEnd(USDC_DECIMALS, "0"));
}

export function formatUsdcBaseUnits(amount: bigint): string {
  const whole = amount / USDC_BASE_UNITS;
  const fraction = amount % USDC_BASE_UNITS;
  const fractionText = fraction
    .toString()
    .padStart(USDC_DECIMALS, "0")
    .replace(/0+$/, "");

  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

export function usdcBaseUnitsToNumber(amount: bigint): number {
  return Number(amount) / Number(USDC_BASE_UNITS);
}
