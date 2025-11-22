import * as dotenv from "dotenv";
dotenv.config();

function required(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  return value;
}

export const CONFIG = {
  RPC_HTTP: required("RPC_HTTP"),
  RPC_WS: required("RPC_WS"),
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
  NETWORK: process.env.NETWORK ?? "mainnet",
  SAVE_TX_LOGS: process.env.SAVE_TX_LOGS === "true",
  ALERT_WEBHOOK_URL: process.env.ALERT_WEBHOOK_URL ?? null,
};
