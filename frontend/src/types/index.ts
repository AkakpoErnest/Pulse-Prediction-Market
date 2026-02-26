import { Address } from "viem";

// ─── Market Types ─────────────────────────────────────────────────────────────

export enum MarketStatus {
  Active    = 0,
  Resolved  = 1,
  Cancelled = 2,
}

export enum Outcome {
  None = 0,
  Yes  = 1,
  No   = 2,
}

export enum ComparisonOp {
  GT  = 0,
  GTE = 1,
  LT  = 2,
  LTE = 3,
  EQ  = 4,
}

export interface Market {
  id:                  bigint;
  creator:             Address;
  question:            string;
  watchedContract:     Address;
  eventTopic:          `0x${string}`;
  conditionData:       `0x${string}`;
  endTime:             bigint;
  totalYesBets:        bigint;
  totalNoBets:         bigint;
  status:              MarketStatus;
  outcome:             Outcome;
  createdAt:           bigint;
  resolvedAt:          bigint;
  creatorFeeCollected: bigint;
}

export interface Bet {
  bettor:   Address;
  marketId: bigint;
  isYes:    boolean;
  amount:   bigint;
  claimed:  boolean;
}

// ─── Decoded Condition ────────────────────────────────────────────────────────

export interface DecodedCondition {
  op:        ComparisonOp;
  threshold: bigint;
}

// ─── UI State ─────────────────────────────────────────────────────────────────

export interface CreateMarketForm {
  question:        string;
  watchedContract: string;
  eventTopic:      string;
  conditionOp:     ComparisonOp;
  threshold:       string;    // human-readable STT amount
  durationSeconds: number;
}

// ─── Contract Addresses ───────────────────────────────────────────────────────

export interface DeploymentAddresses {
  network:   string;
  chainId:   number;
  deployer:  string;
  timestamp: string;
  contracts: {
    PulseMarket:        Address;
    SomniaEventHandler: Address;
  };
}
