// utils/tokens.ts
import { Contract, JsonRpcProvider } from "ethers";
import { ABIS } from "./constants.js";

// Cache token metadata to avoid RPC spam
const tokenCache: Record<
  string,
  { name: string; symbol: string; decimals: number }
> = {};

export async function getTokenInfo(provider: JsonRpcProvider, token: string) {
  const addr = token.toLowerCase();

  if (tokenCache[addr]) return tokenCache[addr];

  const erc20 = new Contract(addr, ABIS.ERC20, provider);

  try {
    const [name, symbol, decimals] = await Promise.all([
      erc20.name().catch(() => "Unknown"),
      erc20.symbol().catch(() => "???"),
      erc20.decimals().catch(() => 18),
    ]);

    const info = {
      name,
      symbol,
      decimals: Number(decimals),
    };

    tokenCache[addr] = info;
    return info;
  } catch {
    const fallback = { name: "Unknown", symbol: "???", decimals: 18 };
    tokenCache[addr] = fallback;
    return fallback;
  }
}

export function formatUnits(amount: bigint, decimals: number): number {
  if (decimals === 0) return Number(amount);

  const divisor = 10 ** decimals;
  return Number(amount) / divisor;
}
