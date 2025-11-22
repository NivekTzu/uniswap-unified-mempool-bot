import { Interface, TransactionResponse } from "ethers";
import { ABIS } from "../utils/constants.js";

const iface = new Interface(ABIS.V2_ROUTER);

export type V2Swap = {
  kind: "v2";
  method: string;
  path: string[];
  amountIn?: bigint;
  amountOutMin?: bigint;
  amountOut?: bigint;
  amountInMax?: bigint;
};

export function tryDecodeV2(tx: TransactionResponse): V2Swap | null {
  let decoded;
  try {
    decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    return null;
  }
  if (!decoded) return null;

  const name = decoded.name;
  const a = decoded.args;

  const swap: V2Swap = {
    kind: "v2",
    method: name,
    path: [],
  };

  switch (name) {
    // exact in
    case "swapExactTokensForTokens":
    case "swapExactTokensForTokensSupportingFeeOnTransferTokens":
      swap.amountIn = a[0];
      swap.amountOutMin = a[1];
      swap.path = a[2];
      return swap;

    case "swapExactTokensForETH":
    case "swapExactTokensForETHSupportingFeeOnTransferTokens":
      swap.amountIn = a[0];
      swap.amountOutMin = a[1];
      swap.path = a[2];
      return swap;

    case "swapExactETHForTokens":
    case "swapExactETHForTokensSupportingFeeOnTransferTokens":
      swap.amountIn = tx.value ?? 0n;
      swap.amountOutMin = a[0];
      swap.path = a[1];
      return swap;

    // exact out
    case "swapTokensForExactTokens":
    case "swapTokensForExactETH":
      swap.amountOut = a[0];
      swap.amountInMax = a[1];
      swap.path = a[2];
      return swap;

    case "swapETHForExactTokens":
      swap.amountOut = a[0];
      swap.amountInMax = tx.value ?? 0n;
      swap.path = a[1];
      return swap;

    default:
      return null;
  }
}
