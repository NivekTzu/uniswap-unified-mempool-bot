// src/utils/v2Pairs.ts
import { Contract, JsonRpcProvider, keccak256, toUtf8Bytes } from "ethers";
import { ABIS } from "./constants.js";

// Uniswap V2 Factory + init code hash (mainnet canonical)
const V2_FACTORY = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f".toLowerCase();
const INIT_CODE_HASH =
  "0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f";

// CREATE2 pair address
export function computeV2PairAddress(tokenA: string, tokenB: string): string {
  const [t0, t1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA.toLowerCase(), tokenB.toLowerCase()]
      : [tokenB.toLowerCase(), tokenA.toLowerCase()];

  const salt = keccak256("0x" + t0.slice(2) + t1.slice(2));

  const packed =
    "0xff" + V2_FACTORY.slice(2) + salt.slice(2) + INIT_CODE_HASH.slice(2);

  const pair = "0x" + keccak256(packed).slice(26);
  return pair.toLowerCase();
}

export async function getV2Reserves(
  rpc: JsonRpcProvider,
  pairAddr: string
): Promise<{ r0: bigint; r1: bigint; token0: string; token1: string } | null> {
  try {
    const pair = new Contract(pairAddr, ABIS.V2_PAIR, rpc);
    const [token0, token1, reserves] = await Promise.all([
      pair.token0(),
      pair.token1(),
      pair.getReserves(),
    ]);

    return {
      r0: reserves[0],
      r1: reserves[1],
      token0: token0.toLowerCase(),
      token1: token1.toLowerCase(),
    };
  } catch {
    return null;
  }
}
