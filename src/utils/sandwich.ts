// src/utils/sandwich.ts
import { JsonRpcProvider } from "ethers";
import { computeV2PairAddress, getV2Reserves } from "./v2Pairs.js";
import { quoteV3ExactIn } from "./v3Liquidity.js";

type Meta = { symbol: string; decimals: number };

export type RiskResult = {
  score: number; // 0..100
  level: "MINIMAL" | "LOW" | "MODERATE" | "HIGH";
  expectedOut?: bigint;
  priceImpactBps?: number;
  ticksCrossed?: number;
  poolSharePct?: number;
  userSlippagePct?: number;
};

export async function assessSandwichRisk(
  rpc: JsonRpcProvider,
  decoded: any,
  inMeta: Meta,
  outMeta: Meta
): Promise<RiskResult> {
  if (decoded.kind === "v2") {
    return assessV2(rpc, decoded);
  }
  // v3 or ur: if fees array empty, it's a v2-in-ur
  if (decoded.kind === "ur" && decoded.fees.length === 0) {
    return assessV2FromUR(rpc, decoded);
  }
  return assessV3OrURv3(rpc, decoded);
}

// ---------------------
// V2 Risk
// ---------------------
async function assessV2(rpc: JsonRpcProvider, s: any): Promise<RiskResult> {
  const path = s.path;
  if (!path || path.length < 2) return minimal();

  const tokenIn = path[0];
  const tokenOut = path[path.length - 1];
  const amountIn: bigint | undefined = s.amountIn ?? s.amountInMax;
  const userMinOut: bigint | undefined = s.amountOutMin ?? s.amountOut;
  if (!amountIn) return minimal();

  const pairAddr = computeV2PairAddress(tokenIn, tokenOut);
  const reserves = await getV2Reserves(rpc, pairAddr);
  if (!reserves) return minimal();

  const { r0, r1, token0, token1 } = reserves;

  const [reserveIn, reserveOut] =
    tokenIn.toLowerCase() === token0 ? [r0, r1] : [r1, r0];

  const expectedOut = getAmountsOutV2(amountIn, reserveIn, reserveOut);

  const userSlippagePct =
    userMinOut && expectedOut > 0n
      ? Number(((expectedOut - userMinOut) * 10_000n) / expectedOut) / 100
      : undefined;

  const poolSharePct =
    reserveIn > 0n ? Number((amountIn * 10_000n) / reserveIn) / 100 : undefined;

  const score = scoreHeuristic(poolSharePct, userSlippagePct, 0, 0);
  return decorate(score, { expectedOut, poolSharePct, userSlippagePct });
}

// UR(V2) same math
async function assessV2FromUR(
  rpc: JsonRpcProvider,
  s: any
): Promise<RiskResult> {
  const path = s.tokens;
  if (!path || path.length < 2) return minimal();

  const tokenIn = path[0];
  const tokenOut = path[path.length - 1];
  const amountIn: bigint | undefined = s.amountIn ?? s.amountInMax;
  const userMinOut: bigint | undefined = s.amountOutMin ?? s.amountOut;
  if (!amountIn) return minimal();

  const pairAddr = computeV2PairAddress(tokenIn, tokenOut);
  const reserves = await getV2Reserves(rpc, pairAddr);
  if (!reserves) return minimal();

  const { r0, r1, token0, token1 } = reserves;

  const [reserveIn, reserveOut] =
    tokenIn.toLowerCase() === token0 ? [r0, r1] : [r1, r0];

  const expectedOut = getAmountsOutV2(amountIn, reserveIn, reserveOut);

  const userSlippagePct =
    userMinOut && expectedOut > 0n
      ? Number(((expectedOut - userMinOut) * 10_000n) / expectedOut) / 100
      : undefined;

  const poolSharePct =
    reserveIn > 0n ? Number((amountIn * 10_000n) / reserveIn) / 100 : undefined;

  const score = scoreHeuristic(poolSharePct, userSlippagePct, 0, 0);
  return decorate(score, { expectedOut, poolSharePct, userSlippagePct });
}

// Constant product exact-in with 0.30% fee
function getAmountsOutV2(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint
): bigint {
  if (amountIn === 0n || reserveIn === 0n || reserveOut === 0n) return 0n;
  const amountInWithFee = amountIn * 997n;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 1000n + amountInWithFee;
  return numerator / denominator;
}

// ---------------------
// V3 / UR(V3) Risk
// ---------------------
async function assessV3OrURv3(
  rpc: JsonRpcProvider,
  s: any
): Promise<RiskResult> {
  const tokens = s.tokens;
  const fees = s.fees;
  if (!tokens || tokens.length < 2 || !fees || fees.length < 1)
    return minimal();

  const tokenIn = tokens[0];
  const tokenOut = tokens[tokens.length - 1];
  const fee = fees[0]; // only score first hop for now

  const amountIn: bigint | undefined = s.amountIn ?? s.amountInMax;
  const userMinOut: bigint | undefined = s.amountOutMin ?? s.amountOut;
  if (!amountIn) return minimal();

  const q = await quoteV3ExactIn(rpc, tokenIn, tokenOut, fee, amountIn);
  if (!q) return minimal();

  const expectedOut = q.amountOut;

  const userSlippagePct =
    userMinOut && expectedOut > 0n
      ? Number(((expectedOut - userMinOut) * 10_000n) / expectedOut) / 100
      : undefined;

  const score = scoreHeuristic(
    undefined,
    userSlippagePct,
    q.priceImpactBps,
    q.initializedTicksCrossed
  );

  return decorate(score, {
    expectedOut,
    priceImpactBps: q.priceImpactBps,
    ticksCrossed: q.initializedTicksCrossed,
    userSlippagePct,
  });
}

// ---------------------
// Shared scoring heuristic
// ---------------------
function scoreHeuristic(
  poolSharePct?: number,
  slippagePct?: number,
  priceImpactBps?: number,
  ticksCrossed?: number
): number {
  let score = 0;

  // trade vs pool size
  if (poolSharePct !== undefined) {
    if (poolSharePct > 5) score += 40;
    else if (poolSharePct > 2) score += 25;
    else if (poolSharePct > 1) score += 15;
  }

  // user slippage tolerance
  if (slippagePct !== undefined) {
    if (slippagePct > 5) score += 35;
    else if (slippagePct > 2) score += 20;
    else if (slippagePct > 1) score += 10;
  }

  // V3 price impact
  if (priceImpactBps !== undefined) {
    if (priceImpactBps > 200) score += 35;
    else if (priceImpactBps > 100) score += 20;
    else if (priceImpactBps > 50) score += 10;
  }

  // ticks crossed in sim
  if (ticksCrossed !== undefined) {
    if (ticksCrossed > 3) score += 20;
    else if (ticksCrossed > 1) score += 10;
  }

  return Math.min(100, score);
}

function decorate(score: number, extra: Partial<RiskResult>): RiskResult {
  const level =
    score < 15
      ? "MINIMAL"
      : score < 35
      ? "LOW"
      : score < 65
      ? "MODERATE"
      : "HIGH";

  return { score, level, ...extra };
}

function minimal(): RiskResult {
  return { score: 0, level: "MINIMAL" };
}
