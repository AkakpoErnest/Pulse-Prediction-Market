// ─── Network ──────────────────────────────────────────────────────────────────
export const SOMNIA_CHAIN_ID = 50312;
export const SOMNIA_RPC      = "https://dream-rpc.somnia.network";
export const SOMNIA_EXPLORER = "https://shannon-explorer.somnia.network";
export const SOMNIA_FAUCET   = "https://testnet.somnia.network/";

// ─── Contract Defaults ────────────────────────────────────────────────────────
export const MIN_BET_ETH       = "0.001";   // STT
export const CREATION_BOND_ETH = "0.01";    // STT
export const PLATFORM_FEE_BPS  = 100;       // 1%
export const CREATOR_FEE_BPS   = 200;       // 2%

// ─── Market ───────────────────────────────────────────────────────────────────
export const MARKET_STATUS = {
  Active:    0,
  Resolved:  1,
  Cancelled: 2,
} as const;

export const OUTCOME = {
  None: 0,
  Yes:  1,
  No:   2,
} as const;

export const COMPARISON_OP = {
  GT:  0,
  GTE: 1,
  LT:  2,
  LTE: 3,
  EQ:  4,
} as const;

export const COMPARISON_OP_LABELS: Record<number, string> = {
  0: ">",
  1: "≥",
  2: "<",
  3: "≤",
  4: "=",
};

// ─── Event Topics ─────────────────────────────────────────────────────────────
/// keccak256("Transfer(address,address,uint256)")
export const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef" as const;

// ─── Durations ────────────────────────────────────────────────────────────────
export const DURATION_OPTIONS = [
  { label: "5 minutes",  value: 300 },
  { label: "1 hour",     value: 3600 },
  { label: "6 hours",    value: 21600 },
  { label: "1 day",      value: 86400 },
  { label: "3 days",     value: 259200 },
  { label: "7 days",     value: 604800 },
  { label: "30 days",    value: 2592000 },
] as const;
