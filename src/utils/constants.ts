// utils/constants.ts

// -------------------------
// Addresses
// -------------------------
export const ADDRS = {
  // Uniswap V2
  V2_ROUTER: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D".toLowerCase(),
  V2_FACTORY: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f".toLowerCase(),

  // Uniswap V3
  V3_ROUTER: "0xE592427A0AEce92De3Edee1F18E0157C05861564".toLowerCase(),
  V3_FACTORY: "0x1F98431c8aD98523631AE4a59f267346ea31F984".toLowerCase(),

  // Quoter V2 (for real tick-based V3 quotes)
  QUOTER_V2: "0x61fFE014bA17989E743c5F6cB21bF9697530B21e".toLowerCase(),

  // Universal Router
  UNIVERSAL_ROUTERS: [
    "0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD".toLowerCase(),
    "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B".toLowerCase(),
  ],
};

// Alias (optional)
export const ADDRESSES = ADDRS;

// -------------------------
// ABIs
// -------------------------
export const ABIS = {
  // ===== Uniswap V2 Router =====
  V2_ROUTER: [
    "function getAmountsOut(uint amountIn, address[] path) view returns (uint[])",
    "function swapExactETHForTokens(uint amountOutMin,address[] path,address to,uint deadline) payable returns (uint[])",
    "function swapExactTokensForETH(uint amountIn,uint amountOutMin,address[] path,address to,uint deadline) returns (uint[])",
    "function swapExactTokensForTokens(uint amountIn,uint amountOutMin,address[] path,address to,uint deadline) returns (uint[])",
    "function swapETHForExactTokens(uint amountOut,address[] path,address to,uint deadline) payable returns (uint[])",
    "function swapTokensForExactETH(uint amountOut,uint amountInMax,address[] path,address to,uint deadline) returns (uint[])",
    "function swapTokensForExactTokens(uint amountOut,uint amountInMax,address[] path,address to,uint deadline) returns (uint[])",
    "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] path,address to,uint deadline)",
    "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin,address[] path,address to,uint deadline) payable",
    "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] path,address to,uint deadline)",
  ],

  // ===== Uniswap V2 Pair =====
  V2_PAIR: [
    "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
  ],

  // ===== Uniswap V3 Router =====
  V3_ROUTER: [
    "function exactInputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum,uint160 sqrtPriceLimitX96)) returns (uint256)",
    "function exactInput((bytes path,address recipient,uint256 deadline,uint256 amountIn,uint256 amountOutMinimum)) returns (uint256)",
    "function exactOutputSingle((address tokenIn,address tokenOut,uint24 fee,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum,uint160 sqrtPriceLimitX96)) returns (uint256)",
    "function exactOutput((bytes path,address recipient,uint256 deadline,uint256 amountOut,uint256 amountInMaximum)) returns (uint256)",
  ],

  // ===== Uniswap V3 Factory =====
  V3_FACTORY: [
    "function getPool(address tokenA,address tokenB,uint24 fee) view returns (address)",
  ],

  // ===== Uniswap V3 Pool =====
  V3_POOL: [
    "function slot0() view returns (uint160 sqrtPriceX96,int24 tick,uint16,uint16,uint16,uint8,bool)",
    "function liquidity() view returns (uint128)",
    "function token0() view returns (address)",
    "function token1() view returns (address)",
  ],

  // ===== Universal Router =====
  UNIVERSAL_ROUTER: [
    "function execute(bytes commands, bytes[] inputs) payable returns (bytes[])",
  ],

  // ===== Quoter V2 =====
  QUOTER_V2: [
    "function quoteExactInputSingle((address tokenIn,address tokenOut,uint24 fee,uint256 amountIn,uint160 sqrtPriceLimitX96)) view returns (uint256 amountOut, uint160 sqrtPriceX96After, int24 ticksCrossed)",
    "function quoteExactOutputSingle((address tokenIn,address tokenOut,uint24 fee,uint256 amountOut,uint160 sqrtPriceLimitX96)) view returns (uint256 amountIn, uint160 sqrtPriceX96After, int24 ticksCrossed)",
  ],

  // ===== ERC20 =====
  ERC20: [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
  ],
};
