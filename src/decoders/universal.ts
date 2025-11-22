import { Interface, TransactionResponse } from "ethers";
import { ABIS } from "../utils/constants.js";
import { tryDecodeV2, V2Swap } from "./v2.js";
import { tryDecodeV3, V3Swap } from "./v3.js";

const urIface = new Interface(ABIS.UNIVERSAL_ROUTER);

// Unified UR swap type
export type URSwap = {
  kind: "ur";
  method: string;
  tokens: string[];
  fees: number[];
  amountIn?: bigint;
  amountOutMin?: bigint;
  amountOut?: bigint;
  amountInMax?: bigint;
};

export function tryDecodeUniversal(tx: TransactionResponse): URSwap | null {
  let decoded;
  try {
    decoded = urIface.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    return null;
  }
  if (!decoded) return null;

  const inputs: string[] = decoded.args.inputs;

  // Universal Router executes multiple subcalls
  for (const input of inputs) {
    const fakeTx = { ...tx, data: input } as TransactionResponse;

    // ----- Try V3 decode first -----
    const v3 = tryDecodeV3(fakeTx);
    if (v3) {
      return {
        kind: "ur",
        method: v3.method,
        tokens: v3.tokens,
        fees: v3.fees,
        amountIn: v3.amountIn,
        amountOutMin: v3.amountOutMin,
        amountOut: v3.amountOut,
        amountInMax: v3.amountInMax,
      };
    }

    // ----- Try V2 decode second -----
    const v2 = tryDecodeV2(fakeTx);
    if (v2) {
      // Convert V2 path → tokens[], and set fees = []
      return {
        kind: "ur",
        method: v2.method,
        tokens: v2.path,
        fees: [], // V2 has no fees
        amountIn: v2.amountIn,
        amountOutMin: v2.amountOutMin,
        amountOut: v2.amountOut,
        amountInMax: v2.amountInMax,
      };
    }
  }

  return null;
}
