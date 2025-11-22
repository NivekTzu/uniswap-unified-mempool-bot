import { formatUnits } from "ethers";

export function fmt(amount: bigint, decimals: number, sig = 6): string {
  const s = formatUnits(amount, decimals);
  const n = Number(s);
  if (!Number.isFinite(n)) return s;
  return n.toPrecision(sig);
}

export function gwei(price: bigint): string {
  return (Number(price) / 1e9).toFixed(3);
}
