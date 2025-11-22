// src/listener.ts
import {
  WebSocketProvider,
  JsonRpcProvider,
  TransactionResponse,
} from "ethers";
import chalk from "chalk";

import { tryDecodeV2, V2Swap } from "./decoders/v2.js";
import { tryDecodeV3, V3Swap } from "./decoders/v3.js";
import { tryDecodeUniversal, URSwap } from "./decoders/universal.js";

import { getTokenInfo, formatUnits } from "./utils/tokens.js";
import { assessSandwichRisk } from "./utils/sandwich.js";
import { ADDRS } from "./utils/constants.js";
import "dotenv/config";

// -------------------------
// Providers
// -------------------------
export const RPC_WS = process.env.RPC_WS!;
export const RPC_HTTP = process.env.RPC_HTTP!;

const ws = new WebSocketProvider(RPC_WS);
const rpc = new JsonRpcProvider(RPC_HTTP);

// router sets
const ROUTERS = {
  v2: ADDRS.V2_ROUTER,
  v3: ADDRS.V3_ROUTER,
  ur: new Set(ADDRS.UNIVERSAL_ROUTERS),
};

console.log(chalk.green(`📡 Listening for V2 / V3 / Universal swaps...\n`));

// =====================================================================
// MAIN MEMPOOL LISTENER
// =====================================================================
ws.on("pending", async (txHash) => {
  try {
    const tx: TransactionResponse | null = await ws.getTransaction(txHash);
    if (!tx || !tx.to) return;

    const to = tx.to.toLowerCase();

    let decoded: V2Swap | V3Swap | URSwap | null = null;

    if (to === ROUTERS.v2) decoded = tryDecodeV2(tx);
    else if (to === ROUTERS.v3) decoded = tryDecodeV3(tx);
    else if (ROUTERS.ur.has(to)) decoded = tryDecodeUniversal(tx);
    else return;

    if (!decoded) return;

    // ===========================================================
    // PRINT HEADER
    // ===========================================================
    console.log(
      chalk.yellow(`\n🔥 Uniswap ${decoded.kind.toUpperCase()} Swap Detected`)
    );
    console.log("From:", tx.from);
    console.log("Method:", decoded.method);
    console.log("Gas Price:", `${Number(tx.gasPrice) / 1e9} gwei`);

    // ===========================================================
    // RESOLVE TOKENS / PATH
    // ===========================================================
    const path = decoded.kind === "v2" ? decoded.path : decoded.tokens;

    const tokenIn = path[0];
    const tokenOut = path[path.length - 1];

    const inMeta = await getTokenInfo(rpc, tokenIn);
    const outMeta = await getTokenInfo(rpc, tokenOut);

    // ===========================================================
    // HUMAN READABLE AMOUNTS
    // ===========================================================
    const amountIn = decoded.amountIn ?? decoded.amountInMax;

    const amountOutMin = decoded.amountOutMin ?? decoded.amountOut;

    if (amountIn !== undefined) {
      console.log(
        chalk.cyan("Input:"),
        `${formatUnits(amountIn, inMeta.decimals)} ${inMeta.symbol}`
      );
    }

    if (amountOutMin !== undefined) {
      console.log(
        chalk.cyan("Min/Exact Out:"),
        `${formatUnits(amountOutMin, outMeta.decimals)} ${outMeta.symbol}`
      );
    }

    // ===========================================================
    // PRINT PATH
    // ===========================================================
    console.log(chalk.cyan("Path:"));
    for (const addr of path) {
      const meta = await getTokenInfo(rpc, addr);
      console.log(` - ${meta.symbol} (${addr})`);
    }

    // ===========================================================
    // SANDWICH RISK
    // ===========================================================
    const risk = await assessSandwichRisk(rpc, decoded, inMeta, outMeta);

    // nicer reporting
    if (risk.expectedOut) {
      console.log(
        "Expected Out:",
        `${formatUnits(risk.expectedOut, outMeta.decimals)} ${outMeta.symbol}`
      );
    }
    if (risk.userSlippagePct !== undefined) {
      console.log(
        "User Slippage Tolerance:",
        `${risk.userSlippagePct.toFixed(2)}%`
      );
    }
    if (risk.poolSharePct !== undefined) {
      console.log("Trade vs Pool Size:", `${risk.poolSharePct.toFixed(2)}%`);
    }
    if (risk.priceImpactBps !== undefined) {
      console.log("Price Impact:", `${risk.priceImpactBps} bps`);
    }
    if (risk.ticksCrossed !== undefined) {
      console.log("Initialized Ticks Crossed:", `${risk.ticksCrossed}`);
    }

    const color =
      risk.score < 30 ? "green" : risk.score < 60 ? "yellow" : "red";

    console.log(
      chalk[color](`⚠️  Sandwich Risk: ${risk.level} (${risk.score}/100)`)
    );
  } catch {
    // ignore bad txs
  }
});
