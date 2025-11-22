import { Interface, TransactionResponse } from "ethers";
import { ABIS } from "../utils/constants.js";

const iface = new Interface(ABIS.V3_ROUTER);

export type V3Swap = {
  kind: "v3";
  method: string;
  tokens: string[];
  fees: number[];
  amountIn?: bigint;
  amountOutMin?: bigint;
  amountOut?: bigint;
  amountInMax?: bigint;
};

function decodeV3Path(pathBytes: string, exactOutput = false) {
  const hex = pathBytes.replace("0x", "");
  let i = 0;
  const tokens: string[] = [];
  const fees: number[] = [];

  tokens.push(("0x" + hex.slice(i, i + 40)).toLowerCase());
  i += 40;

  while (i < hex.length) {
    fees.push(parseInt(hex.slice(i, i + 6), 16));
    i += 6;
    tokens.push(("0x" + hex.slice(i, i + 40)).toLowerCase());
    i += 40;
  }

  if (exactOutput) {
    tokens.reverse();
    fees.reverse();
  }

  return { tokens, fees };
}

export function tryDecodeV3(tx: TransactionResponse): V3Swap | null {
  let decoded;
  try {
    decoded = iface.parseTransaction({ data: tx.data, value: tx.value });
  } catch {
    return null;
  }
  if (!decoded) return null;

  const name = decoded.name;
  const a = decoded.args;

  const swap: V3Swap = {
    kind: "v3",
    method: name,
    tokens: [],
    fees: [],
  };

  if (name === "exactInputSingle") {
    const p = a[0];
    swap.tokens = [p.tokenIn.toLowerCase(), p.tokenOut.toLowerCase()];
    swap.fees = [Number(p.fee)];
    swap.amountIn = p.amountIn;
    swap.amountOutMin = p.amountOutMinimum;
    return swap;
  }

  if (name === "exactInput") {
    const p = a[0];
    const o = decodeV3Path(p.path, false);
    swap.tokens = o.tokens;
    swap.fees = o.fees;
    swap.amountIn = p.amountIn;
    swap.amountOutMin = p.amountOutMinimum;
    return swap;
  }

  if (name === "exactOutputSingle") {
    const p = a[0];
    swap.tokens = [p.tokenIn.toLowerCase(), p.tokenOut.toLowerCase()];
    swap.fees = [Number(p.fee)];
    swap.amountOut = p.amountOut;
    swap.amountInMax = p.amountInMaximum;
    return swap;
  }

  if (name === "exactOutput") {
    const p = a[0];
    const o = decodeV3Path(p.path, true);
    swap.tokens = o.tokens;
    swap.fees = o.fees;
    swap.amountOut = p.amountOut;
    swap.amountInMax = p.amountInMaximum;
    return swap;
  }

  return null;
}
