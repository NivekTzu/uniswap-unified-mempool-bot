# Uniswap V2/V3 Unified Mempool Decoder

A high-performance mempool monitoring bot that connects to a **local Ethereum node** (Geth/Prysm) and decodes pending Uniswap V2, Uniswap V3, and Universal Router transactions in real time.

This project is designed for:

- Arbitrage research
- Transaction flow analysis
- MEV inspection
- Studying router behavior
- Understanding how real users and bots interact with Uniswap

The bot is completely self-contained and **requires no Alchemy, Infura, or third-party RPC providers** — it runs entirely on your own node.

---

## 🚀 Features

- 🔍 **Unified Decoder** for Uniswap V2, Uniswap V3, and Universal Router
- ⚡ **Real-time mempool streaming** via local WebSocket provider
- 🧩 Clean TypeScript architecture with modular decoders
- 📦 Easy config system using environment variables
- 🪶 Lightweight and low-latency — no frameworks required
- 🛠 Works with **any local Ethereum node**:
  - Geth
  - Nethermind
  - Erigon
  - Besu

---

## 📁 Project Structure

src/
config.ts # Loads environment variables
index.ts # Main entry: mempool listener
utils/ # Helpers, ABIs, formatting
decoders/
v2.ts # Uniswap V2 swap decoder
v3.ts # Uniswap V3 swap decoder
universal.ts # Universal Router decoder
types/ # Shared interfaces

---

## 🔧 Requirements

- Node.js 18+
- A running Ethereum execution client with:
  - HTTP RPC enabled (`8545`)
  - WebSocket RPC enabled (`8546`)
- Yarn or npm
- TypeScript (automatically installed via package.json)

Example Geth command (for reference):

```bash
geth --http --http.api "eth,net,web3,txpool" --http.port 8545 \
     --ws --ws.api "eth,net,web3,txpool" --ws.port 8546


🛠 Installation

Clone the repository:

git clone https://github.com/NivekTzu/uniswap-unified-mempool-bot.git
cd uniswap-unified-mempool-bot


Install dependencies:

npm install


or

yarn install

🔐 Environment Variables

Create a file named .env:

RPC_HTTP=http://127.0.0.1:8545
RPC_WS=ws://127.0.0.1:8546


Or copy the example:

cp .env.example .env

▶️ Running the Bot

Development mode (TypeScript directly):

npm run dev


Production build:

npm run build
npm start

📡 Output Example

When a new swap is detected:

[UR] Swap
  from: 0x1234...
  tokens: WETH → USDC
  amountIn: 0.52
  amountOutMin: 1234.12
  pool: 0x88e6... (Uniswap V3 0.05%)


Or for V2:

[V2] SwapExactTokensForTokens
  tokenIn: USDC
  tokenOut: WETH
  amountIn: 1500
  amountOutMin: 0.915
  path: USDC → WETH
```

🧪 Future Enhancements

Real-time arbitrage surface detection

Bundling & sending flashbots bundles

Persisting decoded mempool txs to a database

Accounting for V3 quoter fees/slippage

Tracking MEV bot activity

Integrating with ERC-20 metadata automatically

🤝 Contributing
PRs are welcome!
Feel free to open issues for:

New decoders

Architecture improvements

Performance optimizations

Bug reports

📜 License
MIT — free to use, modify, and learn from.

⭐ Support
If this project helped you understand Uniswap internals or build your own mempool tools, give it a star ⭐ on GitHub!

---

# 🎉 README is ready.

If you'd like, I can also generate:

### ✔ A good first commit message

### ✔ Your GitHub repo description + tags

### ✔ A project banner image

### ✔ A detailed architecture diagram

### ✔ A step-by-step walkthrough for contributors

### ✔ A CHANGELOG.md + versioning setup

Just tell me what you want next!
