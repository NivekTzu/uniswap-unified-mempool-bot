// src/utils/v3Liquidity.ts
import { Contract, JsonRpcProvider } from "ethers";
import { ABIS, ADDRS } from "./constants.js";

export type V3QuoteResult = {
  pool: string;
  amountOut: bigint;
  sqrtPriceX96Before: bigint;
  sqrtPriceX96After: bigint;
  tickBefore: number;
  liquidity: bigint;
  initializedTicksCrossed: number;
  priceImpactBps: number;
};

export async function getV3Pool(
  rpc: JsonRpcProvider,
  tokenIn: string,
  tokenOut: string,
  fee: number
): Promise<string | null> {
  try {
    const factory = new Contract(ADDRS.V3_FACTORY, ABIS.V3_FACTORY, rpc);
    const pool: string = await factory.getPool(tokenIn, tokenOut, fee);
    if (!pool || pool === "0x0000000000000000000000000000000000000000")
      return null;
    return pool.toLowerCase();
  } catch {
    return null;
  }
}

export async function quoteV3ExactIn(
  rpc: JsonRpcProvider,
  tokenIn: string,
  tokenOut: string,
  fee: number,
  amountIn: bigint
): Promise<V3QuoteResult | null> {
  const poolAddr = await getV3Pool(rpc, tokenIn, tokenOut, fee);
  if (!poolAddr) return null;

  const pool = new Contract(poolAddr, ABIS.V3_POOL, rpc);
  const quoter = new Contract(ADDRS.QUOTER_V2, ABIS.QUOTER_V2, rpc);

  const slot0 = await pool.slot0();
  const sqrtBefore: bigint = slot0[0];
  const tickBefore: number = Number(slot0[1]);
  const liquidity: bigint = await pool.liquidity();

  const params = {
    tokenIn,
    tokenOut,
    amountIn,
    fee,
    sqrtPriceLimitX96: 0n,
  };

  let amountOut: bigint;
  let sqrtAfter: bigint;
  let ticksCrossed: number;

  try {
    const res = await quoter.quoteExactInputSingle.staticCall(params);
    amountOut = res[0];
    sqrtAfter = res[1];
    ticksCrossed = Number(res[2]);
  } catch {
    return null;
  }

  const priceImpactBps = computePriceImpactBps(sqrtBefore, sqrtAfter);

  return {
    pool: poolAddr,
    amountOut,
    sqrtPriceX96Before: sqrtBefore,
    sqrtPriceX96After: sqrtAfter,
    tickBefore,
    liquidity,
    initializedTicksCrossed: ticksCrossed,
    priceImpactBps,
  };
}

function computePriceImpactBps(sqrtBefore: bigint, sqrtAfter: bigint): number {
  if (sqrtBefore === 0n) return 0;
  const SCALE = 1_000_000_000_000n;

  const r = (sqrtAfter * SCALE) / sqrtBefore;
  const r2 = (r * r) / SCALE;

  const diff = r2 > SCALE ? r2 - SCALE : SCALE - r2;
  const impact = Number(diff) / Number(SCALE);

  return Math.min(10_000, Math.round(impact * 10_000));
}
